from django.db import models
from sqlshare.utils import _send_request
from django.utils import simplejson as json
from django.contrib.auth.models import User
from django.core.mail import EmailMultiAlternatives
from django.core.urlresolvers import reverse
from django.conf import settings
from django.template.loader import render_to_string
import re
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

    def get_server_access(self):
        return self._get_server_data()

    def set_server_access(self, access):
        schema = self.schema
        name = self.name

        url = '/REST.svc/v2/db/dataset/%s/%s/permissions' % (urllib.quote(schema), urllib.quote(name))

        response = _send_request('PUT', url, {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
        }, body=json.dumps(access), user=schema)


    def get_all_access(self):
        server_data = self._get_server_data()


        data = {
            'is_shared': server_data['is_shared'],
            'is_public': server_data['is_public'],
            'emails': [],
            'accounts': [],
        }

        stored_dataset_query = Dataset.objects.filter(schema = self.schema, name = self.name)

        if len(stored_dataset_query):
            stored_dataset = stored_dataset_query[0]
            local_data = DatasetEmailAccess.objects.filter(dataset = stored_dataset, is_active = True)

            for entry in local_data:
                data['emails'].append(entry.email)


        for username in server_data["authorized_viewers"]:
            person = User.objects.get_or_create(username = username)[0]

            data['accounts'].append({
                'login': username,
                'name': person.first_name,
                'surname': person.last_name,
                'origin_email': person.email,
            })


        return data

    def set_access(self, accounts, emails, user_from):
        data = {
            'is_shared': False,
            'is_public': False,
            'authorized_viewers': accounts,
        }

        if len(accounts) or len(emails):
            data['is_shared'] = True

        schema = self.schema
        name = self.name

        url = '/REST.svc/v2/db/dataset/%s/%s/permissions' % (urllib.quote(schema), urllib.quote(name))

        _send_request('PUT', url, {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
        }, body=json.dumps(data), user=schema)

        stored_dataset, was_created = Dataset.objects.get_or_create(schema = self.schema, name = self.name)

        DatasetEmailAccess.objects.filter(dataset=stored_dataset, is_active=False, email__in=emails).update(is_active = True)

        DatasetEmailAccess.objects.filter(dataset=stored_dataset, is_active=True).exclude(email__in=emails).update(is_active = False)

        for email in emails:
            res, created = DatasetEmailAccess.objects.get_or_create(dataset=stored_dataset, is_active=True, email=email)

            if created:
                self.send_email_notification(res, user_from)

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

    def _get_server_data(self):
        schema = self.schema
        name = self.name

        url = '/REST.svc/v2/db/dataset/%s/%s/permissions' % (urllib.quote(schema), urllib.quote(name))
        response = _send_request('GET', url, {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                    }, user=schema)

        data = json.loads(response.read())

        return data

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




