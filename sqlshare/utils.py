from django.conf import settings
import httplib

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


