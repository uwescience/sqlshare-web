from django.conf import settings
import re
import httplib
from django.http import HttpResponseRedirect
from sanction import Client, transport_headers

def _get_sqlshare_host():
    full_host = 'https://rest.sqlshare.uw.edu'
    if hasattr(settings, "SQLSHARE_REST_HOST"):
        full_host = settings.SQLSHARE_REST_HOST
    return full_host

class OAuthNeededException(Exception):
    def __init__(self, redirect):
        print "in __init__: ", redirect
        self.redirect = redirect

def _send_request(request, method, url, headers, body=None, user=None):
    # If we don't have an access token in our session, we need to get the
    # user to auth through the backend server
    if not "sqlshare_access_token" in request.session:
        raise OAuthNeededException(oauth_authorize())


    full_host = _get_sqlshare_host()

    host = re.sub(r"^https?://", "", full_host)

    if full_host.startswith('https://'):
        conn = httplib.HTTPSConnection(host)
    else:
        conn = httplib.HTTPConnection(host)

    conn.connect()

    conn.putrequest(method, url)

    for header in headers:
        conn.putheader(header, headers[header])

    if body and len(body) > 0:
        conn.putheader('Content-Length', len(body))

    conn.endheaders()

    if body and len(body) > 0:
        conn.send(body)

    response = conn.getresponse()

    return response


def get_or_create_user(request):
    response = _send_request(request, 'GET', '/v3/user/me',
                { "Accept": "application/json" })

    code = response.status
    content = response.read()

    return content, code

def get_oauth_client():
    backend_host = _get_sqlshare_host()
    auth_endpoint = "%s/o/authorize/" % backend_host
    token_endpoint = "%s/o/token/" % backend_host
    resource_endpoint = "%s/v3" % backend_host

    return Client(auth_endpoint=auth_endpoint,
                  token_endpoint=token_endpoint,
                  resource_endpoint=resource_endpoint,
                  client_id=settings.SQLSHARE_OAUTH_ID,
                  client_secret=settings.SQLSHARE_OAUTH_SECRET,
                  token_transport=transport_headers)


def oauth_authorize():
    c = get_oauth_client()

    response = HttpResponseRedirect(c.auth_uri())
    return response


def oauth_access_token(request):
    c = get_oauth_client()

    redirect_uri = "%s/sqlshare/oauth" % settings.SQLSHARE_WEB_HOST

    print "RU: ", redirect_uri
    token_request_data = {
        'code': request.GET['code'],
        'redirect_uri': redirect_uri,
    }

    access_token = c.request_token(**token_request_data)
    request.session['sqlshare_access_token'] = access_token

    response = HttpResponseRedirect("%s/sqlshare" % settings.SQLSHARE_WEB_HOST)

    return response
