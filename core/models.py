from django.utils import timezone
from django.db import models
from django.core.validators import FileExtensionValidator
from django.db.models import JSONField
from django.core.exceptions import ValidationError
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
import datetime

# --- Base Tenant and User Models ---

class Tenant(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class TenantManager(models.Manager):
    def for_tenant(self, tenant_id):
        return self.filter(tenant__id=tenant_id)

class TenantAwareModel(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    objects = TenantManager()

    class Meta:
        abstract = True

# --- Core Manufacturing and Product Models ---

class Brand(TenantAwareModel):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class RawMaterial(TenantAwareModel):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    unit_of_measure = models.CharField(max_length=50, default='unidades')

    def __str__(self):
        return self.name

class MateriaPrimaProveedor(TenantAwareModel):
    raw_material = models.ForeignKey(RawMaterial, on_delete=models.CASCADE, related_name="proveedores")
    supplier = models.ForeignKey('Supplier', on_delete=models.CASCADE, related_name="materias_primas")
    supplier_code = models.CharField(max_length=100, blank=True, null=True)
    brands = models.ManyToManyField(Brand, blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    current_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    batch_number = models.CharField(max_length=100, blank=True, null=True)
    qr_code_data = models.TextField(blank=True, null=True) # Field for storing QR code image data

    class Meta:
        unique_together = ('raw_material', 'supplier', 'tenant')

    def __str__(self):
        return f"{self.raw_material.name} - {self.supplier.name}"

class Process(TenantAwareModel):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Costo asociado a la ejecución de este proceso.")
    is_initial_process = models.BooleanField(default=False)
    applies_to_medias = models.BooleanField(default=False, help_text="Indica si este proceso aplica a productos de tipo Medias.")
    applies_to_indumentaria = models.BooleanField(default=False, help_text="Indica si este proceso aplica a productos de tipo Indumentaria.")

    def __str__(self):
        return self.name

class Design(TenantAwareModel):
    name = models.CharField(max_length=255)
    product_code = models.CharField(max_length=100, unique=True, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    raw_materials = models.ManyToManyField('RawMaterial', through='DesignMaterial', related_name='designs')
    processes = models.ManyToManyField('Process', through='DesignProcess', related_name='designs')
    category = models.ForeignKey('Category', on_delete=models.SET_NULL, null=True, blank=True)
    sizes = models.ManyToManyField('Size', through='DesignSize', related_name='designs')
    calculated_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def calculate_cost(self):
        total_material_cost = sum(dm.cost * dm.quantity for dm in self.designmaterial_set.all())
        total_process_cost = sum(dp.process.cost for dp in self.designprocess_set.all())
        self.calculated_cost = total_material_cost + total_process_cost
        self.save(update_fields=['calculated_cost'])

    def __str__(self):
        return self.name


class DesignFile(TenantAwareModel):
    design = models.ForeignKey(Design, on_delete=models.CASCADE, related_name='design_files')
    file = models.FileField(upload_to='designs/', validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'png'])])

    def __str__(self):
        return f"File for {self.design.name}"

class DesignProcess(TenantAwareModel):
    """ Modelo intermedio para la receta de un Diseño: Procesos """
    design = models.ForeignKey(Design, on_delete=models.CASCADE)
    process = models.ForeignKey(Process, on_delete=models.CASCADE)
    order = models.PositiveIntegerField(help_text="Orden secuencial del proceso en la fabricación.")
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Costo del proceso para este diseño específico. Se puede sobreescribir el costo por defecto del proceso.")

    class Meta:
        unique_together = ('design', 'process', 'tenant')
        ordering = ['order']

class DesignMaterial(TenantAwareModel):
    """ Modelo intermedio para la receta de un Diseño: Materias Primas """
    design = models.ForeignKey(Design, on_delete=models.CASCADE)
    raw_material = models.ForeignKey(RawMaterial, on_delete=models.CASCADE)
    process = models.ForeignKey(DesignProcess, on_delete=models.SET_NULL, null=True, blank=True, related_name='materials', help_text="Proceso en el que se consume este material.")
    quantity = models.DecimalField(max_digits=10, decimal_places=2, help_text="Cantidad de materia prima necesaria para el diseño.")
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Costo unitario de la materia prima en el momento del diseño.") # NEW FIELD

    class Meta:
        unique_together = ('design', 'raw_material', 'tenant')

class Category(TenantAwareModel):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Size(TenantAwareModel):
    name = models.CharField(max_length=50, unique=True)
    cost_percentage_increase = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, help_text="Porcentaje de incremento del costo para este talle (ej: 0.10 para 10%).")

    def __str__(self):
        return self.name

