from django.http import HttpResponse
from django.shortcuts import render_to_response, redirect
from django.conf import settings
from django.core.urlresolvers import reverse
from django.utils import simplejson as json
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from django.core.context_processors import csrf
from django.template import RequestContext
from sqlshare.models import UserFile, Dataset, DatasetEmailAccess, CredentialsModel, FlowModel
from sqlshare.utils import _send_request, get_or_create_user
from oauth2client.django_orm import Storage
from oauth2client.client import OAuth2WebServerFlow
from apiclient.discovery import build
import httplib2
import urllib
import math
import re
from userservice.user import UserService

import httplib

@login_required
@csrf_protect
def home(request):
   user = UserService().get_user()
   c = { "user":user }
   c.update(csrf(request))
   return render_to_response('home.html', c, RequestContext(request))

@login_required
@csrf_protect
def user(request):
    content, code = get_or_create_user(UserService().get_user())

    user_response = HttpResponse(content)
    user_response.status_code = code

    return user_response

@login_required
@csrf_protect
def proxy(request, path):

    body = request.read()
    ss_response = _send_request(request.META['REQUEST_METHOD'], '/'+urllib.quote(path),
                {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                }, body=body, user=UserService().get_user())


    headers = ss_response.getheaders()
    response = HttpResponse(ss_response.read())

    for header in headers:
        name = header[0]
        value = header[1]
        if name == "x-powered-by":
            continue
        if name == "client-peer":
            continue
        if name == "x-aspnet-version":
            continue
        if name == "server":
            continue
        if name == "transfer-encoding":
            continue
        if name == "connection":
            continue

        # django 
        if name == "location":
            response[name] = "/sqlshare/proxy/"+value
        else:
            response[name] = value

    response.status_code = ss_response.status

    return response

@login_required
@csrf_exempt
def upload(request):
    user_file = UserFile(user_file=request.FILES["file"])
    user_file.save()

    content = _getMultipartData(user_file.user_file.path, 0, append_new_line=True)

    ss_response = _send_request('POST', '/REST.svc/v3/file',
                {
                    "Accept": "application/json",
                    "Content-Type": _getMultipartContentType(),
                }, body=content, user=UserService().get_user())

    headers = ss_response.getheaders()
    response = ss_response.read()

    ss_id = json.loads(response)

    ## This is the old File::Parser bit
    parser_response = _send_request('GET', '/REST.svc/v3/file/%s/parser' % ss_id,
                {
                    "Accept": "application/json",
                }, user=UserService().get_user())

    parser_data = parser_response.read()
    json_values = json.loads(parser_data)
    json_values["sol_id"] = user_file.id
    json_values["ss_id"] = ss_id

    json_response = json.dumps(json_values)

    return HttpResponse(json_response)

@login_required
@csrf_protect
def dataset_permissions(request, schema, table_name):
    response = _send_request('GET', '/REST.svc/v1/user/%s' % (UserService().get_user()),
                { "Accept": "application/json" })

    code = response.status
    content = response.read()

    person_data = json.loads(content)

    person_schema = person_data['schema']

    if (person_schema != schema):
        return HttpResponse(status = 403)

    dataset = Dataset(schema=schema, name=table_name)

    if request.method == "PUT":
        json_data = json.loads(request.raw_post_data)

        accounts = json_data["accounts"]
        emails = json_data["emails"]

        user_model = User.objects.get(username = UserService().get_user())
        dataset.set_access(accounts, emails, user_model)

        return HttpResponse("")


    access = dataset.get_all_access()

    return HttpResponse(json.dumps(access))

@login_required
def accept_dataset(request, token):
    email_access = DatasetEmailAccess.get_email_access_for_token(token)

    get_or_create_user(UserService().get_user())

    accounts = email_access.dataset.get_server_access()

    existing_account = False
    for login in accounts['authorized_viewers']:
        if login == UserService().get_user():
            existing_account = True

    if not existing_account:
        accounts['authorized_viewers'].append(UserService().get_user())
        email_access.dataset.set_server_access(accounts)

    return redirect(email_access.dataset.get_url())


def email_access(request, token):
    email_access = DatasetEmailAccess.get_email_access_for_token(token)

    person = User.objects.get_or_create(username = email_access.dataset.schema)[0]

    return render_to_response('accept_dataset.html', {
        'dataset_name': email_access.dataset.name,
        'name': person.get_full_name(),
        'login': person.username,
        'accept_url': email_access.get_accept_url(),
    }, RequestContext(request))
    return HttpResponse("")

@login_required
@csrf_protect
def send_file(request):
    # The user needs to be pulled here, because the middleware that
    # handles the response is called before stream_upload finishes
    return HttpResponse(stream_upload(request, UserService().get_user()))

def require_uw_login(request):
    login = request.META['REMOTE_USER']
    name = request.META['givenName']
    last_name = request.META['sn']
    email = request.META['mail']

    return _login_user(request, login, name, last_name, email)

