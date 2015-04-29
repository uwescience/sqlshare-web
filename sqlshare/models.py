from django.db import models
from sqlshare.utils import _send_request
from django.contrib.auth.models import User
from django.core.mail import EmailMultiAlternatives
from django.core.urlresolvers import reverse
from django.conf import settings
from django.template.loader import render_to_string
from oauth2client.django_orm import CredentialsField, FlowField
import re
import json
import urllib
import binascii
from Crypto.Cipher import AES

# Create your models here.

class UserFile(models.Model):
    user_file = models.FileField(upload_to="user_files/%Y/%m/%d")

class Dataset(models.Model):
    schema = models.CharField(max_length = 100)
    name = models.CharField(max_length = 140)

    def get_url(self):
        base_url = reverse('sqlshare.views.home')

        return "%s#s=query/%s/%s" % (base_url, urllib.quote(self.schema), urllib.quote(self.name))


class CredentialsModel(models.Model):
  id = models.CharField(max_length=50, primary_key=True)
  credential = CredentialsField()

class FlowModel(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    flow = FlowField()