class DesignSize(TenantAwareModel):
    """ Modelo intermedio para la relación entre Diseño y Talles """
    design = models.ForeignKey(Design, on_delete=models.CASCADE)
    size = models.ForeignKey(Size, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('design', 'size', 'tenant')


class Color(TenantAwareModel):
    name = models.CharField(max_length=50, unique=True)
    hex_code = models.CharField(max_length=7, blank=True, null=True)

    def __str__(self):
        return self.name


class Product(TenantAwareModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    design = models.ForeignKey(Design, on_delete=models.SET_NULL, null=True, blank=True)
    size = models.ForeignKey(Size, on_delete=models.SET_NULL, null=True, blank=True)
    colors = models.ManyToManyField('Color', related_name='products', blank=True)
    sku = models.CharField(max_length=100, unique=True, blank=True, null=True)
    factory_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    club_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    suggested_final_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    weight = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    waste = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_manufactured = models.BooleanField(default=True) # Indicates if the product is manufactured or purchased

    def __str__(self):
        return self.name


class ProductFile(TenantAwareModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_files')
    file = models.FileField(upload_to='products/', validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'png'])])

    def __str__(self):
        return f"File for {self.product.name}"


# --- Commercial Flow Models (Quote, Sale, Delivery) ---

class Client(TenantAwareModel):
    name = models.CharField(max_length=100)
    cuit = models.CharField(max_length=20, unique=True, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    province = models.CharField(max_length=100, blank=True, null=True)
    iva_condition = models.CharField(max_length=100, blank=True, null=True)
    details = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Contact(TenantAwareModel):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='contacts')
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=30, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    position = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.client.name})"

class Quotation(TenantAwareModel):
    quotation_id = models.CharField(max_length=20, blank=True, editable=False, unique=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    user = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True) # Add this line
    date = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=50, default='Borrador', choices=[('Borrador', 'Borrador'), ('Enviada', 'Enviada'), ('Aceptada', 'Aceptada'), ('Rechazada', 'Rechazada')])

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs) # Save first to ensure we have an id
        if not self.quotation_id:
            self.quotation_id = f"PRE-{self.id:03d}"
            Quotation.objects.filter(pk=self.pk).update(quotation_id=self.quotation_id)

    def __str__(self):
        return f"Presupuesto #{self.quotation_id} para {self.client.name}"

class QuotationItem(TenantAwareModel):
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True)
    size = models.ForeignKey(Size, on_delete=models.SET_NULL, null=True, blank=True)
    color = models.ForeignKey(Color, on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Valor de venta unitario ofrecido.")
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Costo calculado del diseño al momento de cotizar.")

    def __str__(self):
        if self.product:
            return f"{self.quantity} x {self.product.name} en Cotización #{self.quotation.id}"
        return f"{self.quantity} x [Producto no disponible] en Cotización #{self.quotation.id}"

class Sale(TenantAwareModel):
    user = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True)
    related_quotation = models.OneToOneField(Quotation, on_delete=models.SET_NULL, null=True, blank=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    sale_date = models.DateTimeField(auto_now_add=True)
    local = models.ForeignKey('Local', on_delete=models.SET_NULL, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=100)
    is_ecommerce_sale = models.BooleanField(default=False)
    ecommerce_platform = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"Venta #{self.id} - {self.sale_date.strftime('%Y-%m-%d')}"

class SaleItem(TenantAwareModel):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        if self.product:
            return f"{self.quantity} x {self.product.name} en Venta #{self.sale.id}"
        return f"{self.quantity} x [Producto no disponible] en Venta #{self.sale.id}"

class DeliveryNote(TenantAwareModel):
    """ Modelo para Remitos de entrega de mercadería. """
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='delivery_notes')
    date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=50, default='Pendiente', choices=[('Pendiente', 'Pendiente'), ('Enviado', 'Enviado'), ('Entregado', 'Entregado')])
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Remito #{self.id} para Venta #{self.sale.id}"

class DeliveryNoteItem(TenantAwareModel):
    delivery_note = models.ForeignKey(DeliveryNote, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE) # Uncommented
    quantity = models.IntegerField()

    def __str__(self):
        return f"{self.quantity} x {self.product.name} en Remito #{self.delivery_note.id}"


# --- Production Flow Models ---

