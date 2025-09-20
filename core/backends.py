from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

class TenantAwareModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, tenant_id=None, **kwargs):
        UserModel = get_user_model()
        if username is None:
            username = kwargs.get(UserModel.USERNAME_FIELD)

        if tenant_id is None and request:
            # Try to get tenant_id from request headers (e.g., X-Tenant-ID)
            tenant_id = request.META.get('HTTP_X_TENANT_ID')
            if not tenant_id:
                # Alternatively, infer from hostname/subdomain if applicable
                # For now, we'll stick to explicit header for clarity
                return None # Tenant ID not provided in header

        if tenant_id is None:
            return None # Tenant ID is required for authentication

        try:
            # Attempt to get the user based on username (email) and tenant_id
            # Since email is no longer unique=True globally, we need to filter by tenant
            user = UserModel._default_manager.get(email=username, tenant__id=tenant_id)
            
        except UserModel.DoesNotExist:
            return None # No user found with that username and tenant_id

        # If user is found and tenant matches, check password
        if user.check_password(password):
            return user
        return None

    def get_user(self, user_id):
        UserModel = get_user_model()
        try:
            return UserModel._default_manager.get(pk=user_id)
        except UserModel.DoesNotExist:
            return None
