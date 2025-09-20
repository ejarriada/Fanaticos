from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from core.models import (
    Tenant, User, Client, Design, RawMaterial, Process, Sale, SaleItem, OrderNote, Category, Size
)

class NewSalesFlowTests(APITestCase):
    def setUp(self):
        """Set up the necessary objects for the tests."""
        self.tenant = Tenant.objects.create(name='Test Tenant for Sales Flow')
        self.user = User.objects.create_user(email='salesflow@example.com', password='password123', tenant=self.tenant)
        self.client.force_authenticate(user=self.user)

        # Set up headers for tenant-aware views
        self.client.defaults['HTTP_X_TENANT_ID'] = self.tenant.id

        self.client_obj = Client.objects.create(name='Flow Test Client', tenant=self.tenant)
        self.raw_material = RawMaterial.objects.create(name='Tela Test', batch_number='LOTE-TELA-01', cost=10.50, tenant=self.tenant)
        self.process = Process.objects.create(name='Corte Test', cost=5.00, tenant=self.tenant)
        self.category = Category.objects.create(name='Ropa', tenant=self.tenant)
        self.size = Size.objects.create(name='M', tenant=self.tenant)

    def test_create_sale_and_triggers_order_note(self):
        """
        Ensure that creating a Sale with items correctly creates the Sale, SaleItems,
        and automatically triggers the creation of an associated OrderNote.
        """
        # Step 1: Create a Design with a recipe via the API
        design_url = reverse('plantilla-list')
        design_data = {
            "name": "Diseño de Camisa para Flujo",
            "description": "Una camisa de prueba.",
            "category_id": self.category.id, # Added required field
            "size_ids": [self.size.id],     # Added required field
            "materials": [
                {
                    "raw_material": self.raw_material.id,
                    "quantity": 1.5
                }
            ],
            "processes": [
                {
                    "process": self.process.id,
                    "order": 1
                }
            ]
        }
        design_response = self.client.post(design_url, design_data, format='json')
        self.assertEqual(design_response.status_code, status.HTTP_201_CREATED, design_response.data)
        design_id = design_response.data['id']

        # Step 2: Create a Sale using the created Design
        sale_url = reverse('sale-list')
        sale_data = {
            "client": self.client_obj.id,
            "total_amount": "150.00",
            "payment_method": "Credit Card",
            "items": [
                {
                    "design": design_id,
                    "quantity": 2,
                    "unit_price": "75.00",
                    "cost": "25.00"
                }
            ]
        }
        sale_response = self.client.post(sale_url, sale_data, format='json')
        self.assertEqual(sale_response.status_code, status.HTTP_201_CREATED, sale_response.data)
        self.assertEqual(Sale.objects.count(), 1)
        self.assertEqual(SaleItem.objects.count(), 1)

        # Step 3: Verify that the OrderNote was created automatically
        self.assertEqual(OrderNote.objects.count(), 1)
        created_sale = Sale.objects.first()
        created_order_note = OrderNote.objects.first()
        self.assertEqual(created_order_note.sale, created_sale)
        self.assertIn(f"venta #{created_sale.id}", created_order_note.details)

        print("\nTest de flujo de venta completado con éxito: Venta -> Nota de Pedido fue verificado.")
