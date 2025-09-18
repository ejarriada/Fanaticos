
.
├── bank_statements/
│   ├── (Numerosos archivos PDF de extractos)
├── core/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── backends.py
│   ├── models.py
│   ├── serializers.py
│   ├── signals.py
│   ├── tests.py
│   ├── urls.py
│   ├── views.py
│   ├── migrations/
│   │   ├── __init__.py
│   │   ├── 0001_initial.py
│   │   ├── 0002_bank_bankstatement_banktransaction_client_and_more.py
│   │   ├── 0003_alter_user_email.py
│   │   ├── 0004_rename_cuit_cuil_client_cuit_and_more.py
│   │   ├── 0005_employee_local.py
│   │   ├── 0006_medicalrecord_file.py
│   │   ├── 0007_stockadjustment.py
│   │   ├── 0008_product_is_manufactured.py
│   │   ├── 0009_remove_productionorder_product_design_design_and_more.py
│   │   ├── 0010_remove_design_dimensions_remove_design_patterns_and_more.py
│   │   ├── 0011_designmaterial_design_raw_materials_designprocess_and_more.py
│   │   ├── 0012_alter_ordernote_sale_alter_productionorder_design_and_more.py
│   │   ├── 0013_rawmaterial_supplier.py
│   │   ├── 0014_auto_20250828_1905.py
│   │   ├── 0015_process_applies_to_indumentaria_and_more.py
│   │   ├── 0016_remove_product_stock_design_calculated_cost_and_more.py
│   │   ├── 0017_design_product_code.py
│   │   ├── 0018_remove_product_color_color_product_colors.py
│   │   ├── 0019_supplier_account_number_supplier_address_and_more.py
│   │   ├── 0020_check.py
│   │   ├── 0021_rawmaterial_brand_rawmaterial_category_and_more.py
│   │   ├── 0022_remove_rawmaterial_batch_number_and_more.py
│   │   ├── 0023_materiaprimaproveedor_qr_code_data.py
│   │   ├── 0024_pedidomaterial.py
│   │   ├── 0025_pedidomaterial_user.py
│   │   ├── 0026_designmaterial_cost.py
│   │   ├── 0027_designprocess_cost.py
│   │   ├── 0028_remove_design_design_file_designfile.py
│   │   ├── 0029_product_waste_product_weight_productfile.py
│   │   ├── 0030_auto_20250910_1416.py
│   │   ├── 0031_remove_product_price_product_club_price_and_more.py
│   │   ├── 0032_client_city_client_details_client_iva_condition_and_more.py
│   │   ├── 0033_remove_client_type.py
│   │   ├── 0034_quotation_quotation_id.py
│   │   ├── 0035_auto_20250911_1609.py
│   │   ├── 0036_remove_quotationitem_design_quotationitem_product.py
│   │   ├── 0037_quotation_user.py
│   │   ├── 0038_remove_saleitem_design_saleitem_product.py
│   │   ├── 0039_sale_user.py
│   │   └── 0040_quotationitem_color_quotationitem_size.py
│   └── tests/
│       ├── __init__.py
│       ├── test_integration.py
│       └── test_new_sales_flow.py
├── frontend_comercializadora/
│   ├── .dockerignore
│   ├── .env
│   ├── .gitignore
│   ├── Dockerfile
│   ├── FRONTEND_STRATEGY.md
│   ├── nginx.conf
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── index.html
│   │   ├── logo192.png
│   │   ├── logo512.png
│   │   ├── manifest.json
│   │   └── robots.txt
│   └── src/
│       ├── App.css
│       ├── App.js
│       ├── App.test.js
│       ├── index.css
│       ├── index.js
│       ├── logo.svg
│       ├── reportWebVitals.js
│       ├── setupTests.js
│       ├── theme.js
│       ├── components/
│       │   ├── charts/
│       │   │   ├── CurrentBalanceChart.js
│       │   │   ├── InventoryTurnoverChart.js
│       │   │   ├── OverallProfitLossChart.js
│       │   │   ├── ProjectedGrowthChart.js
│       │   │   ├── RevenueExpensesChart.js
│       │   │   ├── SalesVolumeChart.js
│       │   │   └── SupplierPerformanceChart.js
│       │   ├── modules/
│       │   │   ├── AccountingFinanceModule.js
│       │   │   ├── AccountManagement.js
│       │   │   ├── BankManagement.js
│       │   │   ├── BankStatementManagement.js
│       │   │   ├── CashRegisterManagement.js
│       │   │   ├── ClientManagement.js
│       │   │   ├── DeliveryNoteManagement.js
│       │   │   ├── EmployeeManagement.js
│       │   │   ├── EmployeeRoleManagement.js
│       │   │   ├── FactoryManagement.js
│       │   │   ├── FinancialCostRuleManagement.js
│       │   │   ├── HumanResourcesModule.js
│       │   │   ├── InventoryManagement.js
│       │   │   ├── InvoiceManagement.js
│       │   │   ├── LocalManagement.js
│       │   │   ├── MedicalRecordManagement.js
│       │   │   ├── NuevoRemitoForm.js
│       │   │   ├── PaymentManagement.js
│       │   │   ├── PaymentMethodTypeManagement.js
│       │   │   ├── PermitManagement.js
│       │   │   ├── PointOfSale.js
│       │   │   ├── PurchaseOrderManagement.js
│       │   │   ├── SalaryManagement.js
│       │   │   ├── SaleManagement.js
│       │   │   ├── SalesList.js
│       │   │   ├── StockAdjustmentDialog.js
│       │   │   ├── SupplierManagement.js
│       │   │   ├── TransactionManagement.js
│       │   │   ├── UserManagement.js
│       │   │   └── VacationManagement.js
│       │   ├── reports/
│       │   │   └── ReportsModule.js
│       │   ├── ManagementDashboard.js
│       │   ├── Navbar.css
│       │   ├── Navbar.js
│       │   ├── Sidebar.js
│       │   └── TradingDashboard.js
│       ├── context/
│       │   └── AuthContext.js
│       ├── pages/
│       │   └── LoginPage.js
│       └── utils/
│           ├── api.js
│           └── axiosInstance.js
├── frontend_manufacturera/
│   ├── .dockerignore
│   ├── .env
│   ├── .gitignore
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── index.html
│   │   ├── logo192.png
│   │   ├── logo512.png
│   │   ├── manifest.json
│   │   └── robots.txt
│   └── src/
│       ├── App.css
│       ├── App.js
│       ├── App.test.js
│       ├── index.css
│       ├── index.js
│       ├── logo.svg
│       ├── reportWebVitals.js
│       ├── setupTests.js
│       ├── theme.js
│       ├── components/
│       │   ├── charts/
│       │   │   ├── CurrentBalanceChart.js
│       │   │   ├── DefectiveRateChart.js
│       │   │   ├── OverallProfitLossChart.js
│       │   │   ├── ProcessCompletionChart.js
│       │   │   ├── ProductionVolumeChart.js
│       │   │   ├── ProjectedGrowthChart.js
│       │   │   ├── RawMaterialConsumptionChart.js
│       │   │   └── RevenueExpensesChart.js
│       │   ├── modules/
│       │   │   ├── AbsencesManagement.js
│       │   │   ├── AccountingFinanceModule.js
│       │   │   ├── AccountManagement.js
│       │   │   ├── AlmacenesManagement.js
│       │   │   ├── BankManagement.js
│       │   │   ├── BankStatementManagement.js
│       │   │   ├── CashRegisterManagement.js
│       │   │   ├── ChequesManagement.js
│       │   │   ├── ClientesModule.js
│       │   │   ├── ClientList.js
│       │   │   ├── ComprasProveedor.js
│       │   │   ├── CotizacionModule.js
│       │   │   ├── CuentaCorrienteProveedor.js
│       │   │   ├── CuentaPorCliente.js
│       │   │   ├── CuttingOrderManagement.js
│       │   │   ├── EmployeeManagement.js
│       │   │   ├── EmployeeRoleManagement.js
│       │   │   ├── ExpenseManagement.js
│       │   │   ├── ExpenseSummary.js
│       │   │   ├── FactoryManagement.js
│       │   │   ├── FinancialCostRuleManagement.js
│       │   │   ├── FinancialSummary.js
│       │   │   ├── FinanzasModule.js
│       │   │   ├── HumanResourcesModule.js
│       │   │   ├── InventarioModule.js
│       │   │   ├── InventoryHub.js
│       │   │   ├── InvoiceManagement.js
│       │   │   ├── MateriaPrimaStock.js
│       │   │   ├── MateriasPrimasModule.js
│       │   │   ├── MedicalRecordManagement.js
│       │   │   ├── NewCheckForm.js
│       │   │   ├── NewPurchaseForm.js
│       │   │   ├── NewSaleForm.js
│       │   │   ├── NotaPedidoModule.js
│       │   │   ├── NuevoRemitoForm.js
│       │   │   ├── OrderNoteManagement.js
│       │   │   ├── PagosProveedor.js
│       │   │   ├── PaymentManagement.js
│       │   │   ├── PaymentMethodTypeManagement.js
│       │   │   ├── PaymentRules.js
│       │   │   ├── PedidosMateriales.js
│       │   │   ├── PermitManagement.js
│       │   │   ├── PlantillasProductoList.js
│       │   │   ├── PointOfSale.js
│       │   │   ├── PresupuestoModule.js
│       │   │   ├── ProcessManagement.js
│       │   │   ├── ProduccionModule.js
│       │   │   ├── ProductionOrderFormIndumentaria.js
│       │   │   ├── ProductionOrderFormMedias.js
│       │   │   ├── ProductionOrderList.js
│       │   │   ├── ProductionProcessLogManagement.js
│       │   │   ├── ProductionTracking.js
│       │   │   ├── ProductosFinalesList.js
│       │   │   ├── ProductosModule.js
│       │   │   ├── ProductosTerminadosStock.js
│       │   │   ├── ProveedoresModule.js
│       │   │   ├── QuotationForm.js
│       │   │   ├── QuotationManagement.js
│       │   │   ├── RawMaterialList.js
│       │   │   ├── RemitosModule.js
│       │   │   ├── RRHHModule.js
│       │   │   ├── SalaryManagement.js
│       │   │   ├── SalesList.js
│       │   │   ├── StockAdjustmentDialog.js
│       │   │   ├── SupplierList.js
│       │   │   ├── TestComponent.js
│       │   │   ├── TransactionManagement.js
│       │   │   ├── UserManagement.js
│       │   │   ├── VacationManagement.js
│       │   │   ├── VentasModule.js
│       │   │   └── VerRemitosList.js
│       │   ├── reports/
│       │   │   └── ReportsModule.js
│       │   ├── ManagementDashboard.js
│       │   ├── ManufacturingDashboard.js
│       │   ├── Navbar.css
│       │   ├── Navbar.js
│       │   └── Sidebar.js
│       ├── context/
│       │   └── AuthContext.js
│       ├── pages/
│       │   └── LoginPage.js
│       └── utils/
│           ├── api.js
│           └── axiosInstance.js
├── sistema_fanaticos_backend/
│   ├── __init__.py
│   ├── .dockerignore
│   ├── asgi.py
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── 322fb515-6311-44a9-ba5b-707e4bd2f498.pdf
├── 6cd40b47-8f6d-432e-96a0-f28725072b0a.pdf
├── 7f101c35-7c7d-4712-83f8-6b57470820e2.pdf
├── 853d4f2a-7178-43d5-beed-0f506762be71.pdf
├── db.sqlite3
├── docker-compose.yml
├── estructura.md
├── fanaticos.jpeg
├── fanaticos.webp
├── FrontendManufactura.txt
├── gemini_debugging_session_summary.md
├── Informe.txt
├── manage.py
├── Manual_Usuario.md
├── productos.xlsx
├── PROJECT_CONTEXT.md
├── VISION.md
└── WORK_PLAN.md
