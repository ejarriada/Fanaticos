import datetime
import json
from decimal import Decimal
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db import transaction
from django.db.models import Max, Sum, F
from .models import (
    Product, Tenant, User, SystemRole, Process, OrderNote, ProductionOrder, ProductionOrderItem, ProductionOrderFile, 
    RawMaterial, Brand, MateriaPrimaProveedor, PedidoMaterial, 
    ProductionProcessLog, Local, Sale, Inventory, 
    Supplier, PurchaseOrder, PurchaseOrderItem, Account, CashRegister, Transaction, 
    Client, Invoice, Payment, BankStatement, BankTransaction, Bank, Check, 
    PaymentMethodType, FinancialCostRule, Factory, EmployeeRole, Employee, 
    Salary, Vacation, Permit, MedicalRecord, Quotation, QuotationItem, StockAdjustment,
    Design, DesignMaterial, DesignProcess, SaleItem, DeliveryNote, DeliveryNoteItem, DesignFile, ProductFile,
    Category, Size, Color, DesignSize, Contact, Warehouse
)

# --- Base and Helper Serializers ---

class TenantAwareSerializer(serializers.ModelSerializer):
    class Meta:
        read_only_fields = ('tenant',)

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = '__all__'

class CategorySerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = Category
        fields = ['id', 'name']

class SizeSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = Size
        fields = ['id', 'name', 'cost_percentage_increase']

class ColorSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = Color
        fields = ['id', 'name', 'hex_code']

# --- Design and Recipe Serializers ---

class DesignMaterialSerializer(TenantAwareSerializer):
    id = serializers.IntegerField(required=False)
    raw_material_name = serializers.CharField(source='raw_material.name', read_only=True)
    cost = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    
    class Meta(TenantAwareSerializer.Meta):
        model = DesignMaterial
        fields = ['id', 'raw_material', 'raw_material_name', 'quantity', 'cost']

class DesignProcessSerializer(TenantAwareSerializer):
    id = serializers.IntegerField(required=False)
    process_name = serializers.CharField(source='process.name', read_only=True)
    cost = serializers.DecimalField(max_digits=10, decimal_places=2)

    class Meta(TenantAwareSerializer.Meta):
        model = DesignProcess
        fields = ['id', 'process', 'process_name', 'order', 'cost']

class DesignFileSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = DesignFile
        fields = ['id', 'file']

class DesignSerializer(TenantAwareSerializer):
    materials = DesignMaterialSerializer(source='designmaterial_set', many=True, required=False)
    processes = DesignProcessSerializer(source='designprocess_set', many=True, required=False)
    design_files = DesignFileSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source='category', write_only=True, allow_null=True)
    sizes = SizeSerializer(many=True, read_only=True)
    size_ids = serializers.PrimaryKeyRelatedField(queryset=Size.objects.all(), source='sizes', many=True, write_only=True)
    calculated_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta(TenantAwareSerializer.Meta):
        model = Design
        fields = ['id', 'name', 'product_code', 'description', 'materials', 'processes', 'design_files', 'category', 'category_id', 'sizes', 'size_ids', 'calculated_cost']

    def create(self, validated_data):
        materials_data = validated_data.pop('designmaterial_set', [])
        processes_data = validated_data.pop('designprocess_set', [])
        sizes_data = validated_data.pop('sizes', [])
        
        with transaction.atomic():
            design = Design.objects.create(**validated_data)
            design.sizes.set(sizes_data)

            for material_data in materials_data:
                DesignMaterial.objects.create(design=design, tenant=design.tenant, **material_data)
            
            for process_data in processes_data:
                DesignProcess.objects.create(design=design, tenant=design.tenant, **process_data)
            
            design.calculate_cost()

        return design

    def update(self, instance, validated_data):
        materials_data = validated_data.pop('designmaterial_set', None)
        processes_data = validated_data.pop('designprocess_set', None)
        sizes_data = validated_data.pop('sizes', None)

        with transaction.atomic():
            # Update scalar fields of the Design instance
            instance.name = validated_data.get('name', instance.name)
            instance.product_code = validated_data.get('product_code', instance.product_code)
            instance.description = validated_data.get('description', instance.description)
            instance.category = validated_data.get('category', instance.category)
            instance.save()

            if sizes_data is not None:
                instance.sizes.set(sizes_data)

            if materials_data is not None:
                instance.designmaterial_set.all().delete()
                for material_data in materials_data:
                    DesignMaterial.objects.create(design=instance, tenant=instance.tenant, **material_data)

            if processes_data is not None:
                instance.designprocess_set.all().delete()
                for process_data in processes_data:
                    DesignProcess.objects.create(design=instance, tenant=instance.tenant, **process_data)
            
            instance.calculate_cost()

        return instance