def require_google_login(request):
    storage = Storage(CredentialsModel, 'id', request.session.session_key, 'credential')
    credential = storage.get()
    if credential is None or credential.invalid == True:
        flow = OAuth2WebServerFlow(client_id=settings.GOOGLE_OAUTH_KEY,
                                   client_secret=settings.GOOGLE_OAUTH_SECRET,
                                   scope='https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/userinfo.email',
                                   user_agent='plus-django-sample/1.0',
                                   state=request.GET['next'])

        authorize_url = flow.step1_get_authorize_url(settings.GOOGLE_RETURN_URL)

        f = FlowModel(id=request.session.session_key, flow=flow)
        f.save()

        return redirect(authorize_url)

    http = httplib2.Http()
    plus = build('plus', 'v1', http=http)
    credential.authorize(http)
    name_data = plus.people().get(userId='me').execute()

    name = name_data["name"]["givenName"]
    last_name = name_data["name"]["familyName"]

    plus = build('oauth2', 'v2', http=http)
    credential.authorize(http)
    email_data = plus.userinfo().get().execute()
    email = email_data["email"]

    return _login_user(request, email, name, last_name, email)

def _login_user(request, login_name, name, last_name, email):
    user = authenticate(username=login_name, password=None)
    user.first_name = name
    user.last_name = last_name
    user.email = email
    user.save()

    login(request, user)

    return redirect(request.GET['next'])

def google_return(request):
    f = FlowModel.objects.get(id=request.session.session_key)
    credential = f.flow.step2_exchange(request.REQUEST)
    storage = Storage(CredentialsModel, 'id', request.session.session_key, 'credential')
    storage.put(credential)

    google_login_url = reverse('sqlshare.views.require_google_login')
    google_login_url = "%s?next=%s" % (google_login_url, request.GET['state'])

    return redirect(google_login_url)

def user_search(request):
    users = User.objects.filter(username__icontains=request.GET['q'])

    data = { "users": [] }

    for user in users:
        data["users"].append({
            "login": user.username,
            "name": user.first_name,
            "surname": user.last_name,
            "email": user.email,
        })

    return HttpResponse(json.dumps(data))

def stream_upload(request, user):
    body = request.read()
    body_json = json.loads(body)

    has_error = False
    ss_id = body_json["ss_id"]
    user_file = UserFile.objects.get(pk=body_json["sol_id"])

    total_chunks = _getChunkCount(user_file)

    yield '{"total":%s, "progress":"' % total_chunks
    chunk_count = 1
    content = _getMultipartData(user_file.user_file.path, chunk_count)
    while content is not None:
        ss_response = _send_request('POST', '/REST.svc/v3/file/%s' % ss_id,
                {
                    "Accept": "application/json",
                    "Content-Type": _getMultipartContentType(),
                }, body=content, user=UserService().get_user())

        headers = ss_response.getheaders()
        response = ss_response.read()

        if ss_response.status != 200:
            body = ss_response.read()
            has_error = True
            yield '", "error":%s, "code":"%s"}' % (body, ss_response.status)
            break

        yield "."
        chunk_count += 1
        content = _getMultipartData(user_file.user_file.path, chunk_count)


    if not has_error:
        put_json = {}
        put_json["parser"] = {}

        if body_json["parser"]["delimiter"] == "\\t":
            put_json["parser"]["delimiter"] = "\t"
        else:
            put_json["parser"]["delimiter"] = body_json["parser"]["delimiter"]

        if body_json["parser"]["has_column_headers"]:
            put_json["parser"]["has_column_headers"] = True
        else:
            put_json["parser"]["has_column_headers"] = False

        if body_json["is_public"]:
            put_json["is_public"] = True
        else:
            put_json["is_public"] = False

        put_json["table_name"] = body_json["table_name"]
        put_json["columns"] = body_json["columns"]
        put_json["dataset_name"] = body_json["dataset_name"]
        put_json["description"] = body_json["description"]
        put_json["sample_data"] = None

        put_response = _send_request("PUT", "/REST.svc/v3/file/%s/database" % ss_id,
                    {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                    }, body=json.dumps(put_json), user=user)

        if put_response.status != 202:
            body = put_response.read()
            yield '","error":%s, "code":"%s"}' % (body, put_response.status)

    yield '"}'

def _getMultipartData(file_name, position, append_new_line=False):
    upload_chunk_size = _getUploadChunkSize()

    handle = open(file_name, 'r')
    handle.seek(position * upload_chunk_size, 0)

    chunk = handle.read(upload_chunk_size)

    if chunk == "":
        return None

    if append_new_line and len(chunk) < upload_chunk_size:
        chunk += "\n\n"

    boundary = _getMultipartBoundary()
    name = re.match(".*/([^/]+)$", file_name).group(1)
    name = name.encode('ascii', 'ignore')

    multipart_data = "\r\n".join([
        "--%s" % boundary,
        "Content-Disposition: form-data; name=\"file\" filename=\"%s\";" % name,
        "Content-Type: text/csv",
        "",
        chunk,
        "--%s--" % boundary,
    ])

    return multipart_data

def _getChunkCount(user_file):
    file_size = user_file.user_file.size

    return int(math.ceil(file_size / float(_getUploadChunkSize())))


def _getMultipartBoundary():
    return '----------ThIs_Is_tHe_bouNdaRY_$'

def _getMultipartContentType():
    return "multipart/form-data; boundary=%s" % _getMultipartBoundary()

# TODO - make config?
def _getUploadChunkSize():
    return 10485760
