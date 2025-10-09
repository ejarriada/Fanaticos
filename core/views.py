import datetime
import json
from django.utils import timezone
import uuid
import qrcode
import base64
from io import BytesIO
from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db import models, transaction
from django.db.models import Sum, Count, F, Avg, Case, When
from .models import (
    Product, Tenant, User, SystemRole, Process, OrderNote, ProductionOrder, 
    RawMaterial, Brand, MateriaPrimaProveedor, PedidoMaterial, # Refactored Raw Material Models
    ProductionProcessLog, Local, Sale, Inventory, 
    Supplier, PurchaseOrder, PurchaseOrderItem, Account, CashRegister, Transaction, 
    Client, Invoice, Payment, BankStatement, BankTransaction, Bank, 
    PaymentMethodType, FinancialCostRule, Factory, EmployeeRole, Employee, 
    Salary, Vacation, Permit, MedicalRecord, Quotation, QuotationItem, StockAdjustment,
    Design, DesignMaterial, DesignProcess, SaleItem, DeliveryNote, DeliveryNoteItem, DesignFile, ProductFile, Contact,
    MedicalRecord, Quotation, QuotationItem, StockAdjustment,
    Design, DesignMaterial, DesignProcess, SaleItem, DeliveryNote, DeliveryNoteItem,
    Category, Size, Color, Check, Warehouse
)
from .serializers import (
    ProductSerializer, TenantSerializer, UserSerializer, UserCreateSerializer, 
    SystemRoleSerializer, ProcessSerializer, OrderNoteSerializer, 
    ProductionOrderSerializer, 
    RawMaterialSerializer, BrandSerializer, MateriaPrimaProveedorSerializer, PedidoMaterialSerializer, # Refactored Raw Material Serializers
    ProductionProcessLogSerializer, LocalSerializer, SaleSerializer, 
    InventorySerializer, SupplierSerializer, PurchaseOrderSerializer, 
    PurchaseOrderItemSerializer, AccountSerializer, CashRegisterSerializer, 
    TransactionSerializer, ClientSerializer, InvoiceSerializer, PaymentSerializer, 
    BankStatementSerializer, BankTransactionSerializer, BankSerializer, 
    PaymentMethodTypeSerializer, FinancialCostRuleSerializer, FactorySerializer, 
    EmployeeRoleSerializer, EmployeeSerializer, SalarySerializer, VacationSerializer, 
    PermitSerializer, MedicalRecordSerializer, StockAdjustmentSerializer, QuotationSerializer, QuotationItemSerializer,
    DesignSerializer, SaleItemSerializer, DeliveryNoteSerializer, DeliveryNoteItemSerializer, 
    DesignMaterialSerializer, DesignProcessSerializer, DesignFileSerializer, ProductFileSerializer, ContactSerializer,
    CategorySerializer, SizeSerializer, ColorSerializer, CheckSerializer, TenantTokenObtainPairSerializer, WarehouseSerializer
)

# Base ViewSet for Tenant-Aware Models
class TenantAwareViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_tenant(self):
        tenant_id = self.request.headers.get('X-Tenant-ID')
        if not tenant_id:
            if self.request.method == 'POST' and 'tenant' in self.request.data:
                tenant_id = self.request.data['tenant']
            else:
                 raise PermissionDenied("X-Tenant-ID header is required.")
        try:
            return Tenant.objects.get(id=tenant_id)
        except Tenant.DoesNotExist:
            raise PermissionDenied("Tenant not found.")

    def get_queryset(self):
        tenant = self.get_tenant()
        return self.queryset.filter(tenant=tenant)

    def perform_create(self, serializer):
        tenant = self.get_tenant()
        serializer.save(tenant=tenant)