class OrderNote(TenantAwareModel):
    """ Nota de Pedido interna para la fábrica, generada a partir de una Venta. """
    STATUS_CHOICES = [
        ('Pendiente', 'Pendiente'),
        ('En Produccion', 'En Producción'),
        ('Completada', 'Completada'),
        ('Cancelada', 'Cancelada'),
    ]

    sale = models.OneToOneField(Sale, on_delete=models.CASCADE, related_name='order_note')
    order_date = models.DateField(auto_now_add=True)
    estimated_delivery_date = models.DateField()
    shipping_method = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pendiente')
    details = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Nota de Pedido #{self.id} para Venta #{self.sale.id}"

class ProductionOrder(TenantAwareModel):
    OP_TYPE_CHOICES = [('Medias', 'Medias'), ('Indumentaria', 'Indumentaria')]
    STATUS_CHOICES = [('Pendiente', 'Pendiente'), ('En Proceso', 'En Proceso'), ('Completada', 'Completada'), ('Cancelada', 'Cancelada')]

    # Link to OrderNote is now optional
    order_note = models.ForeignKey(OrderNote, on_delete=models.CASCADE, related_name='production_orders', null=True, blank=True)
    
    # New fields for the redesign
    base_product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, help_text="Producto base usado como plantilla para talles y colores.")
    equipo = models.CharField(max_length=255, blank=True)
    detalle_equipo = models.CharField(max_length=255, blank=True)
    customization_details = models.JSONField(default=dict, blank=True, help_text="Detalles de personalización como tipo de escudo, tela, cuello, etc.")

    op_type = models.CharField(max_length=50, choices=OP_TYPE_CHOICES)
    status = models.CharField(max_length=50, default='Pendiente', choices=STATUS_CHOICES)
    creation_date = models.DateTimeField(default=timezone.now)
    estimated_delivery_date = models.DateField(null=True, blank=True)
    current_process = models.ForeignKey(Process, on_delete=models.SET_NULL, null=True, blank=True)
    details = models.TextField(blank=True, null=True)
    colors = models.ManyToManyField(Color, blank=True)
    specifications = models.CharField(max_length=255, blank=True)
    model = models.CharField(max_length=255, blank=True)

    def save(self, *args, **kwargs):
        if not self.estimated_delivery_date and self.order_note:
            self.estimated_delivery_date = self.order_note.estimated_delivery_date
        super().save(*args, **kwargs)

    def __str__(self):
        return f"OP #{self.id} ({self.op_type}) para Nota de Pedido #{self.order_note.id}"