# --- User and Client Serializers ---

class SystemRoleSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = SystemRole
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    roles = serializers.PrimaryKeyRelatedField(many=True, queryset=SystemRole.objects.all())
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'roles')

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    roles = serializers.PrimaryKeyRelatedField(many=True, queryset=SystemRole.objects.all())
    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'first_name', 'last_name', 'roles', 'tenant')
    def create(self, validated_data):
        roles_data = validated_data.pop('roles')
        user = User.objects.create_user(**validated_data)
        user.roles.set(roles_data)
        return user

class ContactSerializer(TenantAwareSerializer):
    id = serializers.IntegerField(required=False)
    class Meta(TenantAwareSerializer.Meta):
        model = Contact
        fields = ['id', 'name', 'phone', 'email', 'position']

class ClientSerializer(TenantAwareSerializer):
    contacts = ContactSerializer(many=True, required=False)

    class Meta(TenantAwareSerializer.Meta):
        model = Client
        fields = ['id', 'name', 'cuit', 'email', 'phone', 'address', 'city', 'province', 'iva_condition', 'details', 'contacts']

    def create(self, validated_data):
        contacts_data = validated_data.pop('contacts', [])
        with transaction.atomic():
            client = Client.objects.create(**validated_data)
            for contact_data in contacts_data:
                Contact.objects.create(client=client, tenant=client.tenant, **contact_data)
        return client

    def update(self, instance, validated_data):
        contacts_data = validated_data.pop('contacts', None)

        # Update scalar fields of the Client instance
        instance.name = validated_data.get('name', instance.name)
        instance.cuit = validated_data.get('cuit', instance.cuit)
        instance.email = validated_data.get('email', instance.email)
        instance.phone = validated_data.get('phone', instance.phone)
        instance.address = validated_data.get('address', instance.address)
        instance.city = validated_data.get('city', instance.city)
        instance.province = validated_data.get('province', instance.province)
        instance.iva_condition = validated_data.get('iva_condition', instance.iva_condition)
        instance.details = validated_data.get('details', instance.details)
        instance.save()

        # Handle nested contacts if provided
        if contacts_data is not None:
            with transaction.atomic():
                instance.contacts.all().delete()
                for contact_data in contacts_data:
                    Contact.objects.create(client=instance, tenant=instance.tenant, **contact_data)

        return instance

# --- Commercial Flow Serializers (Quotation, Sale) ---

class SimpleProductSerializer(TenantAwareSerializer):
    """Serializador simple de Producto para representaciones anidadas."""
    size = SizeSerializer(read_only=True)
    colors = ColorSerializer(many=True, read_only=True)

    class Meta(TenantAwareSerializer.Meta):
        model = Product
        fields = ['id', 'name', 'description', 'size', 'colors']

