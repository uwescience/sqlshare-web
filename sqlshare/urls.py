from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    url(r'^/*$', 'sqlshare.views.home', name='home'),
    url(r'^/*user/?$', 'sqlshare.views.user'),
    url(r'^/*proxy/?(?P<path>.*)$', 'sqlshare.views.proxy'),
    url(r'^upload/?$', 'sqlshare.views.upload'),
    url(r'^/file/upload?$', 'sqlshare.views.send_file'),
    url(r'^/dataset/(?P<schema>[^/]+)/(?P<table_name>[^/]+)/permissions$', 'sqlshare.views.dataset_permissions'),

    url(r'^/ds/(?P<token>.*)/accept', 'sqlshare.views.accept_dataset'),
    url(r'^/ds/(?P<token>.*)', 'sqlshare.views.email_access'),
)
