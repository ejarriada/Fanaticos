from rest_framework import viewsets
from core.views import TenantAwareViewSet
from .models import (
    CommercialProduct, CommercialProductImage, CommercialInventory, ProductReservation,
    Promotion, LoyaltyCard, EcommerceSale, CommercialSale, InternalDeliveryNote,
    CommercialEmployee
)
from .serializers import (
    CommercialProductSerializer, CommercialProductImageSerializer, CommercialInventorySerializer,
    ProductReservationSerializer, PromotionSerializer, LoyaltyCardSerializer,
    EcommerceSaleSerializer, CommercialSaleSerializer, InternalDeliveryNoteSerializer,
    CommercialEmployeeSerializer
)

class CommercialProductViewSet(TenantAwareViewSet):
    queryset = CommercialProduct.objects.all()
    serializer_class = CommercialProductSerializer

class CommercialProductImageViewSet(TenantAwareViewSet):
    queryset = CommercialProductImage.objects.all()
    serializer_class = CommercialProductImageSerializer

class CommercialInventoryViewSet(TenantAwareViewSet):
    queryset = CommercialInventory.objects.all()
    serializer_class = CommercialInventorySerializer

class ProductReservationViewSet(TenantAwareViewSet):
    queryset = ProductReservation.objects.all()
    serializer_class = ProductReservationSerializer

class PromotionViewSet(TenantAwareViewSet):
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer

class LoyaltyCardViewSet(TenantAwareViewSet):
    queryset = LoyaltyCard.objects.all()
    serializer_class = LoyaltyCardSerializer

class EcommerceSaleViewSet(TenantAwareViewSet):
    queryset = EcommerceSale.objects.all()
    serializer_class = EcommerceSaleSerializer

class CommercialSaleViewSet(TenantAwareViewSet):
    queryset = CommercialSale.objects.all()
    serializer_class = CommercialSaleSerializer

class InternalDeliveryNoteViewSet(TenantAwareViewSet):
    queryset = InternalDeliveryNote.objects.all()
    serializer_class = InternalDeliveryNoteSerializer

class CommercialEmployeeViewSet(TenantAwareViewSet):
    queryset = CommercialEmployee.objects.all()
    serializer_class = CommercialEmployeeSerializer