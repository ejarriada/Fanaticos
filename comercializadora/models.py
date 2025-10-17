from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db.models import JSONField
from core.models import TenantAwareModel, Local, Client, User, Product, Sale, Warehouse
import datetime

# --- NEW MODELS FOR COMERCIALIZADORA ---
class CommercialProduct(TenantAwareModel):
    sku = models.CharField(max_length=100, unique=True)
    barcode = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    name = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    subcategory = models.CharField(max_length=100, blank=True, null=True)
    brand = models.CharField(max_length=100, blank=True, null=True)
    variants = JSONField(default=dict, blank=True, help_text='Ej: {"talla": "M", "color": "Rojo"}')
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    supplier = models.ForeignKey('core.Supplier', on_delete=models.SET_NULL, null=True, blank=True)
    weight = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    dimensions = models.CharField(max_length=100, blank=True, null=True, help_text='Ej: 20x30x10 cm')
    main_image = models.ImageField(upload_to='commercial_products/', blank=True, null=True)
    is_active = models.BooleanField(default=True, db_index=True)

    def __str__(self):
        return f"{self.name} ({self.sku})"

class CommercialProductImage(TenantAwareModel):
    commercial_product = models.ForeignKey(CommercialProduct, on_delete=models.CASCADE, related_name='gallery_images')
    image = models.ImageField(upload_to='commercial_products/gallery/')
    alt_text = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"Imagen para {self.commercial_product.name}"

class CommercialInventory(TenantAwareModel):
    commercial_product = models.ForeignKey(CommercialProduct, on_delete=models.CASCADE, related_name='inventory_records')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='commercial_inventory')
    quantity = models.PositiveIntegerField(default=0)
    min_stock_level = models.PositiveIntegerField(default=10)
    max_stock_level = models.PositiveIntegerField(default=100)

    class Meta:
        unique_together = ('commercial_product', 'warehouse', 'tenant')

    def __str__(self):
        return f"{self.quantity} de {self.commercial_product.sku} en {self.warehouse.name}"

class ProductReservation(TenantAwareModel):
    RESERVATION_STATUS = [
        ('active', 'Activa'),
        ('completed', 'Completada'),
        ('expired', 'Expirada'),
        ('cancelled', 'Cancelada'),
    ]
    commercial_product = models.ForeignKey(CommercialProduct, on_delete=models.CASCADE)
    origin_warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='reservations_made')
    requesting_warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='reservations_requested')
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField(default=1)
    reservation_date = models.DateTimeField(auto_now_add=True)
    expiration_date = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=10, choices=RESERVATION_STATUS, default='active')

    def save(self, *args, **kwargs):
        if not self.id:
            self.expiration_date = timezone.now() + datetime.timedelta(days=5)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Reserva de {self.commercial_product.sku} para {self.client.name if self.client else 'N/A'}"

class Promotion(TenantAwareModel):
    PROMOTION_TYPES = [
        ('percentage', 'Porcentaje de Descuento'),
        ('fixed_amount', 'Monto Fijo de Descuento'),
        ('2x1', '2x1'),
        ('3x2', '3x2'),
        ('combo', 'Combo'),
    ]
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=PROMOTION_TYPES)
    value = models.DecimalField(max_digits=10, decimal_places=2, help_text="Valor del descuento (porcentaje o monto)")
    applicable_products = models.ManyToManyField(CommercialProduct, blank=True)
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(default=timezone.now)
    min_quantity = models.PositiveIntegerField(default=1)
    max_uses = models.PositiveIntegerField(null=True, blank=True)
    requires_loyalty_card = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class LoyaltyCard(TenantAwareModel):
    TIER_CHOICES = [
        ('bronze', 'Bronce'),
        ('silver', 'Plata'),
        ('gold', 'Oro'),
        ('platinum', 'Platino'),
    ]
    client = models.OneToOneField(Client, on_delete=models.CASCADE, related_name='loyalty_card', null=True, blank=True)
    card_number = models.CharField(max_length=50, unique=True)
    tier = models.CharField(max_length=10, choices=TIER_CHOICES, default='bronze')
    points = models.PositiveIntegerField(default=0)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    issue_date = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Tarjeta {self.card_number} de {self.client.name}"

class EcommerceSale(TenantAwareModel):
    PLATFORM_CHOICES = [
        ('web', 'Sitio Web'),
        ('mercadolibre', 'Mercado Libre'),
        ('instagram', 'Instagram'),
    ]
    sale = models.OneToOneField(Sale, on_delete=models.CASCADE, related_name='ecommerce_details', null=True, blank=True)
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    platform_order_id = models.CharField(max_length=100)
    dispatch_warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT)
    dispatch_alert_pending = models.BooleanField(default=True)
    shipping_tracking_code = models.CharField(max_length=100, blank=True, null=True)
    shipping_status = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"Detalle E-commerce para Venta #{self.sale.id}"

class CommercialSale(TenantAwareModel):
    SALE_STATUS = [
        ('pending', 'Pendiente'),
        ('completed', 'Completada'),
        ('cancelled', 'Cancelada'),
    ]
    client = models.ForeignKey(Client, on_delete=models.PROTECT)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, help_text="Punto de Venta o Almacén de despacho")
    status = models.CharField(max_length=10, choices=SALE_STATUS, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Venta Comercial #{self.id} para {self.client.name}"

class CommercialSaleItem(TenantAwareModel):
    commercial_sale = models.ForeignKey(CommercialSale, on_delete=models.CASCADE, related_name='items')
    commercial_product = models.ForeignKey(CommercialProduct, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity} x {self.commercial_product.sku} en Venta #{self.commercial_sale.id}"

class InternalDeliveryNote(TenantAwareModel):
    NOTE_STATUS = [
        ('draft', 'Borrador'),
        ('in_transit', 'En Tránsito'),
        ('received', 'Recibido'),
        ('cancelled', 'Cancelado'),
    ]
    origin_warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name='dispatched_notes')
    destination_warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name='received_notes')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=20, choices=NOTE_STATUS, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    dispatched_at = models.DateTimeField(null=True, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)

    def clean(self):
        if self.origin_warehouse == self.destination_warehouse:
            raise ValidationError("El almacén de origen y destino no pueden ser el mismo.")

    def __str__(self):
        return f"Remito Interno #{self.id}: {self.origin_warehouse.name} -> {self.destination_warehouse.name}"

class InternalDeliveryNoteItem(TenantAwareModel):
    delivery_note = models.ForeignKey(InternalDeliveryNote, on_delete=models.CASCADE, related_name='items')
    commercial_product = models.ForeignKey(CommercialProduct, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.quantity} x {self.commercial_product.sku} en Remito #{self.delivery_note.id}"

class CommercialEmployee(TenantAwareModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='commercial_profile')
    local = models.ForeignKey(Local, on_delete=models.SET_NULL, null=True, blank=True, related_name='commercial_employees')
    role = models.CharField(max_length=100, blank=True, help_text="Ej: Vendedor, Cajero, Gerente de Tienda")

    def __str__(self):
        return f"Perfil Comercial para {self.user.email}"
