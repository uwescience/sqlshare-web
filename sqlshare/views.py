from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.conf import settings
from django.utils import simplejson as json
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_protect
from django.core.context_processors import csrf
from sqlshare.models import UserFile
import urllib
import math
import re

import httplib

@login_required
@csrf_protect
def home(request):
   user = request.user
   c = { "user":user }
   c.update(csrf(request))
   return render_to_response('home.html', c)

@login_required
@csrf_protect
def user(request):
    response = _send_request('GET', '/REST.svc/v1/user/%s' % (request.user),
                { "Accept": "application/json" })

    code = response.status
    content = response.read()

    if code == 404:
        response = _send_request('PUT', '/REST.svc/v1/user/%s' % (request.user),
                {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Content-Length": "0"
                })
        code = response.status
        content = response.read()

    user = request.user
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
                }, body=body, user=request.user)


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
@csrf_protect
def upload(request):
    user_file = UserFile(user_file=request.FILES["file"])
    user_file.save()

    content = _getMultipartData(user_file.user_file.path, 0, append_new_line=True)

    ss_response = _send_request('POST', '/REST.svc/v3/file',
                {
                    "Accept": "application/json",
                    "Content-Type": _getMultipartContentType(),
                }, body=content, user=request.user)

    headers = ss_response.getheaders()
    response = ss_response.read()

    ss_id = json.loads(response)

    ## This is the old File::Parser bit
    parser_response = _send_request('GET', '/REST.svc/v3/file/%s/parser' % ss_id,
                {
                    "Accept": "application/json",
                }, user=request.user)

    parser_data = parser_response.read()
    json_values = json.loads(parser_data)
    json_values["sol_id"] = user_file.id
    json_values["ss_id"] = ss_id

    json_response = json.dumps(json_values)

    return HttpResponse(json_response)

@login_required
@csrf_protect
def send_file(request):
    return HttpResponse(stream_upload(request))

def stream_upload(request):
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
                }, body=content, user=request.user)

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
                    }, body=json.dumps(put_json), user=request.user)

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

    multipart_data = "\r\n".join([
        "--%s" % boundary,
        "Content-Disposition: form-data; name=\"file\" filename=\"%s\";" % name,
        "Content-Type: text/csv",
        "",
        chunk,
        "--%s--" % boundary,
    ])

    return multipart_data

def _send_request(method, url, headers, body=None, user=None):
    host = 'sqlshare-rest.cloudapp.net'
    if hasattr(settings, "SQLSHARE_REST_HOST"):
        host = settings.SQLSHARE_REST_HOST

    conn = httplib.HTTPSConnection(host)
    conn.connect()

    conn.putrequest(method, url)

    for header in headers:
        conn.putheader(header, headers[header])

    if user is not None:
        auth_type = "secret"
        if hasattr(settings, "SQLSHARE_AUTH_TYPE"):
            auth_type = settings.SQLSHARE_AUTH_TYPE

        if auth_type == "secret":
            sqlshare_secret = settings.SQLSHARE_SECRET
            conn.putheader('Authorization', 'ss_trust %s : %s' % (user, sqlshare_secret))

        if auth_type == "apikey":
            if settings.SQLSHARE_API_USER != user.username:
                raise Exception("Logged in user doesn't match the SQLSHARE user in settings")
            conn.putheader('Authorization', 'ss_apikey %s : %s' % (settings.SQLSHARE_API_USER, settings.SQLSHARE_API_KEY))

    if body and len(body) > 0:
        conn.putheader('Content-Length', len(body))

    conn.endheaders()

    if body and len(body) > 0:
        conn.send(body)

    response = conn.getresponse()

    return response

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
