from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TenantViewSet, ProductViewSet, UserViewSet, SystemRoleViewSet, ProcessViewSet,
    OrderNoteViewSet, ProductionOrderViewSet, RawMaterialViewSet, BrandViewSet, MateriaPrimaProveedorViewSet, PedidoMaterialViewSet,
    ProductionProcessLogViewSet, LocalViewSet, SaleViewSet, InventoryViewSet,
    SupplierViewSet, PurchaseOrderViewSet, PurchaseOrderItemViewSet, AccountViewSet,
    CashRegisterViewSet, TransactionViewSet, ClientViewSet, InvoiceViewSet, PaymentViewSet,
    BankStatementViewSet, BankTransactionViewSet, BankViewSet, PaymentMethodTypeViewSet,
    FinancialCostRuleViewSet, FactoryViewSet, EmployeeRoleViewSet, EmployeeViewSet,
    SalaryViewSet, VacationViewSet, PermitViewSet,     MedicalRecordViewSet, QuotationViewSet,
    QuotationItemViewSet, StockAdjustmentViewSet, DesignViewSet, DeliveryNoteViewSet,
    CategoryViewSet, SizeViewSet, ColorViewSet, CheckViewSet, DesignFileViewSet, ProductFileViewSet, ContactViewSet, # NEW IMPORTS
    ProductionVolumeView, ProcessCompletionRateView,
    RawMaterialConsumptionView, DefectiveProductsRateView, SalesVolumeView, InventoryTurnoverRateView,
    SupplierPerformanceView, OverallProfitLossView, CurrentBalanceView, RevenueExpensesView,
    ProjectedGrowthView, WarehouseViewSet
)

router = DefaultRouter()
router.register(r'tenants', TenantViewSet)
router.register(r'products', ProductViewSet, basename='products')
router.register(r'users', UserViewSet)
router.register(r'system-roles', SystemRoleViewSet)
router.register(r'processes', ProcessViewSet)
router.register(r'order-notes', OrderNoteViewSet)
router.register(r'production-orders', ProductionOrderViewSet)
router.register(r'raw-materials', RawMaterialViewSet)
router.register(r'brands', BrandViewSet)
router.register(r'materia-prima-proveedores', MateriaPrimaProveedorViewSet)
router.register(r'pedidos-materiales', PedidoMaterialViewSet)
router.register(r'production-process-logs', ProductionProcessLogViewSet)
router.register(r'plantillas', DesignViewSet, basename='plantilla')
router.register(r'locals', LocalViewSet)
router.register(r'sales', SaleViewSet)
router.register(r'inventories', InventoryViewSet)
router.register(r'suppliers', SupplierViewSet)
router.register(r'purchase-orders', PurchaseOrderViewSet)
router.register(r'purchase-order-items', PurchaseOrderItemViewSet)
router.register(r'accounts', AccountViewSet)
router.register(r'cash-registers', CashRegisterViewSet)
router.register(r'transactions', TransactionViewSet)
router.register(r'clients', ClientViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'bank-statements', BankStatementViewSet)
router.register(r'bank-transactions', BankTransactionViewSet)
router.register(r'banks', BankViewSet)
router.register(r'payment-method-types', PaymentMethodTypeViewSet)
router.register(r'financial-cost-rules', FinancialCostRuleViewSet)
router.register(r'factories', FactoryViewSet)
router.register(r'employee-roles', EmployeeRoleViewSet)
router.register(r'employees', EmployeeViewSet)
router.register(r'salaries', SalaryViewSet)
router.register(r'vacations', VacationViewSet)
router.register(r'permits', PermitViewSet)
router.register(r'medical-records', MedicalRecordViewSet)
router.register(r'checks', CheckViewSet)
router.register(r'quotations', QuotationViewSet)
router.register(r'quotation-items', QuotationItemViewSet)
router.register(r'stock-adjustments', StockAdjustmentViewSet)
router.register(r'delivery-notes', DeliveryNoteViewSet) # Added DeliveryNoteViewSet
router.register(r'categories', CategoryViewSet) # NEW
router.register(r'sizes', SizeViewSet)         # NEW
router.register(r'colors', ColorViewSet) # NEW
router.register(r'design-files', DesignFileViewSet)
router.register(r'product-files', ProductFileViewSet)
router.register(r'contacts', ContactViewSet)
router.register(r'warehouses', WarehouseViewSet, basename='warehouse')

urlpatterns = [
    path('', include(router.urls)),
    path('products/available_for_import/', ProductViewSet.as_view({'get': 'available_for_import'}), name='product-available-for-import'),
    path('products/import_manufactured/', ProductViewSet.as_view({'post': 'import_manufactured'}), name='product-import-manufactured'),
    path('manufacturing/production-volume/', ProductionVolumeView.as_view(), name='production-volume'),
    path('manufacturing/process-completion-rate/', ProcessCompletionRateView.as_view(), name='process-completion-rate'),
    path('manufacturing/raw-material-consumption/', RawMaterialConsumptionView.as_view(), name='raw-material-consumption'),
    path('manufacturing/defective-products-rate/', DefectiveProductsRateView.as_view(), name='defective-products-rate'),
    path('trading/sales-volume/', SalesVolumeView.as_view(), name='sales-volume'),
    path('trading/inventory-turnover-rate/', InventoryTurnoverRateView.as_view(), name='inventory-turnover-rate'),
    path('trading/supplier-performance/', SupplierPerformanceView.as_view(), name='supplier-performance'),
    path('management/overall-profit-loss/', OverallProfitLossView.as_view(), name='overall-profit-loss'),
    path('management/current-balance/', CurrentBalanceView.as_view(), name='current-balance'),
    path('management/revenue-expenses/', RevenueExpensesView.as_view(), name='revenue-expenses'),
    path('management/projected-growth/', ProjectedGrowthView.as_view(), name='projected-growth'),
    path('suppliers/<int:pk>/account-movements/', SupplierViewSet.as_view({'get': 'account_movements'}), name='supplier-account-movements'),
    path('clients/<int:pk>/account-movements/', ClientViewSet.as_view({'get': 'account_movements'}), name='client-account-movements'),
    path('clients/<int:pk>/register-payment/', ClientViewSet.as_view({'post': 'register_payment'}), name='client-register-payment'),
    path('clients/<int:pk>/pending-sales/', ClientViewSet.as_view({'get': 'pending_sales'}), name='client-pending-sales'),
]