class SaleItemSerializer(TenantAwareSerializer):
    """Serializador de Item de Venta con detalles del producto anidados."""
    product = SimpleProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), 
        source='product', 
        write_only=True
    )
    size = SizeSerializer(read_only=True)
    size_id = serializers.PrimaryKeyRelatedField(
        queryset=Size.objects.all(),
        source='size',
        write_only=True,
        required=False,
        allow_null=True
    )
    color = ColorSerializer(read_only=True)
    color_id = serializers.PrimaryKeyRelatedField(
        queryset=Color.objects.all(),
        source='color',
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta(TenantAwareSerializer.Meta):
        model = SaleItem
        fields = ['id', 'product', 'product_id', 'size', 'size_id', 'color', 'color_id', 'quantity', 'unit_price', 'cost']

class SaleForOrderNoteSerializer(serializers.ModelSerializer):
    """Serializer simplificado para la Venta dentro de la Nota de Pedido."""
    client = ClientSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    items = SaleItemSerializer(many=True, read_only=True)
    payment_status = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = ['id', 'client', 'user', 'total_amount', 'items', 'payment_status']

    def get_payment_status(self, obj):
        """
        Calcula el estado del pago de la venta basado en las transacciones asociadas.
        """
        paid_amount = Transaction.objects.filter(
            tenant=obj.tenant,
            related_sale=obj,
            amount__gt=0
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        if paid_amount >= obj.total_amount:
            return "Pagado"
        elif paid_amount > 0:
            return "Pago Parcial"
        else:
            return "Pendiente de Pago"


class OrderNoteSerializer(TenantAwareSerializer):
    """Serializador para las Notas de Pedido.
    Permite crear una nota de pedido a partir de un `sale_id`.
    La venta se muestra de forma anidada en modo de solo lectura.
    """
    sale = SaleForOrderNoteSerializer(read_only=True)
    sale_id = serializers.PrimaryKeyRelatedField(
        queryset=Sale.objects.filter(order_note__isnull=True), 
        source='sale', 
        write_only=True,
        help_text="ID de la Venta para la cual se crea la Nota de Pedido. La venta no debe tener ya una nota de pedido asociada."
    )

    class Meta(TenantAwareSerializer.Meta):
        model = OrderNote
        fields = [
            'id',
            'sale',
            'sale_id',
            'order_date',
            'estimated_delivery_date',
            'shipping_method',
            'status',
            'details'
        ]
        read_only_fields = ('order_date',)

    def validate_sale_id(self, value):
        """
        Asegura que la venta no tenga ya una nota de pedido asociada.
        Este chequeo es redundante si el queryset del campo funciona bien,
        pero sirve como una doble verificación.
        """
        if OrderNote.objects.filter(sale=value).exists():
            raise serializers.ValidationError("Esta venta ya tiene una nota de pedido asociada.")
        return value



class QuotationItemSerializer(TenantAwareSerializer):
    product_name = serializers.SerializerMethodField()

    class Meta(TenantAwareSerializer.Meta):
        model = QuotationItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_price', 'cost']

    def get_product_name(self, obj):
        if obj.product:
            return obj.product.name
        return "Producto no encontrado"


class QuotationSerializer(TenantAwareSerializer):
    items = QuotationItemSerializer(many=True)
    client = ClientSerializer(read_only=True)
    client_id = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(), source='client', write_only=True
    )
    user = UserSerializer(read_only=True)

    class Meta(TenantAwareSerializer.Meta):
        model = Quotation
        fields = ['id', 'quotation_id', 'client', 'client_id', 'date', 'total_amount', 'status', 'items', 'user']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        quotation = Quotation.objects.create(**validated_data)
        total_amount = 0
        for item_data in items_data:
            total_amount += item_data['quantity'] * item_data['unit_price']
            QuotationItem.objects.create(quotation=quotation, tenant=quotation.tenant, **item_data)
        quotation.total_amount = total_amount
        quotation.save()
        return quotation

class SaleSerializer(TenantAwareSerializer):
    items = SaleItemSerializer(many=True)
    client = ClientSerializer(read_only=True)
    client_id = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(), source='client', write_only=True
    )
    related_quotation = QuotationSerializer(read_only=True)
    user = UserSerializer(read_only=True) 

    class Meta(TenantAwareSerializer.Meta):
        model = Sale
        fields = ['id', 'client', 'client_id', 'sale_date', 'local', 'total_amount', 'payment_method', 'related_quotation', 'items', 'user']
        read_only_fields = ('tenant', 'sale_date')

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        with transaction.atomic():
            sale = Sale.objects.create(**validated_data)
            for item_data in items_data:
                SaleItem.objects.create(sale=sale, tenant=sale.tenant, **item_data)
        return sale

