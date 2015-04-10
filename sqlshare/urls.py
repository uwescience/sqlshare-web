from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    url(r'^/*$', 'sqlshare.views.home', name='home'),
    url(r'^/*proxy/?(?P<path>.*)$', 'sqlshare.views.proxy'),
    url(r'^upload/?$', 'sqlshare.views.upload'),
    url(r'^parser/(?P<ss_id>.*)/(?P<sol_id>.*)$', 'sqlshare.views.parser'),
    url(r'^/*file/upload?$', 'sqlshare.views.send_file'),

    url(r'^ds/(?P<token>.*)/accept', 'sqlshare.views.accept_dataset'),
    url(r'^ds/(?P<token>.*)', 'sqlshare.views.email_access'),

    url(r'^google_return', 'sqlshare.views.google_return'),
    url(r'^google', 'sqlshare.views.require_google_login'),
    url(r'^uw/', 'sqlshare.views.require_uw_login'),
    url(r'^oauth/', 'sqlshare.views.oauth_return'),
)
