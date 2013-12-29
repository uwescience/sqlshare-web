A front end to SQLShare
========

Full install instructions: https://github.com/uwescience/sqlshare-web/wiki/Installation-instructions

Can use either ss_trust or ss_apikey authentication.  For ss_trust, add this to your settings.py:

SQLSHARE_AUTH_TYPE = "secret"            
SQLSHARE_SECRET = "your secret key"  

The user will be the user logged in to django.

For ss_apikey:

SQLSHARE_AUTH_TYPE = "apikey"                                                                            
SQLSHARE_API_KEY = "your api key"                                                    
SQLSHARE_API_USER = "your username"  


Your django user must match the apikey username.

By default it connects to the main sqlshare rest host - sqlshare-rest.cloudapp.net.  You can override that by adding this to your settings.py:

SQLSHARE_REST_HOST = 'sqlshare-rest-test.cloudapp.net' 
