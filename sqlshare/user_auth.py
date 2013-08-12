from django.conf import settings
from django.contrib.auth.models import User, check_password

class ExtendedWayfBackend:
    def authenticate(self, username=None, password=None):
        user, is_new = User.objects.get_or_create(username=username)

        return user

    def get_user(self, userid):
        user = User.objects.get(pk=userid)

        return user
