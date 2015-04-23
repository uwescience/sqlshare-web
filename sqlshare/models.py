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

    def send_email_notification(self, email_access, user_from):
        url = email_access.get_access_url()
        if hasattr(settings, 'EMAIL_FROM_ADDRESS'):
            from_email = settings.EMAIL_FROM_ADDRESS
        else:
            from_email = 'sqlshare-noreply@uw.edu'

        owner_name = user_from.get_full_name()

        if owner_name == "":
            owner_name = user_from.username

        host = settings.SQLSHARE_WEB_HOST
        url = "%s%s" % (host, url)

        values = {
            'url': url,
            'dataset': self.name,
            'owner_name': owner_name,
        }

        text_version = render_to_string('access_email/text.html', values)
        html_version = render_to_string('access_email/html.html', values)
        subject = render_to_string('access_email/subject.html', values)

        subject = re.sub(r'[\s]*$', '', subject)

        msg = EmailMultiAlternatives(subject, text_version, from_email, [email_access.email])
        msg.attach_alternative(html_version, "text/html")
        msg.send()


class DatasetEmailAccess(models.Model):
    dataset = models.ForeignKey(Dataset)
    email = models.CharField(max_length = 140)
    is_active = models.BooleanField()

    def get_accept_url(self):
        token = self.get_token()
        return reverse('sqlshare.views.accept_dataset', kwargs={
            'token': token
        })



    def get_access_url(self):
        token = self.get_token()
        return reverse('sqlshare.views.email_access', kwargs={
            'token': token
        })


    def get_token(self):
        BLOCK_SIZE = 32
        pad = lambda s: s + (BLOCK_SIZE - len(s) % BLOCK_SIZE) * "."

        string = "e_%s" % (self.pk)
        return binascii.hexlify(AES.new(settings.SECRET_KEY[:32]).encrypt(pad(string)))


    @staticmethod
    def get_email_access_for_token(token):
        padded = AES.new(settings.SECRET_KEY[:32]).decrypt(binascii.unhexlify(token))

        withe = re.sub('\.+$', '', padded)
        test_id = re.sub('^e_', '', withe)

        return DatasetEmailAccess.objects.get(pk = test_id)


class CredentialsModel(models.Model):
  id = models.CharField(max_length=50, primary_key=True)
  credential = CredentialsField()

class FlowModel(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    flow = FlowField()