class ProductionOrderItem(TenantAwareModel):
    production_order = models.ForeignKey(ProductionOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    size = models.CharField(max_length=50) # O podría ser un FK a Size si los talles son estándar
    color = models.CharField(max_length=50, blank=True) # NEW FIELD
    customizations = models.JSONField(default=dict, blank=True, null=True)

    def __str__(self):
        return f"{self.quantity} x {self.product.name} (Talle: {self.size}) para OP #{self.production_order.id}"

class ProductionOrderFile(TenantAwareModel):
    production_order = models.ForeignKey(ProductionOrder, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to='production_orders/')
    description = models.CharField(max_length=255, blank=True, null=True)
    file_type = models.CharField(max_length=50, default='general', choices=[('escudo', 'Escudo'), ('sponsor', 'Sponsor'), ('template', 'Template'), ('general', 'General')])

    def __str__(self):
        return f"Archivo para OP #{self.production_order.id}"

class CuttingOrder(TenantAwareModel):
    date = models.DateField(auto_now_add=True)
    fabric_used = models.ForeignKey(RawMaterial, on_delete=models.SET_NULL, null=True, blank=True)
    quantity_cut = models.IntegerField()
    production_orders = models.ManyToManyField(ProductionOrder, related_name='cutting_orders')

    def __str__(self):
        return f"OC #{self.id} - Fecha: {self.date}"

class ProductionProcessLog(TenantAwareModel):
    production_order = models.ForeignKey(ProductionOrder, on_delete=models.CASCADE, related_name='process_logs')
    process = models.ForeignKey(Process, on_delete=models.CASCADE)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    quantity_processed = models.IntegerField()
    quantity_defective = models.IntegerField(default=0)
    failure_details = models.TextField(blank=True, null=True)
    raw_materials_consumed = models.ManyToManyField(RawMaterial, blank=True)

    def __str__(self):
        return f"Log OP #{self.production_order.id} - Proceso: {self.process.name}"

class PedidoMaterial(TenantAwareModel):
    """ Modelo para solicitar materiales a compras, sin ser una OC formal. """
    raw_material_name = models.CharField(max_length=255)
    code = models.CharField(max_length=100, blank=True, null=True)
    brand = models.CharField(max_length=100, blank=True, null=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_of_measure = models.CharField(max_length=50, blank=True)
    supplier = models.ForeignKey('Supplier', on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, default='Pendiente', choices=[
        ('Pendiente', 'Pendiente'),
        ('Procesado', 'Procesado'),
        ('Cancelado', 'Cancelado'),
    ])
    request_date = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Pedido de {self.raw_material_name} ({self.quantity})"

# --- Inventory and Supplier Models ---

class StockAdjustment(TenantAwareModel):
    ADJUSTMENT_TYPE_CHOICES = [
        ('Correccion', 'Corrección por Faltante/Sobrante'),
        ('Devolucion', 'Devolución'),
        ('Baja', 'Baja por Daño o Desuso'),
        ('Inicial', 'Carga de Stock Inicial'),
    ]
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True, related_name='adjustments') # Uncommented
    raw_material = models.ForeignKey(RawMaterial, on_delete=models.CASCADE, null=True, blank=True, related_name='adjustments')
    adjustment_type = models.CharField(max_length=50, choices=ADJUSTMENT_TYPE_CHOICES)
    quantity = models.IntegerField(help_text="Positivo para añadir, negativo para quitar.")
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey('User', on_delete=models.SET_NULL, null=True)

    def __str__(self):
        item_name = self.product.name if self.product else self.raw_material.name
        return f"Ajuste de {self.quantity} para {item_name} ({self.adjustment_type})"

    def clean(self):
        super().clean()
        if self.product and self.raw_material:
            raise ValidationError("Un ajuste de stock solo puede estar asociado a un producto o a una materia prima, no a ambos.")
        if not self.product and not self.raw_material:
            raise ValidationError("Un ajuste de stock debe estar asociado a un producto o a una materia prima.")

class Supplier(TenantAwareModel):
    name = models.CharField(max_length=100, unique=True)
    contact_info = models.TextField(blank=True, null=True)
    cuit_cuil = models.CharField(max_length=20, unique=True, blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    cbu = models.CharField(max_length=30, blank=True, null=True)
    branch = models.CharField(max_length=100, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    business_sector = models.CharField(max_length=100, blank=True, null=True)
    iva_condition = models.CharField(max_length=50, blank=True, null=True)
    bank = models.CharField(max_length=100, blank=True, null=True)
    account_number = models.CharField(max_length=50, blank=True, null=True)
    delivery_available = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class PurchaseOrder(TenantAwareModel):
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    order_date = models.DateField(auto_now_add=True)
    expected_delivery_date = models.DateField()
    status = models.CharField(max_length=50, default='Pendiente', choices=[('Pendiente', 'Pendiente'), ('Recibida', 'Recibida'), ('Cancelada', 'Cancelada')])

    def __str__(self):
        return f"Orden de Compra #{self.id} - {self.supplier.name}"

class PurchaseOrderItem(TenantAwareModel):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE) # Uncommented
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    destination_local = models.ForeignKey('Local', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.product.name} ({self.quantity}) para OC #{self.purchase_order.id}"

# --- Location and Financial Models ---

class Local(TenantAwareModel):
    name = models.CharField(max_length=100, unique=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.tenant.name})"

class Inventory(TenantAwareModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE) # Uncommented
    local = models.ForeignKey(Local, on_delete=models.CASCADE)
    quantity = models.IntegerField()

    class Meta:
        unique_together = ('product', 'local', 'tenant')

    def __str__(self):
        return f"{self.product.name} en {self.local.name}: {self.quantity}"

class Account(TenantAwareModel):
    ACCOUNT_TYPE_CHOICES = [('Activo', 'Activo'), ('Pasivo', 'Pasivo'), ('Patrimonio Neto', 'Patrimonio Neto'), ('Ingreso', 'Ingreso'), ('Egreso', 'Egreso')]
    name = models.CharField(max_length=100)
    account_type = models.CharField(max_length=50, choices=ACCOUNT_TYPE_CHOICES)
    code = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return f"{self.code} - {self.name}"

class CashRegister(TenantAwareModel):
    name = models.CharField(max_length=100)
    local = models.ForeignKey(Local, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.name} ({self.local.name})"

class Transaction(TenantAwareModel):
    date = models.DateField(auto_now_add=True)
    description = models.TextField(blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    related_sale = models.ForeignKey(Sale, on_delete=models.SET_NULL, null=True, blank=True)
    related_purchase = models.ForeignKey(PurchaseOrder, on_delete=models.SET_NULL, null=True, blank=True)
    cash_register = models.ForeignKey(CashRegister, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Transacción #{self.id} - {self.date} - {self.amount}"

class Invoice(TenantAwareModel):
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    sale = models.ForeignKey(Sale, on_delete=models.SET_NULL, null=True, blank=True)
    date = models.DateField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=50, default='Pendiente', choices=[('Pendiente', 'Pendiente'), ('Pagada', 'Pagada'), ('Cancelada', 'Cancelada')])

    def __str__(self):
        return f"Factura #{self.id} - {self.client.name}"

class Payment(TenantAwareModel):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=100)

    def __str__(self):
        return f"Pago de {self.amount} para Factura #{self.invoice.id}"

class Bank(TenantAwareModel):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class BankStatement(TenantAwareModel):
    bank = models.ForeignKey(Bank, on_delete=models.CASCADE)
    statement_date = models.DateField()
    file = models.FileField(upload_to='bank_statements/')

    def __str__(self):
        return f"Extracto de {self.bank.name} - {self.statement_date}"

class BankTransaction(TenantAwareModel):
    bank_statement = models.ForeignKey(BankStatement, on_delete=models.CASCADE, related_name='transactions')
    date = models.DateField()
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Transacción {self.description} - {self.amount}"

class PaymentMethodType(TenantAwareModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class FinancialCostRule(TenantAwareModel):
    name = models.CharField(max_length=100)
    payment_method = models.ForeignKey(PaymentMethodType, on_delete=models.CASCADE)
    percentage = models.DecimalField(max_digits=5, decimal_places=2)

    def __str__(self):
        return self.name

# --- User, Roles, and HR Models ---

class SystemRole(TenantAwareModel):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        tenant = extra_fields.pop('tenant', None)
        if not tenant:
            raise ValueError('A tenant must be provided for user creation')
        user = self.model(email=email, tenant=tenant, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        if 'tenant' not in extra_fields:
            default_tenant, created = Tenant.objects.get_or_create(name='Default Tenant', defaults={'description': 'Default tenant for system administration'})
            extra_fields['tenant'] = default_tenant

        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin, TenantAwareModel):
    email = models.EmailField()
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    roles = models.ManyToManyField(SystemRole, blank=True)
    
    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        unique_together = ('email', 'tenant')

    def __str__(self):
        return self.email

class Factory(TenantAwareModel):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class EmployeeRole(TenantAwareModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Employee(TenantAwareModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    factory = models.ForeignKey(Factory, on_delete=models.SET_NULL, null=True, blank=True)
    local = models.ForeignKey(Local, on_delete=models.SET_NULL, null=True, blank=True)
    role = models.ForeignKey(EmployeeRole, on_delete=models.SET_NULL, null=True, blank=True)
    hire_date = models.DateField()

    def __str__(self):
        return self.user.email

class Salary(TenantAwareModel):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    pay_date = models.DateField()

    def __str__(self):
        return f"Sueldo de {self.employee} - {self.amount}"

class Vacation(TenantAwareModel):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()

    def __str__(self):
        return f"Vacaciones de {self.employee}"

class Permit(TenantAwareModel):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()

    def __str__(self):
        return f"Permiso para {self.employee}"

class MedicalRecord(TenantAwareModel):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    record_date = models.DateField()
    description = models.TextField()
    file = models.FileField(upload_to='medical_records/', blank=True, null=True)

    def __str__(self):
        return f"Carpeta médica de {self.employee}"

class Check(TenantAwareModel):
    order_number = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    bank = models.ForeignKey(Bank, on_delete=models.SET_NULL, null=True, blank=True)
    issuer = models.CharField(max_length=255)
    is_own = models.BooleanField(default=False)
    cuit = models.CharField(max_length=20, blank=True, null=True)
    due_date = models.DateField()
    receiver = models.CharField(max_length=255, blank=True, null=True)
    received_from = models.CharField(max_length=255, blank=True, null=True)
    observations = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, default='Cargado', choices=[
        ('Cargado', 'Cargado'),
        ('Entregado', 'Entregado'),
        ('Rechazado', 'Rechazado'),
        ('Cobrado', 'Cobrado'),
        ('Anulado', 'Anulado'),
    ])

    def __str__(self):
        return f"Cheque #{self.order_number} - {self.amount}"
