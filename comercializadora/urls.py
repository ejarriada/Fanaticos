from rest_framework.routers import DefaultRouter
from .views import (
    CommercialProductViewSet, CommercialProductImageViewSet, CommercialInventoryViewSet,
    ProductReservationViewSet, PromotionViewSet, LoyaltyCardViewSet,
    EcommerceSaleViewSet, CommercialSaleViewSet, InternalDeliveryNoteViewSet,
    CommercialEmployeeViewSet
)

router = DefaultRouter()
router.register(r'commercial-products', CommercialProductViewSet)
router.register(r'commercial-product-images', CommercialProductImageViewSet)
router.register(r'commercial-inventories', CommercialInventoryViewSet)
router.register(r'product-reservations', ProductReservationViewSet)
router.register(r'promotions', PromotionViewSet)
router.register(r'loyalty-cards', LoyaltyCardViewSet)
router.register(r'ecommerce-sales', EcommerceSaleViewSet)
router.register(r'commercial-sales', CommercialSaleViewSet)
router.register(r'internal-delivery-notes', InternalDeliveryNoteViewSet)
router.register(r'commercial-employees', CommercialEmployeeViewSet)

urlpatterns = router.urls
