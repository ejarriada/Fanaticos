from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Design, DesignMaterial, DesignProcess

@receiver(post_save, sender=DesignMaterial)
@receiver(post_delete, sender=DesignMaterial)
def update_design_cost_on_material_change(sender, instance, **kwargs):
    """
    Signal to update the calculated_cost of a Design when its DesignMaterial changes.
    """
    instance.design.calculate_cost()

@receiver(post_save, sender=DesignProcess)
@receiver(post_delete, sender=DesignProcess)
def update_design_cost_on_process_change(sender, instance, **kwargs):
    """
    Signal to update the calculated_cost of a Design when its DesignProcess changes.
    """
    instance.design.calculate_cost()