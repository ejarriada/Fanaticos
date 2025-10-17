from rest_framework import serializers
from .models import (
    CommercialProduct, CommercialProductImage, CommercialInventory, ProductReservation,
    Promotion, LoyaltyCard, EcommerceSale, CommercialSale, CommercialSaleItem,
    InternalDeliveryNote, InternalDeliveryNoteItem, CommercialEmployee
)
from core.serializers import TenantAwareSerializer

class CommercialProductImageSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = CommercialProductImage
        fields = ['id', 'image', 'alt_text']

class CommercialProductSerializer(TenantAwareSerializer):
    gallery_images = CommercialProductImageSerializer(many=True, read_only=True)

    class Meta(TenantAwareSerializer.Meta):
        model = CommercialProduct
        fields = [
            'id', 'sku', 'barcode', 'name', 'description', 'category', 'subcategory',
            'brand', 'variants', 'cost_price', 'sale_price', 'discount_price',
            'supplier', 'weight', 'dimensions', 'main_image', 'is_active', 'gallery_images'
        ]

class CommercialInventorySerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = CommercialInventory
        fields = '__all__'

class ProductReservationSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = ProductReservation
        fields = '__all__'

class PromotionSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = Promotion
        fields = '__all__'

class LoyaltyCardSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = LoyaltyCard
        fields = '__all__'

class EcommerceSaleSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = EcommerceSale
        fields = '__all__'

class CommercialSaleItemSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = CommercialSaleItem
        fields = '__all__'

class CommercialSaleSerializer(TenantAwareSerializer):
    items = CommercialSaleItemSerializer(many=True, read_only=True)

    class Meta(TenantAwareSerializer.Meta):
        model = CommercialSale
        fields = '__all__'

class InternalDeliveryNoteItemSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = InternalDeliveryNoteItem
        fields = '__all__'

class InternalDeliveryNoteSerializer(TenantAwareSerializer):
    items = InternalDeliveryNoteItemSerializer(many=True, read_only=True)

    class Meta(TenantAwareSerializer.Meta):
        model = InternalDeliveryNote
        fields = '__all__'

class CommercialEmployeeSerializer(TenantAwareSerializer):
    class Meta(TenantAwareSerializer.Meta):
        model = CommercialEmployee
        fields = '__all__'