# --- Other Model Serializers ---

class WarehouseSerializer(serializers.ModelSerializer):
    factory_name = serializers.CharField(source='factory.name', read_only=True)
    
    class Meta:
        model = Warehouse
        fields = ['id', 'name', 'factory', 'factory_name', 'tenant']
        read_only_fields = ['tenant']

class ProductSerializer(TenantAwareSerializer):
    cost = serializers.SerializerMethodField()
    design = DesignSerializer(read_only=True)
    size = SizeSerializer(read_only=True)
    colors = ColorSerializer(many=True, read_only=True)

    design_id = serializers.PrimaryKeyRelatedField(
        queryset=Design.objects.all(), source='design', write_only=True, allow_null=True, required=False
    )
    size_id = serializers.PrimaryKeyRelatedField(
        queryset=Size.objects.all(), source='size', write_only=True, allow_null=True, required=False
    )
    color_ids = serializers.PrimaryKeyRelatedField(
        queryset=Color.objects.all(), source='colors', many=True, write_only=True, required=False
    )

    class Meta(TenantAwareSerializer.Meta):
        model = Product
        fields = [
            'id', 'name', 'description', 'design', 'size', 'colors', 'sku', 
            'factory_price', 'club_price', 'suggested_final_price', 'weight', 'waste', 
            'is_manufactured', 'cost', 'design_id', 'size_id', 'color_ids'
        ]
    
    def get_cost(self, obj):
        if obj.design:
            return obj.design.calculated_cost
        return 0.00

    def create(self, validated_data):
        colors_data = validated_data.pop('colors', [])
        
        # --- Unique SKU Generation ---
        if 'sku' not in validated_data or not validated_data['sku']:
            name = validated_data.get('name', 'prod')
            timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
            base_sku = f"SKU-{name[:3].upper()}-{timestamp}"
            sku = base_sku
            counter = 1
            while Product.objects.filter(sku=sku).exists():
                sku = f"{base_sku}-{counter}"
                counter += 1
            validated_data['sku'] = sku
        # --- End of SKU Generation ---

        product = Product.objects.create(**validated_data)
        product.colors.set(colors_data)
        return product

    def update(self, instance, validated_data):
        colors_data = validated_data.pop('colors', None)

        # Update scalar fields
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.sku = validated_data.get('sku', instance.sku)
        instance.factory_price = validated_data.get('factory_price', instance.factory_price)
        instance.club_price = validated_data.get('club_price', instance.club_price)
        instance.suggested_final_price = validated_data.get('suggested_final_price', instance.suggested_final_price)
        instance.weight = validated_data.get('weight', instance.weight)
        instance.waste = validated_data.get('waste', instance.waste)
        instance.is_manufactured = validated_data.get('is_manufactured', instance.is_manufactured)
        
        # Update foreign key fields
        instance.design = validated_data.get('design', instance.design)
        instance.size = validated_data.get('size', instance.size)
        
        instance.save()

        # Update many-to-many field
        if colors_data is not None:
            instance.colors.set(colors_data)

        return instance

class DeliveryNoteItemSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = DeliveryNoteItem
        fields = '__all__'

class DeliveryNoteSerializer(TenantAwareSerializer):
    items = DeliveryNoteItemSerializer(many=True)
    class Meta(TenantAwareSerializer.Meta):
        model = DeliveryNote
        fields = '__all__'

class ProductFileSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = ProductFile
        fields = ['id', 'file']

class ProcessSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = Process
        fields = '__all__'



class ProductionOrderItemSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = ProductionOrderItem
        fields = ['id', 'product', 'quantity', 'size', 'color', 'customizations']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.product:
            representation['product'] = SimpleProductSerializer(instance.product, context=self.context).data
        return representation

class ProductionOrderFileSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = ProductionOrderFile
        fields = ['id', 'file', 'description']

class ProductionOrderSerializer(TenantAwareSerializer):
    items = ProductionOrderItemSerializer(many=True, required=False)
    files = ProductionOrderFileSerializer(many=True, read_only=True)
    
    order_note = serializers.PrimaryKeyRelatedField(
        queryset=OrderNote.objects.all(), allow_null=True, required=False
    )
    base_product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), allow_null=True, required=False
    )

    class Meta(TenantAwareSerializer.Meta):
        model = ProductionOrder
        fields = [
            'id',
            'order_note',
            'base_product',
            'equipo',
            'detalle_equipo',
            'customization_details',
            'op_type',
            'status',
            'creation_date',
            'current_process',
            'details',
            'items',
            'files'
        ]
        read_only_fields = ('creation_date',)

    def to_internal_value(self, data):
        import json
        # We're converting the QueryDict to a mutable dict to modify it.
        mutable_data = data.copy()

        items_str = mutable_data.get('items')
        if items_str and isinstance(items_str, str):
            try:
                mutable_data['items'] = json.loads(items_str)
            except json.JSONDecodeError:
                raise serializers.ValidationError({'items': 'Invalid JSON string.'})

        details_str = mutable_data.get('customization_details')
        if details_str and isinstance(details_str, str):
            try:
                mutable_data['customization_details'] = json.loads(details_str)
            except json.JSONDecodeError:
                raise serializers.ValidationError({'customization_details': 'Invalid JSON string.'})
        
        return super().to_internal_value(mutable_data)

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        order_note_instance = None
        base_product_instance = None

        if isinstance(instance, ProductionOrder):
            order_note_instance = instance.order_note
            base_product_instance = instance.base_product
        elif isinstance(instance, dict):
            order_note_id = instance.get('order_note')
            base_product_id = instance.get('base_product')
            if order_note_id:
                try:
                    order_note_instance = OrderNote.objects.get(pk=order_note_id)
                except OrderNote.DoesNotExist:
                    pass
            if base_product_id:
                try:
                    base_product_instance = Product.objects.get(pk=base_product_id)
                except Product.DoesNotExist:
                    pass

        if order_note_instance:
            representation['order_note'] = OrderNoteSerializer(order_note_instance, context=self.context).data
        if base_product_instance:
            representation['base_product'] = SimpleProductSerializer(base_product_instance, context=self.context).data
            
        return representation

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        
        # Pop file lists before calling super().create()
        escudo_files = validated_data.pop('escudo_files', [])
        sponsor_files = validated_data.pop('sponsor_files', [])
        template_files = validated_data.pop('template_files', [])

        with transaction.atomic():
            production_order = ProductionOrder.objects.create(**validated_data)
            for item_data in items_data:
                ProductionOrderItem.objects.create(
                    production_order=production_order, 
                    tenant=production_order.tenant, 
                    **item_data
                )
            
            # Create ProductionOrderFile instances
            for file_obj in escudo_files:
                ProductionOrderFile.objects.create(
                    production_order=production_order,
                    tenant=production_order.tenant,
                    file=file_obj,
                    file_type='escudo'
                )
            for file_obj in sponsor_files:
                ProductionOrderFile.objects.create(
                    production_order=production_order,
                    tenant=production_order.tenant,
                    file=file_obj,
                    file_type='sponsor'
                )
            for file_obj in template_files:
                ProductionOrderFile.objects.create(
                    production_order=production_order,
                    tenant=production_order.tenant,
                    file=file_obj,
                    file_type='template'
                )
        return production_order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        # Pop file lists before calling super().update()
        escudo_files = validated_data.pop('escudo_files', [])
        sponsor_files = validated_data.pop('sponsor_files', [])
        template_files = validated_data.pop('template_files', [])

        # Update the ProductionOrder instance's scalar fields
        instance.order_note = validated_data.get('order_note', instance.order_note)
        instance.base_product = validated_data.get('base_product', instance.base_product)
        instance.equipo = validated_data.get('equipo', instance.equipo)
        instance.detalle_equipo = validated_data.get('detalle_equipo', instance.detalle_equipo)
        instance.customization_details = validated_data.get('customization_details', instance.customization_details)
        instance.op_type = validated_data.get('op_type', instance.op_type)
        instance.status = validated_data.get('status', instance.status)
        instance.current_process = validated_data.get('current_process', instance.current_process)
        instance.details = validated_data.get('details', instance.details)
        instance.save()

        # Handle the nested items only if they were provided
        if items_data is not None:
            with transaction.atomic():
                instance.items.all().delete()
                for item_data in items_data:
                    ProductionOrderItem.objects.create(
                        production_order=instance,
                        tenant=instance.tenant,
                        **item_data
                    )
            
        # Handle files: delete existing and create new ones
        # Note: This file handling logic might need adjustment based on desired behavior (e.g., only updating if new files are sent)
        if escudo_files or sponsor_files or template_files:
            instance.files.all().delete() # Example: delete all existing files if new ones are uploaded
            for file_obj in escudo_files:
                ProductionOrderFile.objects.create(
                    production_order=instance,
                    tenant=instance.tenant,
                    file=file_obj,
                    file_type='escudo'
                )
            for file_obj in sponsor_files:
                ProductionOrderFile.objects.create(
                    production_order=instance,
                    tenant=instance.tenant,
                    file=file_obj,
                    file_type='sponsor'
                )
            for file_obj in template_files:
                ProductionOrderFile.objects.create(
                    production_order=instance,
                    tenant=instance.tenant,
                    file=file_obj,
                    file_type='template'
                )
        return instance

class ProductionProcessLogSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = ProductionProcessLog
        fields = '__all__'

class LocalSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = Local
        fields = '__all__'

class InventorySerializer(TenantAwareSerializer):
    product = SimpleProductSerializer(read_only=True)
    warehouse = WarehouseSerializer(read_only=True)

    class Meta(TenantAwareSerializer.Meta):
        model = Inventory
        fields = ['id', 'product', 'warehouse', 'quantity']

class SupplierSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = Supplier
        fields = '__all__'

class BrandSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = Brand
        fields = '__all__'

class RawMaterialSerializer(TenantAwareSerializer):
    highest_cost = serializers.SerializerMethodField()

    class Meta(TenantAwareSerializer.Meta):
        model = RawMaterial
        fields = '__all__'

    def get_highest_cost(self, obj):
        highest_cost = obj.proveedores.filter(tenant=obj.tenant).aggregate(max_cost=Max('cost'))['max_cost']
        return highest_cost if highest_cost is not None else 0.00

class MateriaPrimaProveedorSerializer(TenantAwareSerializer):
    raw_material = serializers.PrimaryKeyRelatedField(
        queryset=RawMaterial.objects.all()
    )
    supplier = serializers.PrimaryKeyRelatedField(queryset=Supplier.objects.all(), required=False, allow_null=True)
    brand = serializers.PrimaryKeyRelatedField(
        queryset=Brand.objects.all(), required=False, allow_null=True
    )
    warehouse = serializers.PrimaryKeyRelatedField(
        queryset=Warehouse.objects.all(), required=False, allow_null=True
    )
    
    name = serializers.CharField(source='raw_material.name', read_only=True)
    description = serializers.CharField(source='raw_material.description', read_only=True)
    category = serializers.CharField(source='raw_material.category', read_only=True)
    unit_of_measure = serializers.CharField(source='raw_material.unit_of_measure', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)

    class Meta(TenantAwareSerializer.Meta):
        model = MateriaPrimaProveedor
        fields = [
            'id', 'raw_material', 'supplier', 'brand', 'warehouse', 'supplier_code', 
            'cost', 'current_stock', 'batch_number', 'qr_code_data',
            'name', 'description', 'category', 'unit_of_measure', 'supplier_name', 'warehouse_name'
        ]
        read_only_fields = ('batch_number', 'qr_code_data')

class PurchaseOrderItemSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = PurchaseOrderItem
        fields = ['id', 'purchase_order', 'raw_material', 'quantity', 'unit_price', 'destination_local']
        read_only_fields = ('purchase_order',)

class PurchaseOrderSerializer(TenantAwareSerializer):
    items = PurchaseOrderItemSerializer(many=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    user_name = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()

    class Meta(TenantAwareSerializer.Meta):
        model = PurchaseOrder
        fields = ['id', 'supplier', 'supplier_name', 'user', 'user_name', 'order_date', 'expected_delivery_date', 'status', 'total_amount', 'paid_amount', 'items']

    def get_total_amount(self, obj):
        return obj.items.aggregate(total=Sum(F('quantity') * F('unit_price')))['total'] or Decimal('0.00')

    paid_amount = serializers.SerializerMethodField()

    def get_user_name(self, obj):
        return obj.user.first_name if obj.user else None

    def get_total_amount(self, obj):
        return obj.items.aggregate(total=Sum(F('quantity') * F('unit_price')))['total'] or Decimal('0.00')

    def get_paid_amount(self, obj):
        return obj.payments.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        with transaction.atomic():
            purchase_order = PurchaseOrder.objects.create(**validated_data)
            total_amount = Decimal('0.00')
            for item_data in items_data:
                item = PurchaseOrderItem.objects.create(purchase_order=purchase_order, tenant=purchase_order.tenant, **item_data)
                total_amount += item.quantity * item.unit_price
            purchase_order.total_amount = total_amount
            purchase_order.paid_amount = Decimal('0.00') # Initially unpaid
            purchase_order.save()
        return purchase_order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        # Pop read-only fields that are calculated/managed internally
        validated_data.pop('total_amount', None)
        validated_data.pop('paid_amount', None)

        # Update scalar fields of the PurchaseOrder instance
        instance.supplier = validated_data.get('supplier', instance.supplier)
        instance.user = validated_data.get('user', instance.user)
        instance.order_date = validated_data.get('order_date', instance.order_date)
        instance.expected_delivery_date = validated_data.get('expected_delivery_date', instance.expected_delivery_date)
        instance.status = validated_data.get('status', instance.status)
        instance.save()

        # Handle nested items if provided
        if items_data is not None:
            instance.items.all().delete() # Delete existing items
            total_amount = Decimal('0.00')
            for item_data in items_data:
                item = PurchaseOrderItem.objects.create(purchase_order=instance, tenant=instance.tenant, **item_data)
                total_amount += item.quantity * item.unit_price
            instance.total_amount = total_amount
            instance.save(update_fields=['total_amount'])

        return instance

class AccountSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = Account
        fields = '__all__'

class CashRegisterSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = CashRegister
        fields = '__all__'

class TransactionSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = Transaction
        fields = '__all__'

class InvoiceSerializer(TenantAwareSerializer):
    client = serializers.StringRelatedField()
    sale = serializers.StringRelatedField()
    purchase_order = serializers.StringRelatedField()

    class Meta(TenantAwareSerializer.Meta):
        model = Invoice
        fields = ['id', 'client', 'date', 'total_amount', 'status', 'sale', 'purchase_order']

class PaymentSerializer(TenantAwareSerializer):
    payment_method_name = serializers.CharField(source='payment_method.name', read_only=True)
    account = serializers.PrimaryKeyRelatedField(queryset=Account.objects.all(), write_only=True)
    cash_register = serializers.PrimaryKeyRelatedField(queryset=CashRegister.objects.all(), required=False, allow_null=True, write_only=True)

    class Meta(TenantAwareSerializer.Meta):
        model = Payment
        fields = ['id', 'purchase_order', 'date', 'amount', 'payment_method', 'payment_method_name', 'account', 'cash_register']
        read_only_fields = ('date',)

    def create(self, validated_data):
        account = validated_data.pop('account')
        cash_register = validated_data.pop('cash_register', None)
        
        with transaction.atomic():
            payment = Payment.objects.create(**validated_data)

            # Update PurchaseOrder paid_amount and status
            purchase_order = payment.purchase_order
            purchase_order.paid_amount += payment.amount
            if purchase_order.paid_amount >= purchase_order.total_amount:
                purchase_order.status = 'Pagada'
            elif purchase_order.paid_amount > 0:
                purchase_order.status = 'Pago Parcial'
            else:
                purchase_order.status = 'Pendiente' # Should not happen if amount > 0
            purchase_order.save()

            # Create a corresponding Transaction
            Transaction.objects.create(
                tenant=payment.tenant,
                description=f"Pago a proveedor por OC #{payment.purchase_order.id}",
                amount=payment.amount,
                account=account,
                cash_register=cash_register,
                related_purchase=payment.purchase_order,
            )
            return payment

class BankStatementSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = BankStatement
        fields = '__all__'

class BankTransactionSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = BankTransaction
        fields = '__all__'

class BankSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = Bank
        fields = '__all__'

class PaymentMethodTypeSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = PaymentMethodType
        fields = '__all__'

class FinancialCostRuleSerializer(TenantAwareSerializer):
    payment_method_name = serializers.CharField(source='payment_method.name', read_only=True)
    bank_name = serializers.CharField(source='bank.name', read_only=True)

    payment_method = serializers.PrimaryKeyRelatedField(queryset=PaymentMethodType.objects.all(), write_only=True)
    bank = serializers.PrimaryKeyRelatedField(queryset=Bank.objects.all(), allow_null=True, required=False, write_only=True)

    class Meta(TenantAwareSerializer.Meta):
        model = FinancialCostRule
        fields = ['id', 'payment_method', 'payment_method_name', 'bank', 'bank_name', 'percentage']

class FactorySerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = Factory
        fields = '__all__'

class EmployeeRoleSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = EmployeeRole
        fields = '__all__'

class EmployeeSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = Employee
        fields = '__all__'

class SalarySerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = Salary
        fields = '__all__'

class VacationSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = Vacation
        fields = '__all__'

class PermitSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = Permit
        fields = '__all__'

class MedicalRecordSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = MedicalRecord
        fields = '__all__'

class CheckSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = Check
        fields = '__all__'

class StockAdjustmentSerializer(TenantAwareSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta(TenantAwareSerializer.Meta):
        model = StockAdjustment
        fields = '__all__'
        read_only_fields = ('tenant', 'created_at', 'user')

    def validate(self, data):
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            data['user'] = request.user
        return data

class PedidoMaterialSerializer(TenantAwareSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta(TenantAwareSerializer.Meta):
        model = PedidoMaterial
        fields = '__all__'
        read_only_fields = ('tenant', 'request_date', 'user')

    def validate(self, data):
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            data['user'] = request.user
        return data

class ProjectedDataSerializer(serializers.Serializer):
    date = serializers.DateField()
    value = serializers.DecimalField(max_digits=10, decimal_places=2)

class TenantTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        tenant_id = self.context['request'].META.get('HTTP_X_TENANT_ID')
        if tenant_id:
            data['tenant_id'] = tenant_id
        return data