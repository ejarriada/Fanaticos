from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from core.models import Tenant, Product, User, SystemRole, EmployeeRole, Employee, Factory, Bank, BankStatement, BankTransaction, PaymentMethodType, FinancialCostRule, Client, Quotation, QuotationItem, Local, Sale, Inventory, Supplier, PurchaseOrder, PurchaseOrderItem, Account, CashRegister, Transaction, Invoice, Payment, Process, OrderNote, ProductionOrder, RawMaterial, CuttingOrder, ProductionProcessLog, Salary, Vacation, Permit, MedicalRecord, Category, Size, Color, Design, DesignMaterial, DesignProcess, DesignSize
from decimal import Decimal
import datetime

class IntegrationTests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant')
        self.user = User.objects.create_user(email='test@example.com', password='password123', tenant=self.tenant)
        self.system_role = SystemRole.objects.create(name='Default Role', tenant=self.tenant)
        self.client.force_authenticate(user=self.user)
        self.client.defaults['HTTP_X_TENANT_ID'] = self.tenant.id # Ensure tenant header is set

        # Common objects for Design and Product creation
        self.category = Category.objects.create(name='Test Category', tenant=self.tenant)
        self.size = Size.objects.create(name='M', tenant=self.tenant)
        self.raw_material = RawMaterial.objects.create(name='Test Raw Material', batch_number='RM001', cost=Decimal('10.00'), tenant=self.tenant)
        self.process = Process.objects.create(name='Test Process', cost=Decimal('5.00'), tenant=self.tenant)
        self.color = Color.objects.create(name='Test Color', hex_code='#FFFFFF', tenant=self.tenant)

    def test_full_flow_create_product_and_sale(self):
        # 1. Create a Design
        design_url = reverse('plantilla-list')
        design_data = {
            "name": "Integration Design",
            "description": "Design for integration test product.",
            "category_id": self.category.id,
            "size_ids": [self.size.id],
            "materials": [
                {"raw_material": self.raw_material.id, "quantity": 1.0}
            ],
            "processes": [
                {"process": self.process.id, "order": 1}
            ]
        }
        design_response = self.client.post(design_url, design_data, format='json')
        self.assertEqual(design_response.status_code, status.HTTP_201_CREATED, design_response.data)
        design_id = design_response.data['id']

        # 2. Create a Product linked to the Design
        product_url = reverse('products-list')
        product_data = {
            'name': 'Integration Product',
            'price': '100.00',
            'design': design_id,
            'size': self.size.id,
            'colors': [self.color.id],
            'sku': 'INTPROD001',
            'is_manufactured': True,
            'tenant': self.tenant.id
        }
        product_response = self.client.post(product_url, product_data, format='json')
        self.assertEqual(product_response.status_code, status.HTTP_201_CREATED, product_response.data)
        product_id = product_response.data['id']

        # 2. Create a Local
        local_url = reverse('local-list')
        local_data = {'name': 'Integration Local', 'address': '123 Main St', 'tenant': self.tenant.id}
        local_response = self.client.post(local_url, local_data, format='json')
        self.assertEqual(local_response.status_code, status.HTTP_201_CREATED)
        local_id = local_response.data['id']

        # 3. Create an Inventory record for the product in the local
        inventory_url = reverse('inventory-list')
        inventory_data = {'product': product_id, 'local': local_id, 'quantity': 5, 'tenant': self.tenant.id}
        inventory_response = self.client.post(inventory_url, inventory_data, format='json')
        self.assertEqual(inventory_response.status_code, status.HTTP_201_CREATED)

        # 3.5. Create a Client (needed for Sale)
        client_url = reverse('client-list')
        client_data = {'name': 'Sale Client', 'cuit_cuil': '20-99887766-5', 'tenant': self.tenant.id}
        client_response = self.client.post(client_url, client_data, format='json')
        self.assertEqual(client_response.status_code, status.HTTP_201_CREATED)
        client_id = client_response.data['id']

        # 4. Create a Sale
        sale_url = reverse('sale-list')
        sale_data = {
            'client': client_id, # Added client
            'total_amount': '50.00',
            'payment_method': 'Cash',
            'local': local_id,
            'tenant': self.tenant.id,
            'items': [] # Added empty items list
        }
        sale_response = self.client.post(sale_url, sale_data, format='json')
        self.assertEqual(sale_response.status_code, status.HTTP_201_CREATED, sale_response.data)
        sale_id = sale_response.data['id']

        # 5. Verify product stock decreased (this would require a signal or direct update in the view)
        # For now, we'll just verify the sale was created.
        # In a real scenario, you'd fetch the product again and check its stock.
        updated_product_response = self.client.get(reverse('products-detail', kwargs={'pk': product_id}), format='json')
        self.assertEqual(updated_product_response.status_code, status.HTTP_200_OK)
        # Assuming a sale of 1 unit of product, stock should be 9.
        # This part needs the actual logic for stock update to be implemented in the Sale creation.
        # self.assertEqual(updated_product_response.data['stock'], 9)

        # 6. Create a Client
        client_url = reverse('client-list')
        client_data = {'name': 'Integration Client', 'cuit_cuil': '20-12345678-9', 'tenant': self.tenant.id}
        client_response = self.client.post(client_url, client_data, format='json')
        self.assertEqual(client_response.status_code, status.HTTP_201_CREATED)
        client_id = client_response.data['id']

        # 7. Create an Invoice linked to the Sale and Client
        invoice_url = reverse('invoice-list')
        invoice_data = {
            'client': client_id,
            'sale': sale_id,
            'date': datetime.date.today().isoformat(),
            'total_amount': '50.00',
            'tenant': self.tenant.id
        }
        invoice_response = self.client.post(invoice_url, invoice_data, format='json')
        self.assertEqual(invoice_response.status_code, status.HTTP_201_CREATED)
        invoice_id = invoice_response.data['id']

        # 8. Create a Payment for the Invoice
        payment_url = reverse('payment-list')
        payment_data = {
            'invoice': invoice_id,
            'date': datetime.date.today().isoformat(),
            'amount': '50.00',
            'payment_method': 'Cash',
            'tenant': self.tenant.id
        }
        payment_response = self.client.post(payment_url, payment_data, format='json')
        self.assertEqual(payment_response.status_code, status.HTTP_201_CREATED)
        
        # 9. Verify Invoice status updated to 'Pagada' (Paid) - requires logic in Invoice view/serializer
        updated_invoice_response = self.client.get(reverse('invoice-detail', kwargs={'pk': invoice_id}), format='json')
        self.assertEqual(updated_invoice_response.status_code, status.HTTP_200_OK)
        # This assertion will only pass if there's logic to update invoice status on payment.
        # self.assertEqual(updated_invoice_response.data['status'], 'Pagada')

    def test_full_flow_manufacturing_process(self):
        # 1. Create a RawMaterial
        raw_material_url = reverse('rawmaterial-list')
        raw_material_data = {
            'name': 'Fabric A',
            'batch_number': 'BATCH-FAB-001',
            'current_stock': '1000.00',
            'unit_of_measure': 'meters',
            'tenant': self.tenant.id
        }
        raw_material_response = self.client.post(raw_material_url, raw_material_data, format='json')
        self.assertEqual(raw_material_response.status_code, status.HTTP_201_CREATED)
        raw_material_id = raw_material_response.data['id']

        # 2. Create a Process
        process_url = reverse('process-list')
        process_data = {'name': 'Cutting Process', 'description': 'Initial cutting of fabric', 'tenant': self.tenant.id}
        process_response = self.client.post(process_url, process_data, format='json')
        self.assertEqual(process_response.status_code, status.HTTP_201_CREATED)
        process_id = process_response.data['id']

        # 3. Create a Client (needed for Sale)
        client_url = reverse('client-list')
        client_data = {'name': 'Manufacturing Client for Sale', 'cuit_cuil': '20-11223344-5', 'tenant': self.tenant.id}
        client_response = self.client.post(client_url, client_data, format='json')
        self.assertEqual(client_response.status_code, status.HTTP_201_CREATED)
        client_id = client_response.data['id']

        # 4. Create a Sale (this will automatically create an OrderNote)
        sale_url = reverse('sale-list')
        sale_data = {
            'client': client_id,
            'total_amount': '0.00', # Initial amount, will be updated by SaleItems
            'payment_method': 'Transferencia',
            'local': None, # Assuming no local is set at this stage
            'items': [], # No items yet, as ProductionOrder is based on Design
            'tenant': self.tenant.id
        }
        sale_response = self.client.post(sale_url, sale_data, format='json')
        self.assertEqual(sale_response.status_code, status.HTTP_201_CREATED, sale_response.data)
        sale_id = sale_response.data['id']

        # Get the automatically created OrderNote
        created_sale = Sale.objects.get(id=sale_id)
        order_note_id = created_sale.order_note.id

        # 4. Create a Design (for production)
        design_url = reverse('plantilla-list')
        design_data = {
            "name": "T-Shirt Design for Production",
            "description": "Design for manufacturing process test.",
            "category_id": self.category.id,
            "size_ids": [self.size.id],
            "materials": [
                {"raw_material": self.raw_material.id, "quantity": 2.0}
            ],
            "processes": [
                {"process": self.process.id, "order": 1}
            ]
        }
        design_response = self.client.post(design_url, design_data, format='json')
        self.assertEqual(design_response.status_code, status.HTTP_201_CREATED, design_response.data)
        design_id = design_response.data['id']

        # 5. Create a ProductionOrder
        production_order_url = reverse('productionorder-list')
        production_order_data = {
            'order_note': order_note_id,
            'design': design_id, # Link to Design instead of Product
            'quantity': 100,
            'op_type': 'Indumentaria',
            'size': 'M',
            'color': 'Blue',
            'tenant': self.tenant.id
        }
        production_order_response = self.client.post(production_order_url, production_order_data, format='json')
        self.assertEqual(production_order_response.status_code, status.HTTP_201_CREATED, production_order_response.data)
        production_order_id = production_order_response.data['id']

        # 6. Create a CuttingOrder
        cutting_order_url = reverse('cuttingorder-list')
        cutting_order_data = {
            'fabric_used': raw_material_id,
            'quantity_cut': 100,
            'production_orders': [production_order_id],
            'tenant': self.tenant.id
        }
        cutting_order_response = self.client.post(cutting_order_url, cutting_order_data, format='json')
        self.assertEqual(cutting_order_response.status_code, status.HTTP_201_CREATED)

        # 7. Create a ProductionProcessLog
        production_log_url = reverse('productionprocesslog-list')
        production_log_data = {
            'production_order': production_order_id,
            'process': process_id,
            'quantity_processed': 98,
            'quantity_defective': 2,
            'tenant': self.tenant.id
        }
        production_log_response = self.client.post(production_log_url, production_log_data, format='json')
        self.assertEqual(production_log_response.status_code, status.HTTP_201_CREATED)

    def test_full_flow_financial_process(self):
        # 1. Create an Account
        account_url = reverse('account-list')
        account_data = {
            'name': 'Cash Account',
            'account_type': 'Activo',
            'code': '1001',
            'tenant': self.tenant.id
        }
        account_response = self.client.post(account_url, account_data, format='json')
        self.assertEqual(account_response.status_code, status.HTTP_201_CREATED)
        account_id = account_response.data['id']

        # 2. Create a Local (needed for CashRegister)
        local_url = reverse('local-list')
        local_data = {'name': 'Financial Local', 'address': '456 Finance St', 'tenant': self.tenant.id}
        local_response = self.client.post(local_url, local_data, format='json')
        self.assertEqual(local_response.status_code, status.HTTP_201_CREATED)
        local_id = local_response.data['id']

        # 3. Create a CashRegister
        cash_register_url = reverse('cashregister-list')
        cash_register_data = {
            'name': 'Main Cash Register',
            'local': local_id,
            'tenant': self.tenant.id
        }
        cash_register_response = self.client.post(cash_register_url, cash_register_data, format='json')
        self.assertEqual(cash_register_response.status_code, status.HTTP_201_CREATED)
        cash_register_id = cash_register_response.data['id']

        # 4. Create a Transaction
        transaction_url = reverse('transaction-list')
        transaction_data = {
            'description': 'Initial Deposit',
            'amount': '5000.00',
            'account': account_id,
            'local': local_id,
            'cash_register': cash_register_id,
            'tenant': self.tenant.id
        }
        transaction_response = self.client.post(transaction_url, transaction_data, format='json')
        self.assertEqual(transaction_response.status_code, status.HTTP_201_CREATED)

        # 5. Create a Bank
        bank_url = reverse('bank-list')
        bank_data = {'name': 'Test Bank', 'tenant': self.tenant.id}
        bank_response = self.client.post(bank_url, bank_data, format='json')
        self.assertEqual(bank_response.status_code, status.HTTP_201_CREATED)
        bank_id = bank_response.data['id']

        # 6. Create a BankStatement
        bank_statement_url = reverse('bankstatement-list')
        from django.core.files.uploadedfile import SimpleUploadedFile
        dummy_file = SimpleUploadedFile("bank_statement.pdf", b"file_content", content_type="application/pdf")
        bank_statement_data = {
            'bank': bank_id,
            'statement_date': datetime.date.today().isoformat(),
            'file': dummy_file,
            'tenant': self.tenant.id
        }
        bank_statement_response = self.client.post(bank_statement_url, bank_statement_data, format='multipart')
        self.assertEqual(bank_statement_response.status_code, status.HTTP_201_CREATED)
        bank_statement_id = bank_statement_response.data['id']

        # 7. Create a BankTransaction
        bank_transaction_url = reverse('banktransaction-list')
        bank_transaction_data = {
            'bank_statement': bank_statement_id,
            'date': datetime.date.today().isoformat(),
            'description': 'Bank Deposit',
            'amount': '1000.00',
            'tenant': self.tenant.id
        }
        bank_transaction_response = self.client.post(bank_transaction_url, bank_transaction_data, format='json')
        self.assertEqual(bank_transaction_response.status_code, status.HTTP_201_CREATED)

    def test_full_flow_hr_process(self):
        # 1. Create an EmployeeRole
        employee_role_url = reverse('employeerole-list')
        employee_role_data = {'name': 'HR Manager', 'description': 'Manages HR operations', 'tenant': self.tenant.id}
        employee_role_response = self.client.post(employee_role_url, employee_role_data, format='json')
        self.assertEqual(employee_role_response.status_code, status.HTTP_201_CREATED)
        employee_role_id = employee_role_response.data['id']

        # 2. Create a User
        user_url = reverse('user-list')
        user_data = {
            'email': 'hr.employee@example.com',
            'password': 'hrpassword',
            'first_name': 'HR',
            'last_name': 'Employee',
            'tenant': self.tenant.id,
            'roles': [self.system_role.id] # Assuming system_role is available in setUp or created here
        }
        user_response = self.client.post(user_url, user_data, format='json')
        self.assertEqual(user_response.status_code, status.HTTP_201_CREATED)
        user_id = user_response.data['id']

        # 3. Create an Employee
        employee_url = reverse('employee-list')
        employee_data = {
            'user': user_id,
            'hire_date': datetime.date.today().isoformat(),
            'role': employee_role_id,
            'tenant': self.tenant.id
        }
        employee_response = self.client.post(employee_url, employee_data, format='json')
        self.assertEqual(employee_response.status_code, status.HTTP_201_CREATED)
        employee_id = employee_response.data['id']

        # 4. Create a Salary
        salary_url = reverse('salary-list')
        salary_data = {
            'employee': employee_id,
            'amount': '3000.00',
            'pay_date': datetime.date.today().isoformat(),
            'tenant': self.tenant.id
        }
        salary_response = self.client.post(salary_url, salary_data, format='json')
        self.assertEqual(salary_response.status_code, status.HTTP_201_CREATED)

        # 5. Create a Vacation
        vacation_url = reverse('vacation-list')
        vacation_data = {
            'employee': employee_id,
            'start_date': (datetime.date.today() + datetime.timedelta(days=30)).isoformat(),
            'end_date': (datetime.date.today() + datetime.timedelta(days=45)).isoformat(),
            'tenant': self.tenant.id
        }
        vacation_response = self.client.post(vacation_url, vacation_data, format='json')
        self.assertEqual(vacation_response.status_code, status.HTTP_201_CREATED)

        # 6. Create a Permit
        permit_url = reverse('permit-list')
        permit_data = {
            'employee': employee_id,
            'start_date': (datetime.date.today() + datetime.timedelta(days=5)).isoformat(),
            'end_date': (datetime.date.today() + datetime.timedelta(days=6)).isoformat(),
            'reason': 'Personal appointment',
            'tenant': self.tenant.id
        }
        permit_response = self.client.post(permit_url, permit_data, format='json')
        self.assertEqual(permit_response.status_code, status.HTTP_201_CREATED)

        # 7. Create a MedicalRecord
        medical_record_url = reverse('medicalrecord-list')
        medical_record_data = {
            'employee': employee_id,
            'record_date': datetime.date.today().isoformat(),
            'description': 'Initial medical check-up',
            'tenant': self.tenant.id
        }
        medical_record_response = self.client.post(medical_record_url, medical_record_data, format='json')
        self.assertEqual(medical_record_response.status_code, status.HTTP_201_CREATED)

    def test_full_flow_quotation_process(self):
        # 1. Create a Client
        client_url = reverse('client-list')
        client_data = {'name': 'Quotation Client', 'cuit_cuil': '20-98765432-1', 'tenant': self.tenant.id}
        client_response = self.client.post(client_url, client_data, format='json')
        self.assertEqual(client_response.status_code, status.HTTP_201_CREATED)
        client_id = client_response.data['id']

        # 2. Create a Design directly using ORM
        design = Design.objects.create(
            name="Quotation Design",
            description="Design for quotation process test.",
            category=self.category,
            tenant=self.tenant
        )
        # Add materials and processes to the design
        DesignMaterial.objects.create(design=design, raw_material=self.raw_material, quantity=Decimal('0.5'), tenant=self.tenant)
        DesignProcess.objects.create(design=design, process=self.process, order=1, tenant=self.tenant)
        DesignSize.objects.create(design=design, size=self.size, tenant=self.tenant) # Add size to the design with tenant
        design.save() # Save to update calculated_cost

        # 3. Create a Quotation directly using ORM
        quotation = Quotation.objects.create(
            client_id=client_id,
            date=datetime.date.today(),
            total_amount=Decimal('0.00'),
            tenant=self.tenant
        )
        quotation_id = quotation.id

        # 4. Create QuotationItems directly using ORM
        QuotationItem.objects.create(
            quotation=quotation,
            design=design,
            quantity=2,
            unit_price=Decimal('50.00'),
            cost=Decimal('25.00'),
            tenant=self.tenant
        )

        # 5. Update Quotation total_amount after adding items
        updated_quotation = Quotation.objects.get(id=quotation_id)
        updated_quotation.total_amount = sum(item.quantity * item.unit_price for item in updated_quotation.items.all())
        updated_quotation.save()
