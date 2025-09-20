import os
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Tenant, Product, Supplier, Client, Local, Sale, Process, OrderNote, ProductionOrder, RawMaterial, Inventory, PurchaseOrder, PurchaseOrderItem, CuttingOrder, ProductionProcessLog, Account, CashRegister, Transaction, Invoice, Payment, Bank, BankStatement, BankTransaction, PaymentMethodType, FinancialCostRule, Factory, EmployeeRole, Employee, User, Salary, Vacation, Permit, MedicalRecord, Quotation, QuotationItem, SystemRole, Design
from decimal import Decimal
from django.core.files.uploadedfile import SimpleUploadedFile
import datetime

class ProductAPITests(APITestCase):
    def setUp(self):
        """
        Set up a tenant for all tests.
        """
        self.tenant = Tenant.objects.create(name='Test Tenant')

    def test_create_product(self):
        """
        Ensure we can create a new product.
        """
        url = reverse('products-list')
        data = {'name': 'Test Product', 'price': '100.00', 'stock': 10, 'tenant': self.tenant.id}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 1)
        self.assertEqual(Product.objects.get().name, 'Test Product')

    def test_list_products(self):
        """
        Ensure we can list products for a tenant.
        """
        Product.objects.create(name='Product 1', price=50, stock=5, tenant=self.tenant)
        Product.objects.create(name='Product 2', price=150, stock=15, tenant=self.tenant)
        
        url = reverse('products-list') + f'?tenant_id={self.tenant.id}'
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_product_detail(self):
        """
        Ensure we can retrieve a single product.
        """
        product = Product.objects.create(name='Detailed Product', price=120, stock=12, tenant=self.tenant)
        url = reverse('products-detail', kwargs={'pk': product.pk})
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Detailed Product')

    def test_update_product(self):
        """
        Ensure we can update a product.
        """
        product = Product.objects.create(name='Original Name', price=10, stock=1, tenant=self.tenant)
        url = reverse('products-detail', kwargs={'pk': product.pk})
        data = {'name': 'Updated Name', 'price': '20.00', 'stock': 2, 'tenant': self.tenant.id}
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        product.refresh_from_db()
        self.assertEqual(product.name, 'Updated Name')

    def test_delete_product(self):
        """
        Ensure we can delete a product.
        """
        product = Product.objects.create(name='To Be Deleted', price=1, stock=1, tenant=self.tenant)
        url = reverse('products-detail', kwargs={'pk': product.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Product.objects.count(), 0)

class SupplierAPITests(APITestCase):
    def setUp(self):
        """
        Set up a tenant for all tests.
        """
        self.tenant = Tenant.objects.create(name='Test Tenant')

    def test_create_supplier(self):
        """
        Ensure we can create a new supplier.
        """
        url = reverse('supplier-list')
        data = {'name': 'Test Supplier', 'cuit_cuil': '30-12345678-9', 'tenant': self.tenant.id}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Supplier.objects.count(), 1)
        self.assertEqual(Supplier.objects.get().name, 'Test Supplier')

    def test_list_suppliers(self):
        """
        Ensure we can list suppliers for a tenant.
        """
        Supplier.objects.create(name='Supplier 1', cuit_cuil='30-11111111-1', tenant=self.tenant)
        Supplier.objects.create(name='Supplier 2', cuit_cuil='30-22222222-2', tenant=self.tenant)
        
        url = reverse('supplier-list')
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_supplier_detail(self):
        """
        Ensure we can retrieve a single supplier.
        """
        supplier = Supplier.objects.create(name='Detailed Supplier', cuit_cuil='30-33333333-3', tenant=self.tenant)
        url = reverse('supplier-detail', kwargs={'pk': supplier.pk})
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Detailed Supplier')

    def test_update_supplier(self):
        """
        Ensure we can update a supplier.
        """
        supplier = Supplier.objects.create(name='Original Name', cuit_cuil='30-44444444-4', tenant=self.tenant)
        url = reverse('supplier-detail', kwargs={'pk': supplier.pk})
        data = {'name': 'Updated Name', 'cuit_cuil': '30-55555555-5', 'tenant': self.tenant.id}
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        supplier.refresh_from_db()
        self.assertEqual(supplier.name, 'Updated Name')

    def test_delete_supplier(self):
        """
        Ensure we can delete a supplier.
        """
        supplier = Supplier.objects.create(name='To Be Deleted', cuit_cuil='30-66666666-6', tenant=self.tenant)
        url = reverse('supplier-detail', kwargs={'pk': supplier.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Supplier.objects.count(), 0)

class ClientAPITests(APITestCase):
    def setUp(self):
        """
        Set up a tenant for all tests.
        """
        self.tenant = Tenant.objects.create(name='Test Tenant')

    def test_create_client(self):
        """
        Ensure we can create a new client.
        """
        url = reverse('client-list')
        data = {'name': 'Test Client', 'cuit_cuil': '20-12345678-9', 'tenant': self.tenant.id}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Client.objects.count(), 1)
        self.assertEqual(Client.objects.get().name, 'Test Client')

    def test_list_clients(self):
        """
        Ensure we can list clients for a tenant.
        """
        Client.objects.create(name='Client 1', cuit_cuil='20-11111111-1', tenant=self.tenant)
        Client.objects.create(name='Client 2', cuit_cuil='20-22222222-2', tenant=self.tenant)
        
        url = reverse('client-list')
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_client_detail(self):
        """
        Ensure we can retrieve a single client.
        """
        client = Client.objects.create(name='Detailed Client', cuit_cuil='20-33333333-3', tenant=self.tenant)
        url = reverse('client-detail', kwargs={'pk': client.pk})
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Detailed Client')

    def test_update_client(self):
        """
        Ensure we can update a client.
        """
        client = Client.objects.create(name='Original Name', cuit_cuil='20-44444444-4', tenant=self.tenant)
        url = reverse('client-detail', kwargs={'pk': client.pk})
        data = {'name': 'Updated Name', 'cuit_cuil': '20-55555555-5', 'tenant': self.tenant.id}
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        client.refresh_from_db()
        self.assertEqual(client.name, 'Updated Name')

    def test_delete_client(self):
        """
        Ensure we can delete a client.
        """
        client = Client.objects.create(name='To Be Deleted', cuit_cuil='20-66666666-6', tenant=self.tenant)
        url = reverse('client-detail', kwargs={'pk': client.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Client.objects.count(), 0)

class LocalAPITests(APITestCase):
    def setUp(self):
        """
        Set up a tenant for all tests.
        """
        self.tenant = Tenant.objects.create(name='Test Tenant')

    def test_create_local(self):
        """
        Ensure we can create a new local.
        """
        url = reverse('local-list')
        data = {'name': 'Test Local', 'address': '123 Test St', 'tenant': self.tenant.id}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Local.objects.count(), 1)
        self.assertEqual(Local.objects.get().name, 'Test Local')

    def test_list_locals(self):
        """
        Ensure we can list locals for a tenant.
        """
        Local.objects.create(name='Local 1', address='1 Main St', tenant=self.tenant)
        Local.objects.create(name='Local 2', address='2 Main St', tenant=self.tenant)
        
        url = reverse('local-list')
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_local_detail(self):
        """
        Ensure we can retrieve a single local.
        """
        local = Local.objects.create(name='Detailed Local', address='3 Detail St', tenant=self.tenant)
        url = reverse('local-detail', kwargs={'pk': local.pk})
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Detailed Local')

    def test_update_local(self):
        """
        Ensure we can update a local.
        """
        local = Local.objects.create(name='Original Name', address='4 Original St', tenant=self.tenant)
        url = reverse('local-detail', kwargs={'pk': local.pk})
        data = {'name': 'Updated Name', 'address': '4 Updated St', 'tenant': self.tenant.id}
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        local.refresh_from_db()
        self.assertEqual(local.name, 'Updated Name')

    def test_delete_local(self):
        """
        Ensure we can delete a local.
        """
        local = Local.objects.create(name='To Be Deleted', address='5 Delete St', tenant=self.tenant)
        url = reverse('local-detail', kwargs={'pk': local.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Local.objects.count(), 0)

class SaleAPITests(APITestCase):
    def setUp(self):
        """
        Set up a tenant, a local, and a client for all tests.
        """
        self.tenant = Tenant.objects.create(name='Test Tenant')
        self.local = Local.objects.create(name='Test Local', tenant=self.tenant)
        self.client_obj = Client.objects.create(name='Test Client', tenant=self.tenant)

    def test_create_sale(self):
        """
        Ensure we can create a new sale.
        """
        url = reverse('sale-list')
        data = {
            'total_amount': '150.75',
            'payment_method': 'Credit Card',
            'local': self.local.id,
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Sale.objects.count(), 1)
        self.assertEqual(Sale.objects.get().total_amount, 150.75)

    def test_list_sales(self):
        """
        Ensure we can list sales for a tenant.
        """
        Sale.objects.create(total_amount='100.00', local=self.local, tenant=self.tenant)
        Sale.objects.create(total_amount='200.50', local=self.local, tenant=self.tenant)
        
        url = reverse('sale-list')
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_sale_detail(self):
        """
        Ensure we can retrieve a single sale.
        """
        sale = Sale.objects.create(total_amount='300.00', local=self.local, tenant=self.tenant)
        url = reverse('sale-detail', kwargs={'pk': sale.pk})
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(float(response.data['total_amount']), 300.00)

    def test_update_sale(self):
        """
        Ensure we can update a sale.
        """
        sale = Sale.objects.create(total_amount='400.00', local=self.local, tenant=self.tenant)
        url = reverse('sale-detail', kwargs={'pk': sale.pk})
        data = {
            'total_amount': '450.25',
            'payment_method': 'Debit Card',
            'local': self.local.id,
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        sale.refresh_from_db()
        self.assertEqual(sale.total_amount, 450.25)

    def test_delete_sale(self):
        """
        Ensure we can delete a sale.
        """
        sale = Sale.objects.create(total_amount='500.00', local=self.local, tenant=self.tenant)
        url = reverse('sale-detail', kwargs={'pk': sale.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Sale.objects.count(), 0)

    def test_create_sale_from_quotation(self):
        # Create a Design for quotation items
        design = Design.objects.create(name='Test Design 2', calculated_cost=Decimal('60.00'), tenant=self.tenant)

        # Create a quotation with items
        quotation = Quotation.objects.create(
            client=self.client_obj,
            date=datetime.date.today(),
            total_amount=Decimal('180.00'),
            status='Enviada',
            tenant=self.tenant
        )
        QuotationItem.objects.create(
            quotation=quotation,
            design=design,
            quantity=3,
            unit_price=Decimal('60.00'),
            cost=Decimal('60.00'),
            tenant=self.tenant
        )

        url = reverse('sale-list')
        data = {
            'client': self.client_obj.id,
            'local': self.local.id,
            'payment_method': 'Transferencia',
            'related_quotation': quotation.id,
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json', HTTP_X_TENANT_ID=self.tenant.id)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Sale.objects.count(), 1)

        new_sale = Sale.objects.get(related_quotation=quotation)
        self.assertEqual(new_sale.client, self.client_obj)
        self.assertEqual(new_sale.related_quotation, quotation)

        # Verify SaleItems
        sale_items = new_sale.items.all()
        self.assertEqual(len(sale_items), 1)
        
        # Check recalculated prices (assuming MARKUP_PERCENTAGE = 0.20)
        expected_unit_price = Decimal('60.00') * Decimal('1.20') # 60.00 * 1.20 = 72.00
        expected_cost = Decimal('60.00')

        self.assertEqual(sale_items[0].design, design)
        self.assertEqual(sale_items[0].quantity, 3)
        self.assertEqual(sale_items[0].unit_price, expected_unit_price)
        self.assertEqual(sale_items[0].cost, expected_cost)

        # Verify total amount
        self.assertEqual(new_sale.total_amount, 3 * expected_unit_price)

        # Verify quotation status
        quotation.refresh_from_db()
        self.assertEqual(quotation.status, 'Aceptada')

class ProcessAPITests(APITestCase):
    def setUp(self):
        """
        Set up a tenant for all tests.
        """
        self.tenant = Tenant.objects.create(name='Test Tenant')

    def test_create_process(self):
        """
        Ensure we can create a new process.
        """
        url = reverse('process-list')
        data = {'name': 'Cutting', 'description': 'Cutting process', 'tenant': self.tenant.id}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Process.objects.count(), 1)
        self.assertEqual(Process.objects.get().name, 'Cutting')

    def test_list_processes(self):
        """
        Ensure we can list processes for a tenant.
        """
        Process.objects.create(name='Cutting', tenant=self.tenant)
        Process.objects.create(name='Sewing', tenant=self.tenant)
        
        url = reverse('process-list')
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_process_detail(self):
        """
        Ensure we can retrieve a single process.
        """
        process = Process.objects.create(name='Finishing', tenant=self.tenant)
        url = reverse('process-detail', kwargs={'pk': process.pk})
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Finishing')

    def test_update_process(self):
        """
        Ensure we can update a process.
        """
        process = Process.objects.create(name='Original Process', tenant=self.tenant)
        url = reverse('process-detail', kwargs={'pk': process.pk})
        data = {'name': 'Updated Process', 'description': 'Updated description', 'tenant': self.tenant.id}
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        process.refresh_from_db()
        self.assertEqual(process.name, 'Updated Process')

    def test_delete_process(self):
        """
        Ensure we can delete a process.
        """
        process = Process.objects.create(name='To Be Deleted', tenant=self.tenant)
        url = reverse('process-detail', kwargs={'pk': process.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Process.objects.count(), 0)

class OrderNoteAPITests(APITestCase):
    def setUp(self):
        """
        Set up a tenant for all tests.
        """
        self.tenant = Tenant.objects.create(name='Test Tenant')

    def test_create_order_note(self):
        """
        Ensure we can create a new order note.
        """
        url = reverse('ordernote-list')
        data = {
            'client_name': 'Test Client',
            'estimated_delivery_date': datetime.date.today() + datetime.timedelta(days=10),
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(OrderNote.objects.count(), 1)
        self.assertEqual(OrderNote.objects.get().client_name, 'Test Client')

    def test_list_order_notes(self):
        """
        Ensure we can list order notes for a tenant.
        """
        OrderNote.objects.create(client_name='Client 1', estimated_delivery_date=datetime.date.today(), tenant=self.tenant)
        OrderNote.objects.create(client_name='Client 2', estimated_delivery_date=datetime.date.today(), tenant=self.tenant)
        
        url = reverse('ordernote-list')
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_order_note_detail(self):
        """
        Ensure we can retrieve a single order note.
        """
        order_note = OrderNote.objects.create(client_name='Detailed Client', estimated_delivery_date=datetime.date.today(), tenant=self.tenant)
        url = reverse('ordernote-detail', kwargs={'pk': order_note.pk})
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['client_name'], 'Detailed Client')

    def test_update_order_note(self):
        """
        Ensure we can update an order note.
        """
        order_note = OrderNote.objects.create(client_name='Original Client', estimated_delivery_date=datetime.date.today(), tenant=self.tenant)
        url = reverse('ordernote-detail', kwargs={'pk': order_note.pk})
        data = {
            'client_name': 'Updated Client',
            'estimated_delivery_date': (datetime.date.today() + datetime.timedelta(days=20)).isoformat(),
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order_note.refresh_from_db()
        self.assertEqual(order_note.client_name, 'Updated Client')

    def test_delete_order_note(self):
        """
        Ensure we can delete an order note.
        """
        order_note = OrderNote.objects.create(client_name='To Be Deleted', estimated_delivery_date=datetime.date.today(), tenant=self.tenant)
        url = reverse('ordernote-detail', kwargs={'pk': order_note.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(OrderNote.objects.count(), 0)

class ProductionOrderAPITests(APITestCase):
    def setUp(self):
        """
        Set up a tenant, order note and product for all tests.
        """
        self.tenant = Tenant.objects.create(name='Test Tenant')
        self.order_note = OrderNote.objects.create(
            client_name='Test Client',
            estimated_delivery_date=datetime.date.today(),
            tenant=self.tenant
        )
        self.product = Product.objects.create(
            name='Test Product',
            price=100,
            stock=10,
            tenant=self.tenant
        )

    def test_create_production_order(self):
        """
        Ensure we can create a new production order.
        """
        url = reverse('productionorder-list')
        data = {
            'order_note': self.order_note.id,
            'product_design': self.product.id,
            'quantity': 100,
            'op_type': 'Indumentaria',
            'size': 'M',
            'color': 'Blue',
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ProductionOrder.objects.count(), 1)
        self.assertEqual(ProductionOrder.objects.get().quantity, 100)

    def test_list_production_orders(self):
        """
        Ensure we can list production orders for a tenant.
        """
        ProductionOrder.objects.create(
            order_note=self.order_note,
            product_design=self.product,
            quantity=50,
            op_type='Medias',
            size='S',
            color='Red',
            tenant=self.tenant
        )
        ProductionOrder.objects.create(
            order_note=self.order_note,
            product_design=self.product,
            quantity=150,
            op_type='Indumentaria',
            size='L',
            color='Green',
            tenant=self.tenant
        )
        
        url = reverse('productionorder-list')
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_production_order_detail(self):
        """
        Ensure we can retrieve a single production order.
        """
        production_order = ProductionOrder.objects.create(
            order_note=self.order_note,
            product_design=self.product,
            quantity=200,
            op_type='Indumentaria',
            size='XL',
            color='Black',
            tenant=self.tenant
        )
        url = reverse('productionorder-detail', kwargs={'pk': production_order.pk})
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['quantity'], 200)

    def test_update_production_order(self):
        """
        Ensure we can update a production order.
        """
        production_order = ProductionOrder.objects.create(
            order_note=self.order_note,
            product_design=self.product,
            quantity=300,
            op_type='Indumentaria',
            size='M',
            color='White',
            tenant=self.tenant
        )
        url = reverse('productionorder-detail', kwargs={'pk': production_order.pk})
        data = {
            'order_note': self.order_note.id,
            'product_design': self.product.id,
            'quantity': 350,
            'op_type': 'Medias',
            'size': 'L',
            'color': 'Yellow',
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        production_order.refresh_from_db()
        self.assertEqual(production_order.quantity, 350)
        self.assertEqual(production_order.op_type, 'Medias')

    def test_delete_production_order(self):
        """
        Ensure we can delete a production order.
        """
        production_order = ProductionOrder.objects.create(
            order_note=self.order_note,
            product_design=self.product,
            quantity=400,
            op_type='Indumentaria',
            size='S',
            color='Purple',
            tenant=self.tenant
        )
        url = reverse('productionorder-detail', kwargs={'pk': production_order.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(ProductionOrder.objects.count(), 0)

class RawMaterialAPITests(APITestCase):
    def setUp(self):
        """
        Set up a tenant for all tests.
        """
        self.tenant = Tenant.objects.create(name='Test Tenant')

    def test_create_raw_material(self):
        """
        Ensure we can create a new raw material.
        """
        url = reverse('rawmaterial-list')
        data = {
            'name': 'Fabric',
            'batch_number': 'BATCH001',
            'current_stock': '100.50',
            'unit_of_measure': 'meters',
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(RawMaterial.objects.count(), 1)
        self.assertEqual(RawMaterial.objects.get().name, 'Fabric')

    def test_list_raw_materials(self):
        """
        Ensure we can list raw materials for a tenant.
        """
        RawMaterial.objects.create(name='Fabric', batch_number='B001', current_stock=100, tenant=self.tenant)
        RawMaterial.objects.create(name='Thread', batch_number='B002', current_stock=500, tenant=self.tenant)
        
        url = reverse('rawmaterial-list')
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_raw_material_detail(self):
        """
        Ensure we can retrieve a single raw material.
        """
        raw_material = RawMaterial.objects.create(name='Buttons', batch_number='B003', current_stock=1000, tenant=self.tenant)
        url = reverse('rawmaterial-detail', kwargs={'pk': raw_material.pk})
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Buttons')

    def test_update_raw_material(self):
        """
        Ensure we can update a raw material.
        """
        raw_material = RawMaterial.objects.create(name='Zippers', batch_number='B004', current_stock=200, tenant=self.tenant)
        url = reverse('rawmaterial-detail', kwargs={'pk': raw_material.pk})
        data = {
            'name': 'Updated Zippers',
            'batch_number': 'B004-MODIFIED',
            'current_stock': '250.00',
            'unit_of_measure': 'units',
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        raw_material.refresh_from_db()
        self.assertEqual(raw_material.name, 'Updated Zippers')

    def test_delete_raw_material(self):
        """
        Ensure we can delete a raw material.
        """
        raw_material = RawMaterial.objects.create(name='Elastic', batch_number='B005', current_stock=50, tenant=self.tenant)
        url = reverse('rawmaterial-detail', kwargs={'pk': raw_material.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(RawMaterial.objects.count(), 0)

class PurchaseOrderAPITests(APITestCase):
    def setUp(self):
        """
        Set up a tenant and a supplier for all tests.
        """
        self.tenant = Tenant.objects.create(name='Test Tenant')
        self.supplier = Supplier.objects.create(name='Test Supplier', tenant=self.tenant)

    def test_create_purchase_order(self):
        """
        Ensure we can create a new purchase order.
        """
        url = reverse('purchaseorder-list')
        data = {
            'supplier': self.supplier.id,
            'expected_delivery_date': datetime.date.today() + datetime.timedelta(days=15),
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PurchaseOrder.objects.count(), 1)
        self.assertEqual(PurchaseOrder.objects.get().supplier.name, 'Test Supplier')

    def test_list_purchase_orders(self):
        """
        Ensure we can list purchase orders for a tenant.
        """
        PurchaseOrder.objects.create(supplier=self.supplier, expected_delivery_date=datetime.date.today(), tenant=self.tenant)
        PurchaseOrder.objects.create(supplier=self.supplier, expected_delivery_date=datetime.date.today(), tenant=self.tenant)
        
        url = reverse('purchaseorder-list')
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_purchase_order_detail(self):
        """
        Ensure we can retrieve a single purchase order.
        """
        purchase_order = PurchaseOrder.objects.create(supplier=self.supplier, expected_delivery_date=datetime.date.today(), tenant=self.tenant)
        url = reverse('purchaseorder-detail', kwargs={'pk': purchase_order.pk})
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['supplier'], self.supplier.id)

    def test_update_purchase_order(self):
        """
        Ensure we can update a purchase order.
        """
        purchase_order = PurchaseOrder.objects.create(supplier=self.supplier, expected_delivery_date=datetime.date.today(), status='Pendiente', tenant=self.tenant)
        url = reverse('purchaseorder-detail', kwargs={'pk': purchase_order.pk})
        data = {
            'supplier': self.supplier.id,
            'expected_delivery_date': (datetime.date.today() + datetime.timedelta(days=30)).isoformat(),
            'status': 'Recibida',
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        purchase_order.refresh_from_db()
        self.assertEqual(purchase_order.status, 'Recibida')

    def test_delete_purchase_order(self):
        """
        Ensure we can delete a purchase order.
        """
        purchase_order = PurchaseOrder.objects.create(supplier=self.supplier, expected_delivery_date=datetime.date.today(), tenant=self.tenant)
        url = reverse('purchaseorder-detail', kwargs={'pk': purchase_order.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(PurchaseOrder.objects.count(), 0)

class PurchaseOrderItemAPITests(APITestCase):
    def setUp(self):
        """
        Set up a tenant, supplier, purchase order and product for all tests.
        """
        self.tenant = Tenant.objects.create(name='Test Tenant')
        self.supplier = Supplier.objects.create(name='Test Supplier', tenant=self.tenant)
        self.purchase_order = PurchaseOrder.objects.create(
            supplier=self.supplier,
            expected_delivery_date=datetime.date.today(),
            tenant=self.tenant
        )
        self.product = Product.objects.create(name='Test Product', price=100, tenant=self.tenant)

    def test_create_purchase_order_item(self):
        """
        Ensure we can create a new purchase order item.
        """
        url = reverse('purchaseorderitem-list')
        data = {
            'purchase_order': self.purchase_order.id,
            'product': self.product.id,
            'quantity': 10,
            'unit_price': '10.00',
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PurchaseOrderItem.objects.count(), 1)
        self.assertEqual(PurchaseOrderItem.objects.get().quantity, 10)

    def test_list_purchase_order_items(self):
        """
        Ensure we can list purchase order items for a tenant.
        """
        PurchaseOrderItem.objects.create(
            purchase_order=self.purchase_order,
            product=self.product,
            quantity=20,
            unit_price='15.00',
            tenant=self.tenant
        )
        product2 = Product.objects.create(name='Product 2', price=200, tenant=self.tenant)
        PurchaseOrderItem.objects.create(
            purchase_order=self.purchase_order,
            product=product2,
            quantity=30,
            unit_price='25.00',
            tenant=self.tenant
        )
        
        url = reverse('purchaseorderitem-list')
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_purchase_order_item_detail(self):
        """
        Ensure we can retrieve a single purchase order item.
        """
        item = PurchaseOrderItem.objects.create(
            purchase_order=self.purchase_order,
            product=self.product,
            quantity=40,
            unit_price='50.00',
            tenant=self.tenant
        )
        url = reverse('purchaseorderitem-detail', kwargs={'pk': item.pk})
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['quantity'], 40)

    def test_update_purchase_order_item(self):
        """
        Ensure we can update a purchase order item.
        """
        item = PurchaseOrderItem.objects.create(
            purchase_order=self.purchase_order,
            product=self.product,
            quantity=50,
            unit_price='60.00',
            tenant=self.tenant
        )
        url = reverse('purchaseorderitem-detail', kwargs={'pk': item.pk})
        data = {
            'purchase_order': self.purchase_order.id,
            'product': self.product.id,
            'quantity': 60,
            'unit_price': '70.00',
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item.refresh_from_db()
        self.assertEqual(item.quantity, 60)
        self.assertEqual(float(item.unit_price), 70.00)

    def test_delete_purchase_order_item(self):
        """
        Ensure we can delete a purchase order item.
        """
        item = PurchaseOrderItem.objects.create(
            purchase_order=self.purchase_order,
            product=self.product,
            quantity=70,
            unit_price='80.00',
            tenant=self.tenant
        )
        url = reverse('purchaseorderitem-detail', kwargs={'pk': item.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(PurchaseOrderItem.objects.count(), 0)


class InventoryAPITests(APITestCase):
    def setUp(self):
        """
        Set up a tenant, product, and local for all tests.
        """
        self.tenant = Tenant.objects.create(name='Test Tenant')
        self.product = Product.objects.create(name='Test Product', price=100, stock=10, tenant=self.tenant)
        self.local = Local.objects.create(name='Test Local', tenant=self.tenant)

    def test_create_inventory(self):
        """
        Ensure we can create a new inventory record.
        """
        url = reverse('inventory-list')
        data = {
            'product': self.product.id,
            'local': self.local.id,
            'quantity': 50,
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Inventory.objects.count(), 1)
        self.assertEqual(Inventory.objects.get().quantity, 50)

    def test_list_inventory(self):
        """
        Ensure we can list inventory records for a tenant.
        """
        Inventory.objects.create(product=self.product, local=self.local, quantity=100, tenant=self.tenant)
        
        product2 = Product.objects.create(name='Product 2', price=200, stock=20, tenant=self.tenant)
        local2 = Local.objects.create(name='Local 2', tenant=self.tenant)
        Inventory.objects.create(product=product2, local=local2, quantity=200, tenant=self.tenant)
        
        url = reverse('inventory-list')
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_inventory_detail(self):
        """
        Ensure we can retrieve a single inventory record.
        """
        inventory = Inventory.objects.create(product=self.product, local=self.local, quantity=150, tenant=self.tenant)
        url = reverse('inventory-detail', kwargs={'pk': inventory.pk})
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['quantity'], 150)

    def test_update_inventory(self):
        """
        Ensure we can update an inventory record.
        """
        inventory = Inventory.objects.create(product=self.product, local=self.local, quantity=25, tenant=self.tenant)
        url = reverse('inventory-detail', kwargs={'pk': inventory.pk})
        data = {
            'product': self.product.id,
            'local': self.local.id,
            'quantity': 75,
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        inventory.refresh_from_db()
        self.assertEqual(inventory.quantity, 75)

    def test_delete_inventory(self):
        """
        Ensure we can delete an inventory record.
        """
        inventory = Inventory.objects.create(product=self.product, local=self.local, quantity=5, tenant=self.tenant)
        url = reverse('inventory-detail', kwargs={'pk': inventory.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Inventory.objects.count(), 0)

class CuttingOrderAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant')
        self.raw_material = RawMaterial.objects.create(
            name='Fabric A',
            batch_number='FAB001',
            current_stock=1000,
            unit_of_measure='meters',
            tenant=self.tenant
        )
        self.product_design = Product.objects.create(
            name='Shirt Design',
            price=50,
            stock=100,
            tenant=self.tenant
        )
        self.order_note = OrderNote.objects.create(
            client_name='Client X',
            estimated_delivery_date=datetime.date.today() + datetime.timedelta(days=7),
            tenant=self.tenant
        )
        self.production_order = ProductionOrder.objects.create(
            order_note=self.order_note,
            product_design=self.product_design,
            quantity=50,
            op_type='Indumentaria',
            size='M',
            color='Blue',
            tenant=self.tenant
        )

    def test_create_cutting_order(self):
        url = reverse('cuttingorder-list')
        data = {
            'fabric_used': self.raw_material.id,
            'quantity_cut': 200,
            'production_orders': [self.production_order.id],
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CuttingOrder.objects.count(), 1)
        self.assertEqual(CuttingOrder.objects.get().quantity_cut, 200)
        self.assertIn(self.production_order, CuttingOrder.objects.get().production_orders.all())

    def test_list_cutting_orders(self):
        CuttingOrder.objects.create(
            fabric_used=self.raw_material,
            quantity_cut=100,
            tenant=self.tenant
        ).production_orders.add(self.production_order)
        
        url = reverse('cuttingorder-list')
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1) # Only one cutting order created in setup

    def test_get_cutting_order_detail(self):
        cutting_order = CuttingOrder.objects.create(
            fabric_used=self.raw_material,
            quantity_cut=300,
            tenant=self.tenant
        )
        cutting_order.production_orders.add(self.production_order)
        url = reverse('cuttingorder-detail', kwargs={'pk': cutting_order.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['quantity_cut'], 300)
        self.assertIn(self.production_order.id, response.data['production_orders'])

    def test_update_cutting_order(self):
        cutting_order = CuttingOrder.objects.create(
            fabric_used=self.raw_material,
            quantity_cut=400,
            tenant=self.tenant
        )
        cutting_order.production_orders.add(self.production_order)

        # Create another production order for updating
        production_order_2 = ProductionOrder.objects.create(
            order_note=self.order_note,
            product_design=self.product_design,
            quantity=70,
            op_type='Medias',
            size='L',
            color='Green',
            tenant=self.tenant
        )

        url = reverse('cuttingorder-detail', kwargs={'pk': cutting_order.pk})
        data = {
            'fabric_used': self.raw_material.id,
            'quantity_cut': 450,
            'production_orders': [production_order_2.id], # Update to new production order
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        cutting_order.refresh_from_db()
        self.assertEqual(cutting_order.quantity_cut, 450)
        self.assertIn(production_order_2, cutting_order.production_orders.all())
        self.assertNotIn(self.production_order, cutting_order.production_orders.all()) # Original should be removed

    def test_delete_cutting_order(self):
        cutting_order = CuttingOrder.objects.create(
            fabric_used=self.raw_material,
            quantity_cut=50,
            tenant=self.tenant
        )
        cutting_order.production_orders.add(self.production_order)
        url = reverse('cuttingorder-detail', kwargs={'pk': cutting_order.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(CuttingOrder.objects.count(), 0)

class ProductionProcessLogAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant')
        self.product = Product.objects.create(
            name='Test Product',
            price=100,
            stock=10,
            tenant=self.tenant
        )
        self.order_note = OrderNote.objects.create(
            client_name='Test Client',
            estimated_delivery_date=datetime.date.today(),
            tenant=self.tenant
        )
        self.production_order = ProductionOrder.objects.create(
            order_note=self.order_note,
            product_design=self.product,
            quantity=100,
            op_type='Indumentaria',
            size='M',
            color='Blue',
            tenant=self.tenant
        )
        self.process = Process.objects.create(
            name='Cutting',
            description='Cutting process',
            tenant=self.tenant
        )
        self.raw_material = RawMaterial.objects.create(
            name='Fabric',
            batch_number='BATCH001',
            current_stock=100.50,
            unit_of_measure='meters',
            tenant=self.tenant
        )

    def test_create_production_process_log(self):
        url = reverse('productionprocesslog-list')
        data = {
            'production_order': self.production_order.id,
            'process': self.process.id,
            'quantity_processed': 50,
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ProductionProcessLog.objects.count(), 1)
        self.assertEqual(ProductionProcessLog.objects.get().quantity_processed, 50)

    def test_list_production_process_logs(self):
        ProductionProcessLog.objects.create(
            production_order=self.production_order,
            process=self.process,
            quantity_processed=20,
            tenant=self.tenant
        )
        url = reverse('productionprocesslog-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_get_production_process_log_detail(self):
        log = ProductionProcessLog.objects.create(
            production_order=self.production_order,
            process=self.process,
            quantity_processed=30,
            tenant=self.tenant
        )
        url = reverse('productionprocesslog-detail', kwargs={'pk': log.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['quantity_processed'], 30)

    def test_update_production_process_log(self):
        log = ProductionProcessLog.objects.create(
            production_order=self.production_order,
            process=self.process,
            quantity_processed=40,
            tenant=self.tenant
        )
        url = reverse('productionprocesslog-detail', kwargs={'pk': log.pk})
        data = {
            'production_order': self.production_order.id,
            'process': self.process.id,
            'quantity_processed': 60,
            'quantity_defective': 5,
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        log.refresh_from_db()
        self.assertEqual(log.quantity_processed, 60)
        self.assertEqual(log.quantity_defective, 5)

    def test_delete_production_process_log(self):
        log = ProductionProcessLog.objects.create(
            production_order=self.production_order,
            process=self.process,
            quantity_processed=10,
            tenant=self.tenant
        )
        url = reverse('productionprocesslog-detail', kwargs={'pk': log.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(ProductionProcessLog.objects.count(), 0)

class TenantAPITests(APITestCase):
    def setUp(self):
        # No need to create a tenant here, as Tenant is the model being tested
        pass

    def test_create_tenant(self):
        url = reverse('tenant-list')
        data = {'name': 'New Tenant', 'description': 'A new test tenant'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Tenant.objects.count(), 1)
        self.assertEqual(Tenant.objects.get().name, 'New Tenant')

    def test_list_tenants(self):
        Tenant.objects.create(name='Tenant 1', description='Desc 1')
        Tenant.objects.create(name='Tenant 2', description='Desc 2')
        url = reverse('tenant-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_tenant_detail(self):
        tenant = Tenant.objects.create(name='Detail Tenant', description='Detail Desc')
        url = reverse('tenant-detail', kwargs={'pk': tenant.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Detail Tenant')

    def test_update_tenant(self):
        tenant = Tenant.objects.create(name='Old Tenant', description='Old Desc')
        url = reverse('tenant-detail', kwargs={'pk': tenant.pk})
        data = {'name': 'Updated Tenant', 'description': 'Updated Desc'}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        tenant.refresh_from_db()
        self.assertEqual(tenant.name, 'Updated Tenant')

    def test_delete_tenant(self):
        tenant = Tenant.objects.create(name='Delete Tenant', description='Delete Desc')
        url = reverse('tenant-detail', kwargs={'pk': tenant.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Tenant.objects.count(), 0)

class AccountAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant')

    def test_create_account(self):
        url = reverse('account-list')
        data = {
            'name': 'Cash Account',
            'account_type': 'Activo',
            'code': '1001',
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Account.objects.count(), 1)
        self.assertEqual(Account.objects.get().name, 'Cash Account')

    def test_list_accounts(self):
        Account.objects.create(name='Bank Account', account_type='Activo', code='1002', tenant=self.tenant)
        Account.objects.create(name='Revenue Account', account_type='Ingreso', code='4001', tenant=self.tenant)
        url = reverse('account-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_account_detail(self):
        account = Account.objects.create(name='Expense Account', account_type='Egreso', code='5001', tenant=self.tenant)
        url = reverse('account-detail', kwargs={'pk': account.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Expense Account')

    def test_update_account(self):
        account = Account.objects.create(name='Old Account', account_type='Activo', code='1003', tenant=self.tenant)
        url = reverse('account-detail', kwargs={'pk': account.pk})
        data = {
            'name': 'Updated Account',
            'account_type': 'Pasivo',
            'code': '2001',
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        account.refresh_from_db()
        self.assertEqual(account.name, 'Updated Account')
        self.assertEqual(account.account_type, 'Pasivo')

    def test_delete_account(self):
        account = Account.objects.create(name='Delete Account', account_type='Activo', code='1004', tenant=self.tenant)
        url = reverse('account-detail', kwargs={'pk': account.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Account.objects.count(), 0)

class CashRegisterAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant')
        self.local = Local.objects.create(name='Test Local', tenant=self.tenant)

    def test_create_cash_register(self):
        url = reverse('cashregister-list')
        data = {
            'name': 'Main Cash Register',
            'local': self.local.id,
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CashRegister.objects.count(), 1)
        self.assertEqual(CashRegister.objects.get().name, 'Main Cash Register')

    def test_list_cash_registers(self):
        CashRegister.objects.create(name='Cash Register 1', local=self.local, tenant=self.tenant)
        CashRegister.objects.create(name='Cash Register 2', local=self.local, tenant=self.tenant)
        url = reverse('cashregister-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_cash_register_detail(self):
        cash_register = CashRegister.objects.create(name='Detail Cash Register', local=self.local, tenant=self.tenant)
        url = reverse('cashregister-detail', kwargs={'pk': cash_register.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Detail Cash Register')

    def test_update_cash_register(self):
        cash_register = CashRegister.objects.create(name='Old Cash Register', local=self.local, tenant=self.tenant)
        url = reverse('cashregister-detail', kwargs={'pk': cash_register.pk})
        data = {
            'name': 'Updated Cash Register',
            'local': self.local.id,
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        cash_register.refresh_from_db()
        self.assertEqual(cash_register.name, 'Updated Cash Register')

    def test_delete_cash_register(self):
        cash_register = CashRegister.objects.create(name='Delete Cash Register', local=self.local, tenant=self.tenant)
        url = reverse('cashregister-detail', kwargs={'pk': cash_register.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(CashRegister.objects.count(), 0)

class TransactionAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant')
        self.account = Account.objects.create(name='Test Account', account_type='Activo', code='1000', tenant=self.tenant)
        self.local = Local.objects.create(name='Test Local', tenant=self.tenant)
        self.cash_register = CashRegister.objects.create(name='Test Cash Register', local=self.local, tenant=self.tenant)
        self.supplier = Supplier.objects.create(name='Test Supplier', tenant=self.tenant)
        self.product = Product.objects.create(name='Test Product', price=100, stock=10, tenant=self.tenant)
        self.purchase_order = PurchaseOrder.objects.create(supplier=self.supplier, expected_delivery_date=datetime.date.today(), tenant=self.tenant)
        self.sale = Sale.objects.create(total_amount=100, local=self.local, tenant=self.tenant)

    def test_create_transaction(self):
        url = reverse('transaction-list')
        data = {
            'description': 'Test Transaction',
            'amount': '100.00',
            'account': self.account.id,
            'transaction_type': 'Debito',
            'local': self.local.id,
            'cash_register': self.cash_register.id,
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Transaction.objects.count(), 1)
        self.assertEqual(Transaction.objects.get().description, 'Test Transaction')

    def test_list_transactions(self):
        Transaction.objects.create(description='Trans 1', amount=50, account=self.account, transaction_type='Credito', tenant=self.tenant)
        Transaction.objects.create(description='Trans 2', amount=75, account=self.account, transaction_type='Debito', tenant=self.tenant)
        url = reverse('transaction-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_transaction_detail(self):
        transaction = Transaction.objects.create(description='Detail Trans', amount=120, account=self.account, transaction_type='Debito', tenant=self.tenant)
        url = reverse('transaction-detail', kwargs={'pk': transaction.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['description'], 'Detail Trans')

    def test_update_transaction(self):
        transaction = Transaction.objects.create(description='Old Trans', amount=200, account=self.account, transaction_type='Credito', tenant=self.tenant)
        url = reverse('transaction-detail', kwargs={'pk': transaction.pk})
        data = {
            'description': 'Updated Trans',
            'amount': '250.00',
            'account': self.account.id,
            'transaction_type': 'Debito',
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        transaction.refresh_from_db()
        self.assertEqual(transaction.description, 'Updated Trans')
        self.assertEqual(transaction.amount, 250.00)

    def test_delete_transaction(self):
        transaction = Transaction.objects.create(description='Delete Trans', amount=300, account=self.account, transaction_type='Debito', tenant=self.tenant)
        url = reverse('transaction-detail', kwargs={'pk': transaction.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Transaction.objects.count(), 0)

class InvoiceAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant')
        self.client_obj = Client.objects.create(name='Test Client', tenant=self.tenant)
        self.local = Local.objects.create(name='Test Local', tenant=self.tenant)
        self.supplier = Supplier.objects.create(name='Test Supplier', tenant=self.tenant)
        self.product = Product.objects.create(name='Test Product', price=100, stock=10, tenant=self.tenant)
        self.purchase_order = PurchaseOrder.objects.create(supplier=self.supplier, expected_delivery_date=datetime.date.today(), tenant=self.tenant)
        self.sale = Sale.objects.create(total_amount=100, local=self.local, tenant=self.tenant)

    def test_create_invoice(self):
        url = reverse('invoice-list')
        data = {
            'client': self.client_obj.id,
            'date': datetime.date.today().isoformat(),
            'total_amount': '150.00',
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Invoice.objects.count(), 1)
        self.assertEqual(Invoice.objects.get().total_amount, 150.00)

    def test_list_invoices(self):
        Invoice.objects.create(client=self.client_obj, date=datetime.date.today(), total_amount=200, tenant=self.tenant)
        Invoice.objects.create(client=self.client_obj, date=datetime.date.today(), total_amount=300, tenant=self.tenant)
        url = reverse('invoice-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_invoice_detail(self):
        invoice = Invoice.objects.create(client=self.client_obj, date=datetime.date.today(), total_amount=400, tenant=self.tenant)
        url = reverse('invoice-detail', kwargs={'pk': invoice.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_amount'], '400.00')

    def test_update_invoice(self):
        invoice = Invoice.objects.create(client=self.client_obj, date=datetime.date.today(), total_amount=500, tenant=self.tenant)
        url = reverse('invoice-detail', kwargs={'pk': invoice.pk})
        data = {
            'client': self.client_obj.id,
            'date': datetime.date.today().isoformat(),
            'total_amount': '550.00',
            'status': 'Pagada',
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        invoice.refresh_from_db()
        self.assertEqual(invoice.total_amount, 550.00)
        self.assertEqual(invoice.status, 'Pagada')

    def test_delete_invoice(self):
        invoice = Invoice.objects.create(client=self.client_obj, date=datetime.date.today(), total_amount=600, tenant=self.tenant)
        url = reverse('invoice-detail', kwargs={'pk': invoice.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Invoice.objects.count(), 0)

class PaymentAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant')
        self.client_obj = Client.objects.create(name='Test Client', tenant=self.tenant)
        self.invoice = Invoice.objects.create(client=self.client_obj, date=datetime.date.today(), total_amount=100, tenant=self.tenant)

    def test_create_payment(self):
        url = reverse('payment-list')
        data = {
            'invoice': self.invoice.id,
            'date': datetime.date.today().isoformat(),
            'amount': '50.00',
            'payment_method': 'Cash',
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Payment.objects.count(), 1)
        self.assertEqual(Payment.objects.get().amount, 50.00)

    def test_list_payments(self):
        Payment.objects.create(invoice=self.invoice, date=datetime.date.today(), amount=20, payment_method='Card', tenant=self.tenant)
        Payment.objects.create(invoice=self.invoice, date=datetime.date.today(), amount=30, payment_method='Transfer', tenant=self.tenant)
        url = reverse('payment-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_payment_detail(self):
        payment = Payment.objects.create(invoice=self.invoice, date=datetime.date.today(), amount=40, payment_method='Cash', tenant=self.tenant)
        url = reverse('payment-detail', kwargs={'pk': payment.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['amount'], '40.00')

    def test_update_payment(self):
        payment = Payment.objects.create(invoice=self.invoice, date=datetime.date.today(), amount=60, payment_method='Cash', tenant=self.tenant)
        url = reverse('payment-detail', kwargs={'pk': payment.pk})
        data = {
            'invoice': self.invoice.id,
            'date': datetime.date.today().isoformat(),
            'amount': '70.00',
            'payment_method': 'Card',
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payment.refresh_from_db()
        self.assertEqual(payment.amount, 70.00)
        self.assertEqual(payment.payment_method, 'Card')

    def test_delete_payment(self):
        payment = Payment.objects.create(invoice=self.invoice, date=datetime.date.today(), amount=80, payment_method='Cash', tenant=self.tenant)
        url = reverse('payment-detail', kwargs={'pk': payment.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Payment.objects.count(), 0)

class BankAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant')

    def test_create_bank(self):
        url = reverse('bank-list')
        data = {'name': 'Test Bank', 'tenant': self.tenant.id}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Bank.objects.count(), 1)
        self.assertEqual(Bank.objects.get().name, 'Test Bank')

    def test_list_banks(self):
        Bank.objects.create(name='Bank A', tenant=self.tenant)
        Bank.objects.create(name='Bank B', tenant=self.tenant)
        url = reverse('bank-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_bank_detail(self):
        bank = Bank.objects.create(name='Detail Bank', tenant=self.tenant)
        url = reverse('bank-detail', kwargs={'pk': bank.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Detail Bank')

    def test_update_bank(self):
        bank = Bank.objects.create(name='Old Bank', tenant=self.tenant)
        url = reverse('bank-detail', kwargs={'pk': bank.pk})
        data = {'name': 'Updated Bank', 'tenant': self.tenant.id}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        bank.refresh_from_db()
        self.assertEqual(bank.name, 'Updated Bank')

    def test_delete_bank(self):
        bank = Bank.objects.create(name='Delete Bank', tenant=self.tenant)
        url = reverse('bank-detail', kwargs={'pk': bank.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Bank.objects.count(), 0)

class BankStatementAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant')
        self.bank = Bank.objects.create(name='Test Bank', tenant=self.tenant)

    def test_create_bank_statement(self):
        url = reverse('bankstatement-list')
        from django.core.files.uploadedfile import SimpleUploadedFile

        # Create a dummy file for testing
        dummy_file = SimpleUploadedFile("test_file.pdf", b"file_content", content_type="application/pdf")

        data = {
            'bank': self.bank.id,
            'statement_date': datetime.date.today().isoformat(),
            'file': dummy_file,
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(BankStatement.objects.count(), 1)
        self.assertEqual(BankStatement.objects.get().bank, self.bank)

    def test_list_bank_statements(self):
        BankStatement.objects.create(bank=self.bank, statement_date=datetime.date.today(), file='file1.pdf', tenant=self.tenant)
        BankStatement.objects.create(bank=self.bank, statement_date=datetime.date.today(), file='file2.pdf', tenant=self.tenant)
        url = reverse('bankstatement-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_bank_statement_detail(self):
        bank_statement = BankStatement.objects.create(bank=self.bank, statement_date=datetime.date.today(), file='file3.pdf', tenant=self.tenant)
        url = reverse('bankstatement-detail', kwargs={'pk': bank_statement.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['bank'], self.bank.id)

    def test_update_bank_statement(self):
        bank_statement = BankStatement.objects.create(bank=self.bank, statement_date=datetime.date.today(), file='file4.pdf', tenant=self.tenant)
        url = reverse('bankstatement-detail', kwargs={'pk': bank_statement.pk})
        # Create another dummy file for updating
        updated_dummy_file = SimpleUploadedFile("updated_file.pdf", b"updated_content", content_type="application/pdf")

        data = {
            'bank': self.bank.id,
            'statement_date': (datetime.date.today() - datetime.timedelta(days=1)).isoformat(),
            'file': updated_dummy_file,
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        bank_statement.refresh_from_db()
        self.assertTrue(os.path.basename(bank_statement.file.name).startswith('updated_file'))
        self.assertTrue(os.path.basename(bank_statement.file.name).endswith('.pdf'))

    def test_delete_bank_statement(self):
        bank_statement = BankStatement.objects.create(bank=self.bank, statement_date=datetime.date.today(), file='file5.pdf', tenant=self.tenant)
        url = reverse('bankstatement-detail', kwargs={'pk': bank_statement.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(BankStatement.objects.count(), 0)

class BankTransactionAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant')
        self.bank = Bank.objects.create(name='Test Bank', tenant=self.tenant)
        self.bank_statement = BankStatement.objects.create(bank=self.bank, statement_date=datetime.date.today(), file='test_statement.pdf', tenant=self.tenant)

    def test_create_bank_transaction(self):
        url = reverse('banktransaction-list')
        data = {
            'bank_statement': self.bank_statement.id,
            'date': datetime.date.today().isoformat(),
            'description': 'Test Transaction',
            'amount': '100.00',
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(BankTransaction.objects.count(), 1)
        self.assertEqual(BankTransaction.objects.get().description, 'Test Transaction')

    def test_list_bank_transactions(self):
        BankTransaction.objects.create(bank_statement=self.bank_statement, date=datetime.date.today(), description='Trans 1', amount=50, tenant=self.tenant)
        BankTransaction.objects.create(bank_statement=self.bank_statement, date=datetime.date.today(), description='Trans 2', amount=75, tenant=self.tenant)
        url = reverse('banktransaction-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_bank_transaction_detail(self):
        bank_transaction = BankTransaction.objects.create(bank_statement=self.bank_statement, date=datetime.date.today(), description='Detail Trans', amount=120, tenant=self.tenant)
        url = reverse('banktransaction-detail', kwargs={'pk': bank_transaction.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['description'], 'Detail Trans')

    def test_update_bank_transaction(self):
        bank_transaction = BankTransaction.objects.create(bank_statement=self.bank_statement, date=datetime.date.today(), description='Old Trans', amount=200, tenant=self.tenant)
        url = reverse('banktransaction-detail', kwargs={'pk': bank_transaction.pk})
        data = {
            'bank_statement': self.bank_statement.id,
            'date': datetime.date.today().isoformat(),
            'description': 'Updated Trans',
            'amount': '250.00',
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        bank_transaction.refresh_from_db()
        self.assertEqual(bank_transaction.description, 'Updated Trans')
        self.assertEqual(bank_transaction.amount, 250.00)

    def test_delete_bank_transaction(self):
        bank_transaction = BankTransaction.objects.create(bank_statement=self.bank_statement, date=datetime.date.today(), description='Delete Trans', amount=300, tenant=self.tenant)
        url = reverse('banktransaction-detail', kwargs={'pk': bank_transaction.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(BankTransaction.objects.count(), 0)

class FactoryAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant')

    def test_create_factory(self):
        url = reverse('factory-list')
        data = {
            'name': 'Test Factory',
            'location': 'Test Location',
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Factory.objects.count(), 1)
        self.assertEqual(Factory.objects.get().name, 'Test Factory')

    def test_list_factories(self):
        Factory.objects.create(name='Factory A', location='Location A', tenant=self.tenant)
        Factory.objects.create(name='Factory B', location='Location B', tenant=self.tenant)
        url = reverse('factory-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_factory_detail(self):
        factory = Factory.objects.create(name='Detail Factory', location='Detail Location', tenant=self.tenant)
        url = reverse('factory-detail', kwargs={'pk': factory.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Detail Factory')

    def test_update_factory(self):
        factory = Factory.objects.create(name='Old Factory', location='Old Location', tenant=self.tenant)
        url = reverse('factory-detail', kwargs={'pk': factory.pk})
        data = {
            'name': 'Updated Factory',
            'location': 'Updated Location',
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        factory.refresh_from_db()
        self.assertEqual(factory.name, 'Updated Factory')
        self.assertEqual(factory.location, 'Updated Location')

    def test_delete_factory(self):
        factory = Factory.objects.create(name='Delete Factory', location='Delete Location', tenant=self.tenant)
        url = reverse('factory-detail', kwargs={'pk': factory.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Factory.objects.count(), 0)

        self.assertEqual(Factory.objects.count(), 0)

class EmployeeRoleAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant')

    def test_create_employee_role(self):
        url = reverse('employeerole-list')
        data = {
            'name': 'Manager',
            'description': 'Manages operations',
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(EmployeeRole.objects.count(), 1)
        self.assertEqual(EmployeeRole.objects.get().name, 'Manager')

    def test_list_employee_roles(self):
        EmployeeRole.objects.create(name='Supervisor', description='Oversees staff', tenant=self.tenant)
        EmployeeRole.objects.create(name='Worker', description='Performs tasks', tenant=self.tenant)
        url = reverse('employeerole-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_employee_role_detail(self):
        employee_role = EmployeeRole.objects.create(name='Analyst', description='Analyzes data', tenant=self.tenant)
        url = reverse('employeerole-detail', kwargs={'pk': employee_role.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Analyst')

    def test_update_employee_role(self):
        employee_role = EmployeeRole.objects.create(name='Old Role', description='Old description', tenant=self.tenant)
        url = reverse('employeerole-detail', kwargs={'pk': employee_role.pk})
        data = {
            'name': 'Updated Role',
            'description': 'Updated description',
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        employee_role.refresh_from_db()
        self.assertEqual(employee_role.name, 'Updated Role')
        self.assertEqual(employee_role.description, 'Updated description')

    def test_delete_employee_role(self):
        employee_role = EmployeeRole.objects.create(name='Delete Role', description='Delete description', tenant=self.tenant)
        url = reverse('employeerole-detail', kwargs={'pk': employee_role.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(EmployeeRole.objects.count(), 0)

        self.assertEqual(EmployeeRole.objects.count(), 0)

class EmployeeAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant')
        self.employee_role = EmployeeRole.objects.create(name='Test Role', tenant=self.tenant)
        self.user1 = User.objects.create_user(email='user1@example.com', password='password123', first_name='John', last_name='Doe', tenant=self.tenant)
        self.user2 = User.objects.create_user(email='user2@example.com', password='password123', first_name='Jane', last_name='Smith', tenant=self.tenant)
        self.user3 = User.objects.create_user(email='user3@example.com', password='password123', first_name='Alice', last_name='Brown', tenant=self.tenant)
        self.user4 = User.objects.create_user(email='user4@example.com', password='password123', first_name='Bob', last_name='White', tenant=self.tenant)
        self.user5 = User.objects.create_user(email='user5@example.com', password='password123', first_name='Charlie', last_name='Green', tenant=self.tenant)

    def test_create_employee(self):
        url = reverse('employee-list')
        data = {
            'user': self.user1.id,
            'hire_date': datetime.date.today().isoformat(),
            'role': self.employee_role.id,
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Employee.objects.count(), 1)
        self.assertEqual(Employee.objects.get().user.first_name, 'John')

    def test_list_employees(self):
        Employee.objects.create(user=self.user2, hire_date=datetime.date.today(), role=self.employee_role, tenant=self.tenant)
        Employee.objects.create(user=self.user3, hire_date=datetime.date.today(), role=self.employee_role, tenant=self.tenant)
        url = reverse('employee-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_employee_detail(self):
        employee = Employee.objects.create(user=self.user4, hire_date=datetime.date.today(), role=self.employee_role, tenant=self.tenant)
        url = reverse('employee-detail', kwargs={'pk': employee.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user'], self.user4.id)

    def test_update_employee(self):
        employee = Employee.objects.create(user=self.user5, hire_date=datetime.date.today(), role=self.employee_role, tenant=self.tenant)
        url = reverse('employee-detail', kwargs={'pk': employee.pk})
        data = {
            'user': self.user5.id,
            'hire_date': (datetime.date.today() - datetime.timedelta(days=10)).isoformat(),
            'role': self.employee_role.id,
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        employee.refresh_from_db()
        self.assertEqual(employee.user.first_name, 'Charlie') # Still Charlie, as user is not updated here

    def test_delete_employee(self):
        employee = Employee.objects.create(user=self.user1, hire_date=datetime.date.today(), role=self.employee_role, tenant=self.tenant)
        url = reverse('employee-detail', kwargs={'pk': employee.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Employee.objects.count(), 0)

        self.assertEqual(Employee.objects.count(), 0)

class SalaryAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant')
        self.employee_role = EmployeeRole.objects.create(name='Test Role', tenant=self.tenant)
        self.user = User.objects.create_user(email='testuser@example.com', password='password123', tenant=self.tenant)
        self.employee = Employee.objects.create(user=self.user, hire_date=datetime.date.today(), role=self.employee_role, tenant=self.tenant)

    def test_create_salary(self):
        url = reverse('salary-list')
        data = {
            'employee': self.employee.id,
            'amount': '1500.00',
            'pay_date': datetime.date.today().isoformat(),
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Salary.objects.count(), 1)
        self.assertEqual(Salary.objects.get().amount, 1500.00)

    def test_list_salaries(self):
        Salary.objects.create(employee=self.employee, amount=1000, pay_date=datetime.date.today(), tenant=self.tenant)
        Salary.objects.create(employee=self.employee, amount=2000, pay_date=datetime.date.today(), tenant=self.tenant)
        url = reverse('salary-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_salary_detail(self):
        salary = Salary.objects.create(employee=self.employee, amount=1200, pay_date=datetime.date.today(), tenant=self.tenant)
        url = reverse('salary-detail', kwargs={'pk': salary.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['amount'], '1200.00')

    def test_update_salary(self):
        salary = Salary.objects.create(employee=self.employee, amount=1800, pay_date=datetime.date.today(), tenant=self.tenant)
        url = reverse('salary-detail', kwargs={'pk': salary.pk})
        data = {
            'employee': self.employee.id,
            'amount': '1900.00',
            'pay_date': (datetime.date.today() - datetime.timedelta(days=30)).isoformat(),
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        salary.refresh_from_db()
        self.assertEqual(salary.amount, 1900.00)

    def test_delete_salary(self):
        salary = Salary.objects.create(employee=self.employee, amount=1100, pay_date=datetime.date.today(), tenant=self.tenant)
        url = reverse('salary-detail', kwargs={'pk': salary.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Salary.objects.count(), 0)

        self.assertEqual(Salary.objects.count(), 0)

class VacationAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant')
        self.employee_role = EmployeeRole.objects.create(name='Test Role', tenant=self.tenant)
        self.user = User.objects.create_user(email='testuser@example.com', password='password123', tenant=self.tenant)
        self.employee = Employee.objects.create(user=self.user, hire_date=datetime.date.today(), role=self.employee_role, tenant=self.tenant)

    def test_create_vacation(self):
        url = reverse('vacation-list')
        data = {
            'employee': self.employee.id,
            'start_date': datetime.date.today().isoformat(),
            'end_date': (datetime.date.today() + datetime.timedelta(days=7)).isoformat(),
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Vacation.objects.count(), 1)
        self.assertEqual(Vacation.objects.get().employee, self.employee)

    def test_list_vacations(self):
        Vacation.objects.create(employee=self.employee, start_date=datetime.date.today(), end_date=(datetime.date.today() + datetime.timedelta(days=5)), tenant=self.tenant)
        Vacation.objects.create(employee=self.employee, start_date=(datetime.date.today() + datetime.timedelta(days=10)), end_date=(datetime.date.today() + datetime.timedelta(days=15)), tenant=self.tenant)
        url = reverse('vacation-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_vacation_detail(self):
        vacation = Vacation.objects.create(employee=self.employee, start_date=datetime.date.today(), end_date=(datetime.date.today() + datetime.timedelta(days=3)), tenant=self.tenant)
        url = reverse('vacation-detail', kwargs={'pk': vacation.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['employee'], self.employee.id)

    def test_update_vacation(self):
        vacation = Vacation.objects.create(employee=self.employee, start_date=datetime.date.today(), end_date=(datetime.date.today() + datetime.timedelta(days=10)), tenant=self.tenant)
        url = reverse('vacation-detail', kwargs={'pk': vacation.pk})
        data = {
            'employee': self.employee.id,
            'start_date': (datetime.date.today() + datetime.timedelta(days=1)).isoformat(),
            'end_date': (datetime.date.today() + datetime.timedelta(days=14)).isoformat(),
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        vacation.refresh_from_db()
        self.assertEqual(vacation.start_date, datetime.date.today() + datetime.timedelta(days=1))
        self.assertEqual(vacation.end_date, datetime.date.today() + datetime.timedelta(days=14))

    def test_delete_vacation(self):
        vacation = Vacation.objects.create(employee=self.employee, start_date=datetime.date.today(), end_date=(datetime.date.today() + datetime.timedelta(days=2)), tenant=self.tenant)
        url = reverse('vacation-detail', kwargs={'pk': vacation.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Vacation.objects.count(), 0)

        self.assertEqual(Vacation.objects.count(), 0)

class PermitAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant')
        self.employee_role = EmployeeRole.objects.create(name='Test Role', tenant=self.tenant)
        self.user = User.objects.create_user(email='testuser@example.com', password='password123', tenant=self.tenant)
        self.employee = Employee.objects.create(user=self.user, hire_date=datetime.date.today(), role=self.employee_role, tenant=self.tenant)

    def test_create_permit(self):
        url = reverse('permit-list')
        data = {
            'employee': self.employee.id,
            'start_date': datetime.date.today().isoformat(),
            'end_date': (datetime.date.today() + datetime.timedelta(days=1)).isoformat(),
            'reason': 'Medical Appointment',
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Permit.objects.count(), 1)
        self.assertEqual(Permit.objects.get().reason, 'Medical Appointment')

    def test_list_permits(self):
        Permit.objects.create(employee=self.employee, start_date=datetime.date.today(), end_date=(datetime.date.today() + datetime.timedelta(days=1)), reason='Personal', tenant=self.tenant)
        Permit.objects.create(employee=self.employee, start_date=(datetime.date.today() + datetime.timedelta(days=2)), end_date=(datetime.date.today() + datetime.timedelta(days=3)), reason='Family Emergency', tenant=self.tenant)
        url = reverse('permit-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_permit_detail(self):
        permit = Permit.objects.create(employee=self.employee, start_date=datetime.date.today(), end_date=(datetime.date.today() + datetime.timedelta(days=1)), reason='Dental Appointment', tenant=self.tenant)
        url = reverse('permit-detail', kwargs={'pk': permit.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['reason'], 'Dental Appointment')

    def test_update_permit(self):
        permit = Permit.objects.create(employee=self.employee, start_date=datetime.date.today(), end_date=(datetime.date.today() + datetime.timedelta(days=1)), reason='Original Reason', tenant=self.tenant)
        url = reverse('permit-detail', kwargs={'pk': permit.pk})
        data = {
            'employee': self.employee.id,
            'start_date': (datetime.date.today() - datetime.timedelta(days=1)).isoformat(),
            'end_date': datetime.date.today().isoformat(),
            'reason': 'Updated Reason',
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        permit.refresh_from_db()
        self.assertEqual(permit.reason, 'Updated Reason')

    def test_delete_permit(self):
        permit = Permit.objects.create(employee=self.employee, start_date=datetime.date.today(), end_date=(datetime.date.today() + datetime.timedelta(days=1)), reason='To Be Deleted', tenant=self.tenant)
        url = reverse('permit-detail', kwargs={'pk': permit.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Permit.objects.count(), 0)

        self.assertEqual(Permit.objects.count(), 0)

class MedicalRecordAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant')
        self.employee_role = EmployeeRole.objects.create(name='Test Role', tenant=self.tenant)
        self.user = User.objects.create_user(email='testuser@example.com', password='password123', tenant=self.tenant)
        self.employee = Employee.objects.create(user=self.user, hire_date=datetime.date.today(), role=self.employee_role, tenant=self.tenant)

    def test_create_medical_record(self):
        url = reverse('medicalrecord-list')
        data = {
            'employee': self.employee.id,
            'record_date': datetime.date.today().isoformat(),
            'description': 'Annual check-up',
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(MedicalRecord.objects.count(), 1)
        self.assertEqual(MedicalRecord.objects.get().description, 'Annual check-up')

    def test_list_medical_records(self):
        MedicalRecord.objects.create(employee=self.employee, record_date=datetime.date.today(), description='Vaccination', tenant=self.tenant)
        MedicalRecord.objects.create(employee=self.employee, record_date=datetime.date.today(), description='Injury Report', tenant=self.tenant)
        url = reverse('medicalrecord-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_medical_record_detail(self):
        medical_record = MedicalRecord.objects.create(employee=self.employee, record_date=datetime.date.today(), description='Physical Exam', tenant=self.tenant)
        url = reverse('medicalrecord-detail', kwargs={'pk': medical_record.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['description'], 'Physical Exam')

    def test_update_medical_record(self):
        medical_record = MedicalRecord.objects.create(employee=self.employee, record_date=datetime.date.today(), description='Original Description', tenant=self.tenant)
        url = reverse('medicalrecord-detail', kwargs={'pk': medical_record.pk})
        data = {
            'employee': self.employee.id,
            'record_date': (datetime.date.today() - datetime.timedelta(days=30)).isoformat(),
            'description': 'Updated Description',
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        medical_record.refresh_from_db()
        self.assertEqual(medical_record.description, 'Updated Description')

    def test_delete_medical_record(self):
        medical_record = MedicalRecord.objects.create(employee=self.employee, record_date=datetime.date.today(), description='To Be Deleted', tenant=self.tenant)
        url = reverse('medicalrecord-detail', kwargs={'pk': medical_record.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(MedicalRecord.objects.count(), 0)

        self.assertEqual(MedicalRecord.objects.count(), 0)

class QuotationAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant')
        self.client_obj = Client.objects.create(name='Test Client', tenant=self.tenant)

    def test_create_quotation(self):
        url = reverse('quotation-list')
        data = {
            'client': self.client_obj.id,
            'date': datetime.date.today().isoformat(),
            'total_amount': '100.00',
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Quotation.objects.count(), 1)
        self.assertEqual(Quotation.objects.get().total_amount, 100.00)

    def test_list_quotations(self):
        Quotation.objects.create(client=self.client_obj, date=datetime.date.today(), total_amount=200, tenant=self.tenant)
        Quotation.objects.create(client=self.client_obj, date=datetime.date.today(), total_amount=300, tenant=self.tenant)
        url = reverse('quotation-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_quotation_detail(self):
        quotation = Quotation.objects.create(client=self.client_obj, date=datetime.date.today(), total_amount=400, tenant=self.tenant)
        url = reverse('quotation-detail', kwargs={'pk': quotation.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_amount'], '400.00')

    def test_update_quotation(self):
        quotation = Quotation.objects.create(client=self.client_obj, date=datetime.date.today(), total_amount=500, tenant=self.tenant)
        url = reverse('quotation-detail', kwargs={'pk': quotation.pk})
        data = {
            'client': self.client_obj.id,
            'date': datetime.date.today().isoformat(),
            'total_amount': '550.00',
            'status': 'Aceptada',
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        quotation.refresh_from_db()
        self.assertEqual(quotation.total_amount, 550.00)
        self.assertEqual(quotation.status, 'Aceptada')

    def test_delete_quotation(self):
        quotation = Quotation.objects.create(client=self.client_obj, date=datetime.date.today(), total_amount=600, tenant=self.tenant)
        url = reverse('quotation-detail', kwargs={'pk': quotation.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Quotation.objects.count(), 0)

    def test_convert_quotation_to_sale(self):
        # Create a Design for quotation items
        design = Design.objects.create(name='Test Design', calculated_cost=Decimal('50.00'), tenant=self.tenant)

        # Create a quotation with items
        quotation = Quotation.objects.create(
            client=self.client_obj,
            date=datetime.date.today(),
            total_amount=Decimal('150.00'),
            status='Enviada',
            tenant=self.tenant
        )
        QuotationItem.objects.create(
            quotation=quotation,
            design=design,
            quantity=2,
            unit_price=Decimal('75.00'),
            cost=Decimal('50.00'),
            tenant=self.tenant
        )
        QuotationItem.objects.create(
            quotation=quotation,
            design=design,
            quantity=1,
            unit_price=Decimal('75.00'),
            cost=Decimal('50.00'),
            tenant=self.tenant
        )

        url = reverse('quotation-convert-to-sale', kwargs={'pk': quotation.pk})
        response = self.client.post(url, HTTP_X_TENANT_ID=self.tenant.id)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Sale.objects.count(), 1)

        new_sale = Sale.objects.get(related_quotation=quotation)
        self.assertEqual(new_sale.client, self.client_obj)
        self.assertEqual(new_sale.related_quotation, quotation)
        
        # Verify SaleItems
        sale_items = new_sale.items.all()
        self.assertEqual(len(sale_items), 2)
        
        # Check recalculated prices (assuming MARKUP_PERCENTAGE = 0.20)
        expected_unit_price = Decimal('50.00') * Decimal('1.20') # 50.00 * 1.20 = 60.00
        expected_cost = Decimal('50.00')

        for item in sale_items:
            self.assertEqual(item.design, design)
            self.assertEqual(item.unit_price, expected_unit_price)
            self.assertEqual(item.cost, expected_cost)

        # Verify total amount
        self.assertEqual(new_sale.total_amount, (2 * expected_unit_price) + (1 * expected_unit_price))

        # Verify quotation status
        quotation.refresh_from_db()
        self.assertEqual(quotation.status, 'Aceptada')

        # Test converting an already accepted quotation
        response = self.client.post(url, HTTP_X_TENANT_ID=self.tenant.id)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('La cotización ya ha sido aceptada', response.data['error'])

class QuotationItemAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant')
        self.client_obj = Client.objects.create(name='Test Client', tenant=self.tenant)
        self.quotation = Quotation.objects.create(client=self.client_obj, date=datetime.date.today(), total_amount=100, tenant=self.tenant)
        self.product = Product.objects.create(name='Test Product', price=10, stock=100, tenant=self.tenant)

    def test_create_quotation_item(self):
        url = reverse('quotationitem-list')
        data = {
            'quotation': self.quotation.id,
            'product': self.product.id,
            'quantity': 5,
            'unit_price': '10.00',
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(QuotationItem.objects.count(), 1)
        self.assertEqual(QuotationItem.objects.get().quantity, 5)

    def test_list_quotation_items(self):
        QuotationItem.objects.create(quotation=self.quotation, product=self.product, quantity=10, unit_price=10, tenant=self.tenant)
        QuotationItem.objects.create(quotation=self.quotation, product=self.product, quantity=20, unit_price=10, tenant=self.tenant)
        url = reverse('quotationitem-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_quotation_item_detail(self):
        quotation_item = QuotationItem.objects.create(quotation=self.quotation, product=self.product, quantity=15, unit_price=10, tenant=self.tenant)
        url = reverse('quotationitem-detail', kwargs={'pk': quotation_item.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['quantity'], 15)

    def test_update_quotation_item(self):
        quotation_item = QuotationItem.objects.create(quotation=self.quotation, product=self.product, quantity=25, unit_price=10, tenant=self.tenant)
        url = reverse('quotationitem-detail', kwargs={'pk': quotation_item.pk})
        data = {
            'quotation': self.quotation.id,
            'product': self.product.id,
            'quantity': 30,
            'unit_price': '12.00',
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        quotation_item.refresh_from_db()
        self.assertEqual(quotation_item.quantity, 30)
        self.assertEqual(quotation_item.unit_price, 12.00)

    def test_delete_quotation_item(self):
        quotation_item = QuotationItem.objects.create(quotation=self.quotation, product=self.product, quantity=50, unit_price=10, tenant=self.tenant)
        url = reverse('quotationitem-detail', kwargs={'pk': quotation_item.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(QuotationItem.objects.count(), 0)

        self.assertEqual(QuotationItem.objects.count(), 0)

class SystemRoleAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant')

    def test_create_system_role(self):
        url = reverse('systemrole-list')
        data = {
            'name': 'Admin',
            'description': 'System Administrator',
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(SystemRole.objects.count(), 1)
        self.assertEqual(SystemRole.objects.get().name, 'Admin')

    def test_list_system_roles(self):
        SystemRole.objects.create(name='Editor', description='Content Editor', tenant=self.tenant)
        SystemRole.objects.create(name='Viewer', description='Content Viewer', tenant=self.tenant)
        url = reverse('systemrole-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_system_role_detail(self):
        system_role = SystemRole.objects.create(name='Moderator', description='Forum Moderator', tenant=self.tenant)
        url = reverse('systemrole-detail', kwargs={'pk': system_role.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Moderator')

    def test_update_system_role(self):
        system_role = SystemRole.objects.create(name='Old Role', description='Old Description', tenant=self.tenant)
        url = reverse('systemrole-detail', kwargs={'pk': system_role.pk})
        data = {
            'name': 'Updated Role',
            'description': 'Updated Description',
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        system_role.refresh_from_db()
        self.assertEqual(system_role.name, 'Updated Role')

    def test_delete_system_role(self):
        system_role = SystemRole.objects.create(name='Delete Role', description='Delete Description', tenant=self.tenant)
        url = reverse('systemrole-detail', kwargs={'pk': system_role.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(SystemRole.objects.count(), 0)

        self.assertEqual(SystemRole.objects.count(), 0)

class UserAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant')
        self.system_role = SystemRole.objects.create(name='Test Role', tenant=self.tenant)

    def test_create_user(self):
        url = reverse('user-list')
        data = {
            'email': 'newuser@example.com',
            'password': 'testpassword',
            'first_name': 'New',
            'last_name': 'User',
            'tenant': self.tenant.id,
            'roles': [self.system_role.id]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().email, 'newuser@example.com')

    def test_list_users(self):
        User.objects.create_user(email='user1@example.com', password='pass1', tenant=self.tenant)
        User.objects.create_user(email='user2@example.com', password='pass2', tenant=self.tenant)
        url = reverse('user-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_user_detail(self):
        user = User.objects.create_user(email='detailuser@example.com', password='pass3', tenant=self.tenant)
        url = reverse('user-detail', kwargs={'pk': user.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'detailuser@example.com')

    def test_update_user(self):
        user = User.objects.create_user(email='olduser@example.com', password='oldpass', tenant=self.tenant)
        url = reverse('user-detail', kwargs={'pk': user.pk})
        data = {
            'email': 'updateduser@example.com',
            'first_name': 'Updated',
            'last_name': 'User',
            'tenant': self.tenant.id,
            'roles': [self.system_role.id]
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.email, 'updateduser@example.com')

    def test_delete_user(self):
        user = User.objects.create_user(email='deleteuser@example.com', password='deletepass', tenant=self.tenant)
        url = reverse('user-detail', kwargs={'pk': user.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(User.objects.count(), 0)

class PaymentMethodTypeAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant')

    def test_create_payment_method_type(self):
        url = reverse('paymentmethodtype-list')
        data = {
            'name': 'Credit Card',
            'description': 'Payment via credit card',
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PaymentMethodType.objects.count(), 1)
        self.assertEqual(PaymentMethodType.objects.get().name, 'Credit Card')

    def test_list_payment_method_types(self):
        PaymentMethodType.objects.create(name='Debit Card', description='Payment via debit card', tenant=self.tenant)
        PaymentMethodType.objects.create(name='Cash', description='Payment via cash', tenant=self.tenant)
        url = reverse('paymentmethodtype-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_payment_method_type_detail(self):
        payment_method_type = PaymentMethodType.objects.create(name='Transfer', description='Bank transfer', tenant=self.tenant)
        url = reverse('paymentmethodtype-detail', kwargs={'pk': payment_method_type.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Transfer')

    def test_update_payment_method_type(self):
        payment_method_type = PaymentMethodType.objects.create(name='Old Type', description='Old description', tenant=self.tenant)
        url = reverse('paymentmethodtype-detail', kwargs={'pk': payment_method_type.pk})
        data = {
            'name': 'Updated Type',
            'description': 'Updated description',
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payment_method_type.refresh_from_db()
        self.assertEqual(payment_method_type.name, 'Updated Type')

    def test_delete_payment_method_type(self):
        payment_method_type = PaymentMethodType.objects.create(name='Delete Type', description='Delete description', tenant=self.tenant)
        url = reverse('paymentmethodtype-detail', kwargs={'pk': payment_method_type.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(PaymentMethodType.objects.count(), 0)

class FinancialCostRuleAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant')
        self.payment_method_type = PaymentMethodType.objects.create(name='Credit Card', tenant=self.tenant)

    def test_create_financial_cost_rule(self):
        url = reverse('financialcostrule-list')
        data = {
            'name': 'Credit Card Fee',
            'payment_method': self.payment_method_type.id,
            'percentage': '2.50',
            'tenant': self.tenant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(FinancialCostRule.objects.count(), 1)
        self.assertEqual(FinancialCostRule.objects.get().name, 'Credit Card Fee')

    def test_list_financial_cost_rules(self):
        FinancialCostRule.objects.create(name='Debit Card Fee', payment_method=self.payment_method_type, percentage=1.50, tenant=self.tenant)
        FinancialCostRule.objects.create(name='Transfer Fee', payment_method=self.payment_method_type, percentage=0.50, tenant=self.tenant)
        url = reverse('financialcostrule-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_financial_cost_rule_detail(self):
        financial_cost_rule = FinancialCostRule.objects.create(name='Cash Discount', payment_method=self.payment_method_type, percentage= -5.00, tenant=self.tenant)
        url = reverse('financialcostrule-detail', kwargs={'pk': financial_cost_rule.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Cash Discount')

    def test_update_financial_cost_rule(self):
        financial_cost_rule = FinancialCostRule.objects.create(name='Old Rule', payment_method=self.payment_method_type, percentage=3.00, tenant=self.tenant)
        url = reverse('financialcostrule-detail', kwargs={'pk': financial_cost_rule.pk})
        data = {
            'name': 'Updated Rule',
            'payment_method': self.payment_method_type.id,
            'percentage': '3.50',
            'tenant': self.tenant.id
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        financial_cost_rule.refresh_from_db()
        self.assertEqual(financial_cost_rule.name, 'Updated Rule')
        self.assertEqual(financial_cost_rule.percentage, 3.50)

    def test_delete_financial_cost_rule(self):
        financial_cost_rule = FinancialCostRule.objects.create(name='Delete Rule', payment_method=self.payment_method_type, percentage=1.00, tenant=self.tenant)
        url = reverse('financialcostrule-detail', kwargs={'pk': financial_cost_rule.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(FinancialCostRule.objects.count(), 0)