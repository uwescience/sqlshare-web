from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    url(r'^/*$', 'sqlshare.views.home', name='home'),
    url(r'^/*proxy/?(?P<path>.*)$', 'sqlshare.views.proxy'),
    url(r'^upload/?$', 'sqlshare.views.upload'),
    url(r'^parser/(?P<ss_id>.*)/(?P<sol_id>.*)$', 'sqlshare.views.parser'),
    url(r'^/*file/upload?$', 'sqlshare.views.send_file'),
    url(r'^dataset/(?P<token>.*)', 'sqlshare.views.add_dataset_by_token'),

    url(r'^oauth/', 'sqlshare.views.oauth_return'),
)
