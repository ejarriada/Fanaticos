import datetime
from django.utils import timezone
import uuid
import qrcode
import base64
from io import BytesIO
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db import models
from django.db.models import Sum, Count, F, Avg, Case, When
from .models import (
    Product, Tenant, User, SystemRole, Process, OrderNote, ProductionOrder, 
    RawMaterial, Brand, MateriaPrimaProveedor, PedidoMaterial, # Refactored Raw Material Models
    CuttingOrder, ProductionProcessLog, Local, Sale, Inventory, 
    Supplier, PurchaseOrder, PurchaseOrderItem, Account, CashRegister, Transaction, 
    Client, Invoice, Payment, BankStatement, BankTransaction, Bank, 
    PaymentMethodType, FinancialCostRule, Factory, EmployeeRole, Employee, 
    Salary, Vacation, Permit, MedicalRecord, Quotation, QuotationItem, StockAdjustment,
    Design, DesignMaterial, DesignProcess, SaleItem, DeliveryNote, DeliveryNoteItem, DesignFile, ProductFile, Contact,
    MedicalRecord, Quotation, QuotationItem, StockAdjustment,
    Design, DesignMaterial, DesignProcess, SaleItem, DeliveryNote, DeliveryNoteItem,
    Category, Size, Color, Check # NEW IMPORTS
)
from .serializers import (
    ProductSerializer, TenantSerializer, UserSerializer, UserCreateSerializer, 
    SystemRoleSerializer, ProcessSerializer, OrderNoteSerializer, 
    ProductionOrderSerializer, 
    RawMaterialSerializer, BrandSerializer, MateriaPrimaProveedorSerializer, PedidoMaterialSerializer, # Refactored Raw Material Serializers
    CuttingOrderSerializer, 
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
    CategorySerializer, SizeSerializer, ColorSerializer, CheckSerializer, TenantTokenObtainPairSerializer, # NEW IMPORTS
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
class ProductViewSet(TenantAwareViewSet): queryset = Product.objects.all(); serializer_class = ProductSerializer

class ProductFileViewSet(TenantAwareViewSet):
    queryset = ProductFile.objects.all()
    serializer_class = ProductFileSerializer

class SystemRoleViewSet(TenantAwareViewSet): queryset = SystemRole.objects.all(); serializer_class = SystemRoleSerializer
class ProcessViewSet(TenantAwareViewSet): queryset = Process.objects.all(); serializer_class = ProcessSerializer
class OrderNoteViewSet(TenantAwareViewSet): queryset = OrderNote.objects.all(); serializer_class = OrderNoteSerializer
class ProductionOrderViewSet(TenantAwareViewSet):
    queryset = ProductionOrder.objects.all()
    serializer_class = ProductionOrderSerializer

    def perform_create(self, serializer):
        tenant = self.get_tenant()
        serializer.save(tenant=tenant)
class RawMaterialViewSet(TenantAwareViewSet):
    queryset = RawMaterial.objects.all()
    serializer_class = RawMaterialSerializer

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
        qr_data = f"ID: {sourced_material.id}\nMaterial: {sourced_material.raw_material.name}\nProveedor: {sourced_material.supplier.name}\nLote: {sourced_material.batch_number}"

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

        sourced_material.qr_code_data = qr_code_base64
        sourced_material.save()

        return Response({'qr_code_data': qr_code_base64}, status=status.HTTP_200_OK)


class CuttingOrderViewSet(TenantAwareViewSet): queryset = CuttingOrder.objects.all(); serializer_class = CuttingOrderSerializer
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
class LocalViewSet(TenantAwareViewSet): queryset = Local.objects.all(); serializer_class = LocalSerializer

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
        serializer.save(tenant=self.get_tenant(), user=self.request.user)

class InventoryViewSet(TenantAwareViewSet): queryset = Inventory.objects.all(); serializer_class = InventorySerializer
class SupplierViewSet(TenantAwareViewSet): queryset = Supplier.objects.all(); serializer_class = SupplierSerializer
class PurchaseOrderViewSet(TenantAwareViewSet): queryset = PurchaseOrder.objects.all(); serializer_class = PurchaseOrderSerializer
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

class ContactViewSet(TenantAwareViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer

class InvoiceViewSet(TenantAwareViewSet): queryset = Invoice.objects.all(); serializer_class = InvoiceSerializer
class PaymentViewSet(TenantAwareViewSet): queryset = Payment.objects.all(); serializer_class = PaymentSerializer
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
            calculated_cost = quotation_item.design.calculated_cost
            recalculated_unit_price = calculated_cost * (1 + 0.20)
            recalculated_cost = calculated_cost
            
            sale_item_data = {
                'sale': sale.id,
                'design': quotation_item.design.id,
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
class StockAdjustmentViewSet(TenantAwareViewSet): queryset = StockAdjustment.objects.all(); serializer_class = StockAdjustmentSerializer
class DeliveryNoteViewSet(TenantAwareViewSet): queryset = DeliveryNote.objects.all(); serializer_class = DeliveryNoteSerializer

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