# Tenant-aware ViewSets
class ProductViewSet(TenantAwareViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    
    def perform_create(self, serializer):
        tenant = self.get_tenant()
        
        # Obtener design_id y color_ids del request
        design_id = self.request.data.get('design')
        color_ids = self.request.data.getlist('color_ids')
        
        # Guardar el producto
        product = serializer.save(tenant=tenant)
        
        # Asociar el diseño si existe
        if design_id:
            try:
                design = Design.objects.get(id=design_id, tenant=tenant)
                product.design = design
                product.save()
            except Design.DoesNotExist:
                pass
        
        # Asociar los colores
        if color_ids:
            product.colors.set(color_ids)
    
    def perform_update(self, serializer):
        # Obtener color_ids del request (design no se modifica en edición)
        color_ids = self.request.data.getlist('color_ids')
        
        # Actualizar el producto
        product = serializer.save()
        
        # Actualizar los colores
        if color_ids:
            product.colors.set(color_ids)

class ProductFileViewSet(TenantAwareViewSet):
    queryset = ProductFile.objects.all()
    serializer_class = ProductFileSerializer

class SystemRoleViewSet(TenantAwareViewSet): queryset = SystemRole.objects.all(); serializer_class = SystemRoleSerializer
class ProcessViewSet(TenantAwareViewSet): queryset = Process.objects.all(); serializer_class = ProcessSerializer
class OrderNoteViewSet(TenantAwareViewSet): queryset = OrderNote.objects.all(); serializer_class = OrderNoteSerializer
class ProductionOrderViewSet(TenantAwareViewSet):
    queryset = ProductionOrder.objects.all()
    serializer_class = ProductionOrderSerializer

    def get_queryset(self):
        queryset = super().get_queryset().prefetch_related('items') # Add prefetch_related
        op_type = self.request.query_params.get('op_type')
        if op_type:
            queryset = queryset.filter(op_type=op_type)
        return queryset

    def perform_create(self, serializer):
        tenant = self.get_tenant()
        serializer.save(tenant=tenant)

    @action(detail=True, methods=['post'], url_path='complete-process')
    def complete_process(self, request, pk=None):
        production_order = self.get_object()
        process_name = request.data.get('process_name')

        if not process_name:
            return Response({'error': 'process_name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        design = production_order.base_product.design
        if not design:
            return Response({'error': 'Production order has no associated design.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            design_process = DesignProcess.objects.get(design=design, process__name=process_name)
        except DesignProcess.DoesNotExist:
            return Response({'error': f'Process {process_name} not found in the design for this order.'}, status=status.HTTP_404_NOT_FOUND)

        materials_to_consume = design_process.materials.all()
        if not materials_to_consume.exists():
            # If it's the packaging process, still mark as complete and update inventory
            if process_name == 'Empaque':
                with transaction.atomic():
                    self._update_finished_product_inventory(production_order)
                    production_order.status = 'Completada'
                    production_order.save()
                return Response({'message': 'Process Empaque completed. No materials consumed. Inventory updated.'}, status=status.HTTP_200_OK)
            return Response({'message': f'Process {process_name} completed. No materials were consumed.'}, status=status.HTTP_200_OK)

        with transaction.atomic():
            for material_in_recipe in materials_to_consume:
                raw_material = material_in_recipe.raw_material
                # Calculate total quantity to deduct for the entire production order
                total_items_quantity = production_order.items.aggregate(total_quantity=Sum('quantity'))['total_quantity'] or 0
                quantity_to_deduct = material_in_recipe.quantity * total_items_quantity

                # Find a supplier with enough stock
                supplier_inventory = MateriaPrimaProveedor.objects.filter(
                    raw_material=raw_material,
                    current_stock__gte=quantity_to_deduct
                ).order_by('cost').first() # Simple strategy: use the cheapest supplier with enough stock

                if not supplier_inventory:
                    raise transaction.TransactionManagementError(
                        f'Insufficient stock for {raw_material.name}. Required: {quantity_to_deduct}, but no single supplier has enough.'
                    )
                
                # Deduct the stock
                supplier_inventory.current_stock -= quantity_to_deduct
                supplier_inventory.save()

            # If the completed process is Empaque, update inventory and order status
            if process_name == 'Empaque':
                self._update_finished_product_inventory(production_order)
                production_order.status = 'Completada'
                production_order.save()

        return Response({'message': f'Process {process_name} completed and materials deducted successfully.'}, status=status.HTTP_200_OK)

    def _update_finished_product_inventory(self, production_order):
        factory_local, created = Local.objects.get_or_create(
            name='Fábrica',
            tenant=production_order.tenant
        )
        for item in production_order.items.all():
            inventory_item, created = Inventory.objects.get_or_create(
                product=item.product,
                local=factory_local,
                tenant=production_order.tenant
            )
            inventory_item.quantity += item.quantity
            inventory_item.save()

    @action(detail=True, methods=['post'])
    def generate_qr_code(self, request, pk=None):
        production_order = self.get_object()
        
        qr_data_str = (
            f"OP ID: {production_order.id}\n"
            f"Tipo: {production_order.op_type}\n"
            f"Producto Base: {production_order.base_product.name if production_order.base_product else 'N/A'}\n"
            f"Estado: {production_order.status}"
        )

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data_str)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

        return Response({'qr_code_data': qr_code_base64}, status=status.HTTP_200_OK)

class RawMaterialViewSet(TenantAwareViewSet):
    queryset = RawMaterial.objects.all()
    serializer_class = RawMaterialSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        name = self.request.query_params.get('name')
        if name:
            queryset = queryset.filter(name__iexact=name)
        return queryset

class BrandViewSet(TenantAwareViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer

class MateriaPrimaProveedorViewSet(TenantAwareViewSet):
    queryset = MateriaPrimaProveedor.objects.all()
    serializer_class = MateriaPrimaProveedorSerializer

    def perform_create(self, serializer):
        tenant = self.get_tenant()
        # Generate a unique batch number
        batch_number = str(uuid.uuid4())
        serializer.save(tenant=tenant, batch_number=batch_number)

    @action(detail=True, methods=['post'])
    def generate_qr_code(self, request, pk=None):
        sourced_material = self.get_object()
        raw_material = sourced_material.raw_material
        
        # Calculate total stock for this raw material across all suppliers
        total_stock = MateriaPrimaProveedor.objects.filter(
            raw_material=raw_material,
            tenant=sourced_material.tenant
        ).aggregate(total=Sum('current_stock'))['total'] or 0
        
        # Manejar proveedor opcional
        supplier_name = sourced_material.supplier.name if sourced_material.supplier else 'Sin proveedor'
        batch_number = sourced_material.batch_number if sourced_material.batch_number else 'Sin lote'
        
        qr_data_str = (
            f"Material: {raw_material.name}\n"
            f"Proveedor: {supplier_name}\n"
            f"Lote: {batch_number}\n"
            f"Stock del Lote: {sourced_material.current_stock}\n"
            f"Stock Total (Material): {total_stock}"
        )
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data_str)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        sourced_material.qr_code_data = qr_code_base64
        sourced_material.save()
        
        return Response({'qr_code_data': qr_code_base64}, status=status.HTTP_200_OK)


class ProductionProcessLogViewSet(TenantAwareViewSet): queryset = ProductionProcessLog.objects.all(); serializer_class = ProductionProcessLogSerializer
class DesignViewSet(TenantAwareViewSet):
    queryset = Design.objects.all()
    serializer_class = DesignSerializer

    def perform_create(self, serializer):
        # Save the design first to get an instance
        design = serializer.save(tenant=self.get_tenant())
        self._calculate_and_save_cost(design)

    def perform_update(self, serializer):
        # Save the updated design
        design = serializer.save()
        self._calculate_and_save_cost(design)

    def _calculate_and_save_cost(self, design):
        total_material_cost = design.designmaterial_set.aggregate(
            total=Sum(F('quantity') * F('cost')) # Changed F('raw_material__cost') to F('cost')
        )['total'] or 0

        total_process_cost = design.designprocess_set.aggregate(
            total=Sum('cost')
        )['total'] or 0

        design.calculated_cost = total_material_cost + total_process_cost
        design.save(update_fields=['calculated_cost'])


class DesignFileViewSet(TenantAwareViewSet):
    queryset = DesignFile.objects.all()
    serializer_class = DesignFileSerializer

class CategoryViewSet(TenantAwareViewSet): queryset = Category.objects.all(); serializer_class = CategorySerializer # NEW
class SizeViewSet(TenantAwareViewSet): queryset = Size.objects.all(); serializer_class = SizeSerializer         # NEW

class ColorViewSet(TenantAwareViewSet): queryset = Color.objects.all(); serializer_class = ColorSerializer
class LocalViewSet(TenantAwareViewSet):
    queryset = Local.objects.all()
    serializer_class = LocalSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check for finished product stock
        if Inventory.objects.filter(local=instance, quantity__gt=0).exists():
            return Response(
                {'error': 'No se puede eliminar el almacén porque tiene stock de productos terminados.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Check for raw material stock
        if MateriaPrimaProveedor.objects.filter(local=instance, current_stock__gt=0).exists():
            return Response(
                {'error': 'No se puede eliminar el almacén porque tiene stock de materias primas.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Check for associated cash registers
        if CashRegister.objects.filter(local=instance).exists():
            return Response(
                {'error': 'No se puede eliminar el almacén porque tiene cajas registradoras asociadas.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Check for assigned employees
        if Employee.objects.filter(local=instance).exists():
            return Response(
                {'error': 'No se puede eliminar el almacén porque tiene empleados asignados.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for sales made from this local
        if Sale.objects.filter(local=instance).exists():
            return Response(
                {'error': 'No se puede eliminar el almacén porque se han registrado ventas en él.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().destroy(request, *args, **kwargs)

class SaleViewSet(TenantAwareViewSet):
    queryset = Sale.objects.all().order_by('-sale_date')
    serializer_class = SaleSerializer

    @action(detail=False, methods=['get'], url_path='available-for-order-note')
    def available_for_order_note(self, request, *args, **kwargs):
        queryset = self.get_queryset().filter(order_note__isnull=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_queryset(self):
        queryset = super().get_queryset()
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)

        if start_date:
            queryset = queryset.filter(sale_date__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(sale_date__date__lte=end_date)

        return queryset
            
    def perform_create(self, serializer):
        # Métodos de pago que se consideran al contado y deben generar un pago inmediato.
        IMMEDIATE_PAYMENT_METHODS = ['Efectivo', 'Transferencia', 'Mercado Pago']

        tenant = self.get_tenant()
        
        # Usar una transacción atómica para asegurar la integridad de los datos.
        # O se crea la venta y el pago, o no se crea nada.
        with transaction.atomic():
            # Guardar la venta principal
            sale = serializer.save(tenant=tenant, user=self.request.user)

            # Verificar si el método de pago requiere un registro de pago inmediato.
            if sale.payment_method in IMMEDIATE_PAYMENT_METHODS:
                # Buscar la cuenta de 'Caja' o una cuenta de activo para registrar el ingreso.
                # Esto asume que existe una cuenta apropiada.
                cash_account = Account.objects.filter(
                    tenant=tenant,
                    account_type='Activo',
                    name__icontains='Caja'
                ).first()

                # Si no se encuentra una cuenta de caja, se busca la primera cuenta de activo como fallback.
                if not cash_account:
                    cash_account = Account.objects.filter(
                        tenant=tenant,
                        account_type='Activo'
                    ).first()
                
                # Si, y solo si, se encuentra una cuenta donde registrar el pago, se crea la transacción.
                if cash_account:
                    Transaction.objects.create(
                        tenant=tenant,
                        account=cash_account,
                        amount=sale.total_amount,  # Monto positivo, es un ingreso/pago.
                        description=f"Pago automático por Venta #{sale.id} ({sale.payment_method})",
                        related_sale=sale,
                        date=sale.sale_date
                    )
                # Nota: Si no existe una cuenta de 'Activo', la transacción de pago no se creará,
                # y el problema de balance negativo persistiría en ese caso excepcional.
                # Se asume que la configuración del sistema incluye al menos una cuenta de activo.


class InventoryViewSet(TenantAwareViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer

    @action(detail=True, methods=['post'], url_path='transfer-stock')
    def transfer_stock(self, request, pk=None):
        source_inventory = self.get_object()
        destination_local_id = request.data.get('destination_local_id')
        quantity_to_transfer = request.data.get('quantity_to_transfer')

        if not destination_local_id or not quantity_to_transfer:
            return Response({'error': 'destination_local_id and quantity_to_transfer are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quantity_to_transfer = int(quantity_to_transfer)
            if quantity_to_transfer <= 0:
                raise ValueError()
        except (ValueError, TypeError):
            return Response({'error': 'quantity_to_transfer must be a positive integer.'}, status=status.HTTP_400_BAD_REQUEST)

        if source_inventory.quantity < quantity_to_transfer:
            return Response({'error': 'Insufficient stock for transfer.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            destination_local = Local.objects.get(id=destination_local_id, tenant=self.get_tenant())
        except Local.DoesNotExist:
            return Response({'error': 'Destination warehouse not found.'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            # Decrease stock from source
            source_inventory.quantity -= quantity_to_transfer
            source_inventory.save()

            # Get or create destination inventory record and increase stock
            destination_inventory, created = Inventory.objects.get_or_create(
                product=source_inventory.product,
                local=destination_local,
                tenant=self.get_tenant(),
                defaults={'quantity': 0}
            )
            destination_inventory.quantity += quantity_to_transfer
            destination_inventory.save()

        return Response({'message': 'Stock transferred successfully.'}, status=status.HTTP_200_OK)

class WarehouseViewSet(TenantAwareViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer

class SupplierViewSet(TenantAwareViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer

    @action(detail=True, methods=['get'], url_path='account-movements')
    def account_movements(self, request, pk=None):
        supplier = self.get_object()
        tenant = self.get_tenant()

        # Obtener todas las compras del proveedor (movimientos DEBE - negativos)
        purchases = PurchaseOrder.objects.filter(
            supplier=supplier, 
            tenant=tenant
        ).annotate(
            calculated_total=Sum(F('items__quantity') * F('items__unit_price'))
        )

        # Obtener todos los pagos al proveedor (movimientos HABER - positivos)
        payments = Payment.objects.filter(
            purchase_order__supplier=supplier,
            purchase_order__tenant=tenant
        )

        # Crear lista de movimientos
        movements = []
        
        # Agregar compras como DEBE (negativo)
        for purchase in purchases:
            movements.append({
                'id': f"C-{purchase.id}",
                'type': 'Compra',
                'detail': f"Orden de Compra #{purchase.id}",
                'amount': -(purchase.calculated_total or 0),  # Negativo porque es deuda
                'date': purchase.order_date
            })
        
        # Agregar pagos como HABER (positivo)
        for payment in payments:
            movements.append({
                'id': f"P-{payment.id}",
                'type': 'Pago',
                'detail': f"Pago {payment.payment_method}",
                'amount': payment.amount,  # Positivo porque reduce la deuda
                'date': payment.date
            })

        # Ordenar por fecha
        movements.sort(key=lambda x: x['date'])

        # Calcular balance acumulado
        balance = Decimal('0.00')
        movements_with_balance = []
        
        for movement in movements:
            balance += Decimal(str(movement['amount']))
            movements_with_balance.append({
                'id': movement['id'],
                'type': movement['type'],
                'detail': movement['detail'],
                'amount': float(movement['amount']),
                'balance': float(balance),
                'date': movement['date'].strftime('%Y-%m-%d')
            })

        return Response(movements_with_balance)
class PurchaseOrderViewSet(TenantAwareViewSet):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        supplier_id = self.request.query_params.get('supplier')
        if supplier_id:
            queryset = queryset.filter(supplier_id=supplier_id)
        return queryset

    def perform_create(self, serializer):
        tenant = self.get_tenant()
        serializer.save(tenant=tenant, user=self.request.user)
class PurchaseOrderItemViewSet(TenantAwareViewSet): queryset = PurchaseOrderItem.objects.all(); serializer_class = PurchaseOrderItemSerializer
class AccountViewSet(TenantAwareViewSet): queryset = Account.objects.all(); serializer_class = AccountSerializer
class CashRegisterViewSet(TenantAwareViewSet): queryset = CashRegister.objects.all(); serializer_class = CashRegisterSerializer
class TransactionViewSet(TenantAwareViewSet): queryset = Transaction.objects.all(); serializer_class = TransactionSerializer
class ClientViewSet(TenantAwareViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer

    @action(detail=True, methods=['get'], url_path='current-account-balance')
    def get_current_account_balance(self, request, pk=None):
        client = self.get_object()
        tenant = self.get_tenant()
        
        balance = Transaction.objects.filter(
            related_sale__client=client,
            tenant=tenant
        ).aggregate(total_amount=Sum('amount'))['total_amount']
        
        return Response({'balance': balance or 0.00}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='account-movements')
    def account_movements(self, request, pk=None):
        from decimal import Decimal
        client = self.get_object()
        tenant = self.get_tenant()

        # Obtener todas las ventas del cliente (movimientos DEBE)
        sales = Sale.objects.filter(client=client, tenant=tenant)

        # Obtener todos los pagos del cliente (movimientos HABER)
        payments = Transaction.objects.filter(
            related_sale__client=client,
            tenant=tenant,
            amount__gt=0
        )

        # Crear lista de movimientos
        movements = []
        
        # Agregar ventas como DEBE (negativo)
        for sale in sales:
            movements.append({
                'id': f"V-{sale.id}",
                'type': 'Venta',
                'detail': f"Venta #{sale.id}",
                'amount': -float(sale.total_amount),
                'date': sale.sale_date.date() if hasattr(sale.sale_date, 'date') else sale.sale_date,
                'user': sale.user.email if sale.user else 'N/A'
            })
        
        # Agregar pagos como HABER (positivo)
        for payment in payments:
            movements.append({
                'id': f"P-{payment.id}",
                'type': 'Pago',
                'detail': payment.description or 'Pago',
                'amount': float(payment.amount),
                'date': payment.date,
                'user': 'N/A'
            })

        # Ordenar por fecha
        movements.sort(key=lambda x: x['date'])

        # Calcular balance acumulado
        balance = Decimal('0.00')
        movements_with_balance = []
        
        for movement in movements:
            balance += Decimal(str(movement['amount']))
            movements_with_balance.append({
                'id': movement['id'],
                'type': movement['type'],
                'detail': movement['detail'],
                'amount': movement['amount'],
                'balance': float(balance),
                'date': movement['date'].strftime('%Y-%m-%d') if hasattr(movement['date'], 'strftime') else str(movement['date']),
                'user': movement['user']
            })

        return Response(movements_with_balance)

    @action(detail=True, methods=['post'], url_path='register-payment')
    def register_payment(self, request, pk=None):
        from decimal import Decimal
        from django.db import transaction as db_transaction
        
        client = self.get_object()
        tenant = self.get_tenant()
        
        # Obtener datos del request
        sale_id = request.data.get('sale_id')
        amount = Decimal(str(request.data.get('amount', 0)))
        payment_method_id = request.data.get('payment_method_id')
        account_id = request.data.get('account_id')
        cash_register_id = request.data.get('cash_register_id')
        bank_id = request.data.get('bank_id')
        description = request.data.get('description', '')
        
        # Validaciones
        if not sale_id:
            return Response({'error': 'Se debe especificar una venta'}, status=status.HTTP_400_BAD_REQUEST)
        
        if amount <= 0:
            return Response({'error': 'El monto debe ser mayor a cero'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            sale = Sale.objects.get(id=sale_id, client=client, tenant=tenant)
        except Sale.DoesNotExist:
            return Response({'error': 'Venta no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            account = Account.objects.get(id=account_id, tenant=tenant)
        except Account.DoesNotExist:
            return Response({'error': 'Cuenta no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        
        # Calcular saldo pendiente de la venta
        total_pagado = Transaction.objects.filter(
            related_sale=sale,
            tenant=tenant,
            amount__gt=0
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        saldo_pendiente = sale.total_amount - total_pagado
        
        if amount > saldo_pendiente:
            return Response({
                'error': f'El monto (${amount}) excede el saldo pendiente (${saldo_pendiente})'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calcular costo financiero si aplica
        costo_financiero = Decimal('0.00')
        monto_neto = amount
        
        if payment_method_id:
            try:
                payment_method = PaymentMethodType.objects.get(id=payment_method_id, tenant=tenant)
                
                # Buscar regla de costo financiero (considerando banco si se especifica)
                financial_rule_query = FinancialCostRule.objects.filter(
                    payment_method=payment_method,
                    tenant=tenant
                )
                
                if bank_id:
                    try:
                        bank = Bank.objects.get(id=bank_id, tenant=tenant)
                        # Priorizar regla específica del banco
                        financial_rule = financial_rule_query.filter(bank=bank).first()
                        if not financial_rule:
                            # Si no hay regla específica, usar la general
                            financial_rule = financial_rule_query.filter(bank__isnull=True).first()
                    except Bank.DoesNotExist:
                        financial_rule = financial_rule_query.filter(bank__isnull=True).first()
                else:
                    financial_rule = financial_rule_query.filter(bank__isnull=True).first()
                
                if financial_rule:
                    costo_financiero = amount * (financial_rule.percentage / Decimal('100'))
                    monto_neto = amount - costo_financiero
            
            except PaymentMethodType.DoesNotExist:
                pass
        
        # Crear transacción
        with db_transaction.atomic():
            # Transacción principal (cobro)
            trans = Transaction.objects.create(
                tenant=tenant,
                description=description or f"Cobro de Venta #{sale.id}",
                amount=amount,
                account=account,
                cash_register_id=cash_register_id if cash_register_id else None,
                related_sale=sale
            )
            
            # Si hay costo financiero, crear transacción de egreso
            if costo_financiero > 0:
                egreso_account = Account.objects.filter(
                    tenant=tenant,
                    account_type='Egreso'
                ).filter(
                    models.Q(name__icontains='financiero') | 
                    models.Q(name__icontains='comision') |
                    models.Q(name__icontains='costo')
                ).first()
                
                if not egreso_account:
                    # Si no existe, crear una cuenta de egresos genérica
                    egreso_account = Account.objects.filter(
                        tenant=tenant,
                        account_type='Egreso'
                    ).first()
                
                if egreso_account:
                    Transaction.objects.create(
                        tenant=tenant,
                        description=f"Costo financiero - {payment_method.name}",
                        amount=-costo_financiero,
                        account=egreso_account,
                        related_sale=sale
                    )
        
        return Response({
            'message': 'Cobro registrado exitosamente',
            'transaction_id': trans.id,
            'monto_cobrado': float(amount),
            'costo_financiero': float(costo_financiero),
            'monto_neto': float(monto_neto),
            'saldo_restante': float(saldo_pendiente - amount)
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='pending-sales')
    def pending_sales(self, request, pk=None):
        from decimal import Decimal
        client = self.get_object()
        tenant = self.get_tenant()
        
        sales = Sale.objects.filter(client=client, tenant=tenant).order_by('-sale_date')
        
        sales_with_balance = []
        for sale in sales:
            total_pagado = Transaction.objects.filter(
                related_sale=sale,
                tenant=tenant,
                amount__gt=0
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            
            saldo_pendiente = sale.total_amount - total_pagado
            
            if saldo_pendiente > 0:
                sales_with_balance.append({
                    'id': sale.id,
                    'sale_date': sale.sale_date.strftime('%Y-%m-%d'),
                    'total_amount': float(sale.total_amount),
                    'paid_amount': float(total_pagado),
                    'pending_balance': float(saldo_pendiente),
                    'description': f"Venta #{sale.id} - {sale.sale_date.strftime('%d/%m/%Y')}"
                })
        
        return Response(sales_with_balance)

class ContactViewSet(TenantAwareViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer

class InvoiceViewSet(TenantAwareViewSet): queryset = Invoice.objects.all(); serializer_class = InvoiceSerializer
class PaymentViewSet(TenantAwareViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        purchase_order_id = self.request.query_params.get('purchase_order')
        if purchase_order_id:
            queryset = queryset.filter(purchase_order_id=purchase_order_id)
        return queryset
class BankStatementViewSet(TenantAwareViewSet): queryset = BankStatement.objects.all(); serializer_class = BankStatementSerializer
class BankTransactionViewSet(TenantAwareViewSet): queryset = BankTransaction.objects.all(); serializer_class = BankTransactionSerializer
class BankViewSet(TenantAwareViewSet): queryset = Bank.objects.all(); serializer_class = BankSerializer
class PaymentMethodTypeViewSet(TenantAwareViewSet): queryset = PaymentMethodType.objects.all(); serializer_class = PaymentMethodTypeSerializer
class FinancialCostRuleViewSet(TenantAwareViewSet): queryset = FinancialCostRule.objects.all(); serializer_class = FinancialCostRuleSerializer
class FactoryViewSet(TenantAwareViewSet): queryset = Factory.objects.all(); serializer_class = FactorySerializer
class EmployeeRoleViewSet(TenantAwareViewSet): queryset = EmployeeRole.objects.all(); serializer_class = EmployeeRoleSerializer
class EmployeeViewSet(TenantAwareViewSet): queryset = Employee.objects.all(); serializer_class = EmployeeSerializer
class SalaryViewSet(TenantAwareViewSet): queryset = Salary.objects.all(); serializer_class = SalarySerializer
class VacationViewSet(TenantAwareViewSet): queryset = Vacation.objects.all(); serializer_class = VacationSerializer
class PermitViewSet(TenantAwareViewSet): queryset = Permit.objects.all(); serializer_class = PermitSerializer
class MedicalRecordViewSet(TenantAwareViewSet): queryset = MedicalRecord.objects.all(); serializer_class = MedicalRecordSerializer

class PedidoMaterialViewSet(TenantAwareViewSet):
    queryset = PedidoMaterial.objects.all()
    serializer_class = PedidoMaterialSerializer

class CheckViewSet(TenantAwareViewSet): queryset = Check.objects.all(); serializer_class = CheckSerializer
class QuotationViewSet(TenantAwareViewSet):
    queryset = Quotation.objects.all()
    serializer_class = QuotationSerializer

    def perform_create(self, serializer):
        serializer.save(tenant=self.get_tenant(), user=self.request.user)

    @action(detail=True, methods=['post'], url_path='convert-to-sale')
    def convert_to_sale(self, request, pk=None):
        quotation = self.get_object()
        tenant = self.get_tenant()

        if quotation.status == 'Aceptada':
            return Response({'error': 'La cotización ya ha sido aceptada y convertida en venta.'}, status=status.HTTP_400_BAD_REQUEST)

        sale_data = {
            'client': quotation.client.id,
            'local': None,
            'payment_method': 'A definir',
            'related_quotation': quotation.id,
            'tenant': tenant.id
        }
        sale_serializer = SaleSerializer(data=sale_data, context={'request': request})
        sale_serializer.is_valid(raise_exception=True)
        sale = sale_serializer.save()

        total_sale_amount = 0
        for quotation_item in quotation.items.all():
            # Validar que el producto tenga diseño
            if not quotation_item.product:
                return Response(
                    {'error': f'Item {quotation_item.id} no tiene producto asociado.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not quotation_item.product.design:
                return Response(
                    {'error': f'El producto {quotation_item.product.name} no tiene diseño asociado.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Corregido: acceder al design a través del product
            calculated_cost = quotation_item.product.design.calculated_cost
            recalculated_unit_price = calculated_cost * Decimal('1.20')
            recalculated_cost = calculated_cost
            
            sale_item_data = {
                'sale': sale.id,
                'product': quotation_item.product.id,
                'quantity': quotation_item.quantity,
                'unit_price': recalculated_unit_price,
                'cost': recalculated_cost,
                'tenant': tenant.id
            }
            sale_item_serializer = SaleItemSerializer(data=sale_item_data, context={'request': request})
            sale_item_serializer.is_valid(raise_exception=True)
            sale_item_serializer.save()
            total_sale_amount += (quotation_item.quantity * recalculated_unit_price)
        sale.total_amount = total_sale_amount
        sale.save()

        quotation.status = 'Aceptada'
        quotation.save()

        return Response(SaleSerializer(sale, context={'request': request}).data, status=status.HTTP_201_CREATED)
class QuotationItemViewSet(TenantAwareViewSet): queryset = QuotationItem.objects.all(); serializer_class = QuotationItemSerializer
class StockAdjustmentViewSet(TenantAwareViewSet):
    queryset = StockAdjustment.objects.all()
    serializer_class = StockAdjustmentSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        quantity = serializer.validated_data.get('quantity')
        inventory_id = request.data.get('inventory_id')
        raw_material_supplier_id = request.data.get('raw_material_supplier_id')

        if inventory_id:
            try:
                inventory_item = Inventory.objects.get(id=inventory_id, tenant=self.get_tenant())
                inventory_item.quantity += quantity
                inventory_item.save()
                serializer.validated_data['product'] = inventory_item.product
            except Inventory.DoesNotExist:
                return Response({'error': 'El registro de inventario del producto no fue encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        elif raw_material_supplier_id:
            try:
                rmp_item = MateriaPrimaProveedor.objects.get(id=raw_material_supplier_id, tenant=self.get_tenant())
                rmp_item.current_stock += quantity
                rmp_item.save()
                serializer.validated_data['raw_material'] = rmp_item.raw_material
            except MateriaPrimaProveedor.DoesNotExist:
                return Response({'error': 'El registro de stock de materia prima no fue encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        
        else:
            return Response({'error': 'Debe especificar un item de inventario o de materia prima para ajustar.'}, status=status.HTTP_400_BAD_REQUEST)

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
class DeliveryNoteViewSet(TenantAwareViewSet):
    queryset = DeliveryNote.objects.all()
    serializer_class = DeliveryNoteSerializer

    def perform_create(self, serializer):
        with transaction.atomic():
            # Get or create factory local
            factory_local, created = Local.objects.get_or_create(
                name='Fábrica',
                tenant=self.get_tenant()
            )
            
            # Get the sale from validated_data to validate quantities
            sale = serializer.validated_data.get('sale')
            
            if not sale:
                raise serializers.ValidationError("Se requiere especificar una venta.")
            
            # Validate each item
            for item_data in serializer.validated_data['items']:
                product = item_data['product']
                quantity_to_deduct = item_data['quantity']
                
                # NUEVA VALIDACIÓN: Verificar que no se exceda la cantidad vendida
                # Cantidad total vendida de este producto en esta venta
                sold_quantity = SaleItem.objects.filter(
                    sale=sale, 
                    product=product,
                    tenant=self.get_tenant()
                ).aggregate(total=Sum('quantity'))['total'] or 0
                
                if sold_quantity == 0:
                    raise serializers.ValidationError(
                        f"El producto '{product.name}' no está en la venta."
                    )
                
                # Cantidad ya entregada en remitos anteriores
                delivered_quantity = DeliveryNoteItem.objects.filter(
                    delivery_note__sale=sale,
                    product=product,
                    delivery_note__tenant=self.get_tenant()
                ).aggregate(total=Sum('quantity'))['total'] or 0
                
                # Calcular lo que queda por entregar
                remaining_quantity = sold_quantity - delivered_quantity
                
                # Validar que no se exceda
                if quantity_to_deduct > remaining_quantity:
                    raise serializers.ValidationError(
                        f"Producto '{product.name}': "
                        f"Cantidad a entregar ({quantity_to_deduct}) excede lo pendiente ({remaining_quantity}). "
                        f"Vendido: {sold_quantity}, Ya entregado: {delivered_quantity}"
                    )
                
                # VALIDACIÓN ORIGINAL: Verificar stock disponible
                try:
                    inventory_item = Inventory.objects.get(
                        product=product,
                        local=factory_local,
                        tenant=self.get_tenant()
                    )
                    if inventory_item.quantity < quantity_to_deduct:
                        raise serializers.ValidationError(
                            f"Stock insuficiente para el producto {product.name}. "
                            f"Requerido: {quantity_to_deduct}, Disponible: {inventory_item.quantity}."
                        )
                except Inventory.DoesNotExist:
                    raise serializers.ValidationError(
                        f"No hay registro de inventario para el producto {product.name} en la Fábrica."
                    )
            
            # If all validations pass, proceed to create the delivery note and deduct stock.
            delivery_note = serializer.save(tenant=self.get_tenant())
            for item in delivery_note.items.all():
                inventory_item = Inventory.objects.get(
                    product=item.product,
                    local=factory_local,
                    tenant=self.get_tenant()
                )
                inventory_item.quantity -= item.quantity
                inventory_item.save()


# Non-tenant-aware or special case ViewSets
class TenantViewSet(viewsets.ModelViewSet):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer

    def get_permissions(self):
        if self.action == 'list':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == 'list':
            name = self.request.query_params.get('name', None)
            if name is not None: queryset = queryset.filter(name=name)
            return queryset
        
        tenant = self.get_tenant()
        return queryset.filter(tenant=tenant)

class UserViewSet(TenantAwareViewSet):
    queryset = User.objects.all()
    def get_serializer_class(self):
        if self.action == 'create': return UserCreateSerializer
        return UserSerializer

# Dashboard API Views
class ProductionVolumeView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        tenant_id = request.headers.get('X-Tenant-ID')
        if not tenant_id: return Response({'error': 'X-Tenant-ID header is required.'}, status=status.HTTP_400_BAD_REQUEST)
        data = ProductionOrder.objects.filter(tenant_id=tenant_id).values('items__product__design__name', 'op_type').annotate(total_quantity=Sum('items__quantity')).order_by('items__product__design__name', 'op_type')
        return Response(data, status=status.HTTP_200_OK)

class ProcessCompletionRateView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        tenant_id = request.headers.get('X-Tenant-ID')
        if not tenant_id: return Response({'error': 'X-Tenant-ID header is required.'}, status=status.HTTP_400_BAD_REQUEST)
        process_logs = ProductionProcessLog.objects.filter(tenant_id=tenant_id)
        process_data = process_logs.values('process__name').annotate(total_processed=Sum('quantity_processed'), total_completed=Sum(F('quantity_processed'), filter=models.Q(production_order__status='Completada'))).order_by('process__name')
        results = []
        for data in process_data:
            total_processed = data['total_processed'] or 0
            total_completed = data['total_completed'] or 0
            completion_rate = (total_completed / total_processed) * 100 if total_processed > 0 else 0
            results.append({'process_name': data['process__name'], 'completion_rate': round(completion_rate, 2)})
        return Response(results, status=status.HTTP_200_OK)

class RawMaterialConsumptionView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        tenant_id = request.headers.get('X-Tenant-ID')
        if not tenant_id: return Response({'error': 'X-Tenant-ID header is required.'}, status=status.HTTP_400_BAD_REQUEST)
        data = ProductionProcessLog.objects.filter(tenant_id=tenant_id).values('raw_materials_consumed__name').annotate(total_consumed=Sum('quantity_processed')).order_by('raw_materials_consumed__name')
        return Response(data, status=status.HTTP_200_OK)

class DefectiveProductsRateView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        tenant_id = request.headers.get('X-Tenant-ID')
        if not tenant_id: return Response({'error': 'X-Tenant-ID header is required.'}, status=status.HTTP_400_BAD_REQUEST)
        defective_data = ProductionProcessLog.objects.filter(tenant_id=tenant_id).aggregate(total_defective=Sum('quantity_defective'), total_processed=Sum('quantity_processed'))
        total_defective = defective_data.get('total_defective') or 0
        total_processed = defective_data.get('total_processed') or 0
        defective_rate = (total_defective / total_processed) * 100 if total_processed > 0 else 0
        return Response({'defective_rate': round(defective_rate, 2)}, status=status.HTTP_200_OK)

class SalesVolumeView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        tenant_id = request.headers.get('X-Tenant-ID')
        if not tenant_id: return Response({'error': 'X-Tenant-ID header is required.'}, status=status.HTTP_400_BAD_REQUEST)
        data = Sale.objects.filter(tenant_id=tenant_id).values('local__name', 'is_ecommerce_sale', 'ecommerce_platform').annotate(total_sales=Sum('total_amount')).order_by('local__name', 'is_ecommerce_sale', 'ecommerce_platform')
        return Response(data, status=status.HTTP_200_OK)

class InventoryTurnoverRateView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        tenant_id = request.headers.get('X-Tenant-ID')
        if not tenant_id: return Response({'error': 'X-Tenant-ID header is required.'}, status=status.HTTP_400_BAD_REQUEST)
        total_sales_quantity = Sale.objects.filter(tenant_id=tenant_id).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        average_inventory_quantity = Inventory.objects.filter(tenant_id=tenant_id).aggregate(Avg('quantity'))['quantity__avg'] or 0
        inventory_turnover_rate = (total_sales_quantity / average_inventory_quantity) if average_inventory_quantity > 0 else 0
        return Response({'inventory_turnover_rate': round(inventory_turnover_rate, 2)}, status=status.HTTP_200_OK)

class SupplierPerformanceView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        tenant_id = request.headers.get('X-Tenant-ID')
        if not tenant_id: return Response({'error': 'X-Tenant-ID header is required.'}, status=status.HTTP_400_BAD_REQUEST)
        total_purchase_orders = PurchaseOrder.objects.filter(tenant_id=tenant_id).count()
        on_time_deliveries = PurchaseOrder.objects.filter(tenant_id=tenant_id, status='Recibida', order_date__lte=F('expected_delivery_date')).count()
        on_time_rate = (on_time_deliveries / total_purchase_orders) * 100 if total_purchase_orders > 0 else 0
        return Response({'on_time_delivery_rate': round(on_time_rate, 2)}, status=status.HTTP_200_OK)

class OverallProfitLossView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        tenant_id = request.headers.get('X-Tenant-ID')
        if not tenant_id: return Response({'error': 'X-Tenant-ID header is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        total_revenue = Transaction.objects.filter(tenant_id=tenant_id, account__account_type='Ingreso').aggregate(total=Sum('amount'))['total'] or 0
        total_expenses = Transaction.objects.filter(tenant_id=tenant_id, account__account_type='Egreso').aggregate(total=Sum('amount'))['total'] or 0

        profit_loss = total_revenue - total_expenses
        return Response({'overall_profit_loss': round(profit_loss, 2)}, status=status.HTTP_200_OK)

class CurrentBalanceView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        tenant_id = request.headers.get('X-Tenant-ID')
        if not tenant_id: return Response({'error': 'X-Tenant-ID header is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        account_balances = Transaction.objects.filter(tenant_id=tenant_id).values('account__name', 'account__account_type').annotate(
            balance=Sum('amount')
        ).order_by('account__name')

        cash_register_balances = Transaction.objects.filter(tenant_id=tenant_id, cash_register__isnull=False).values('cash_register__name').annotate(
            balance=Sum('amount')
        ).order_by('cash_register__name')

        results = {'account_balances': list(account_balances), 'cash_register_balances': list(cash_register_balances)}
        return Response(results, status=status.HTTP_200_OK)

class RevenueExpensesView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        tenant_id = request.headers.get('X-Tenant-ID')
        if not tenant_id: return Response({'error': 'X-Tenant-ID header is required.'}, status=status.HTTP_400_BAD_REQUEST)
        total_revenue = Sale.objects.filter(tenant_id=tenant_id).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_purchase_expenses = PurchaseOrderItem.objects.filter(purchase_order__tenant_id=tenant_id).aggregate(total_sum=Sum(F('quantity') * F('unit_price')))['total_sum'] or 0
        total_salary_expenses = Salary.objects.filter(tenant_id=tenant_id).aggregate(Sum('amount'))['amount__sum'] or 0
        other_expenses = 0
        total_expenses = total_purchase_expenses + total_salary_expenses + other_expenses
        return Response({'total_revenue': round(total_revenue, 2), 'total_expenses': round(total_expenses, 2)}, status=status.HTTP_200_OK)

class ProjectedGrowthView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        tenant_id = request.headers.get('X-Tenant-ID')
        data_type = request.query_params.get('data_type')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        projection_start_date_str = request.query_params.get('projection_start_date')
        projection_end_date_str = request.query_params.get('projection_end_date')
        if not all([tenant_id, data_type, start_date_str, end_date_str, projection_start_date_str, projection_end_date_str]):
            return Response({'error': 'All parameters are required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            start_date = datetime.datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.datetime.strptime(end_date_str, '%Y-%m-%d').date()
            projection_start_date = datetime.datetime.strptime(projection_start_date_str, '%Y-%m-%d').date()
            projection_end_date = datetime.datetime.strptime(projection_end_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Date format should be YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        projected_data = []
        current_date = projection_start_date
        value = 100.0
        while current_date <= projection_end_date:
            projected_data.append({'date': current_date.isoformat(), 'value': round(value, 2)})
            value *= 1.05
            current_date += datetime.timedelta(days=30)
        return Response(projected_data, status=status.HTTP_200_OK)

class ProjectedDataView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        tenant_id = request.headers.get('X-Tenant-ID')
        if not tenant_id: return Response({'error': 'X-Tenant-ID header is required.'}, status=status.HTTP_400_BAD_REQUEST)
        data = [{'date': (datetime.date.today() + datetime.timedelta(days=i*30)).isoformat(), 'value': 100 + i*10} for i in range(12)]
        serializer = ProjectedDataSerializer(data=data, many=True)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TenantTokenObtainPairView(TokenObtainPairView):
    serializer_class = TenantTokenObtainPairSerializer
