from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_protect
import httplib

@login_required
@csrf_protect
def home(request):
   user = request.user
   return render_to_response('home.html', { "user": user})

@login_required
@csrf_protect
def user(request):
    conn = httplib.HTTPSConnection(
        'sqlshare-rest-test.cloudapp.net'
    )
    conn.connect()
    conn.putrequest('GET', '/REST.svc/v1/user/%s' % (request.user))
    conn.putheader('Accept', 'application/json')
    conn.endheaders()
    response = conn.getresponse()

    code = response.status
    content = response.read()

    if code == 404:
        conn.putrequest('PUT', '/REST.svc/v1/user/%s' % (request.user))
        conn.putheader('Accept', 'application/json')
        conn.putheader('Content-Type', 'application/json')
        conn.putheader('Content-Length', '0')
        conn.endheaders()
        response = conn.getresponse()
        code = response.status
        content = response.read()


    user = request.user
    user_response = HttpResponse(content)
    user_response.status_code = code

    return user_response

@login_required
@csrf_protect
def proxy(request, path):
    conn = httplib.HTTPSConnection(
        'sqlshare-rest-test.cloudapp.net'
    )
    conn.connect()

    sqlshare_secret = settings.SQLSHARE_SECRET
    conn.putrequest(request.META['REQUEST_METHOD'], '/'+path)
    conn.putheader('Authorization', 'ss_trust %s : %s' % (request.user, sqlshare_secret))
    conn.putheader('Accept', 'application/json')
    conn.putheader('Content-type', 'application/json')
    conn.endheaders()
    ss_response = conn.getresponse()

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

        response[name] = value

    response.status_code = ss_response.status

    return response

