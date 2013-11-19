var SolBase = function() {
};


SolBase.prototype._getRestRoot = function() {
    return "/"+this._getRestPath()+"/";
};

SolBase.prototype._getData = function(uri) {
    console.trace();
    return;
    var connection = YAHOO.util.Connect;
    connection.syncRequest = Solstice.Remote.syncRequest;

    connection.initHeader("Accept", "application/json", false);
    connection.initHeader("X-XSRF-Token", solstice_xsrf_token, false);

    try {
        var response = connection.syncRequest('GET', uri, {}, '');
        var json = response.conn.responseText;
        return YAHOO.lang.JSON.parse(json);
    }
    catch(e) {
        Solstice.log(e);
        return;
    }
};

SolBase.prototype.GET = function(uri, obj) {
    console.trace();
//    return this._http('GET', uri, obj);
};

SolBase.prototype.POST = function(uri, obj) {
    console.trace();
//    return this._http('POST', uri, obj);
};

SolBase.prototype.PUT = function(uri, obj) {
    console.trace();
//   return this._http('PUT', uri, obj);
};

SolBase.prototype.DELETE = function(uri) {
    console.trace();
//    return this._http('DELETE', uri);
};

SolBase.prototype._http = function(method, uri, obj) {
    console.trace();
    return;
    var connection = YAHOO.util.Connect;
    connection.syncRequest = Solstice.Remote.syncRequest;
    connection._use_default_post_header = false;

    connection.initHeader("Accept", "application/json", true);
    connection.initHeader("Content-type", "application/json", true);
    connection.initHeader("X-XSRF-Token", solstice_xsrf_token, true);
    connection.initHeader("X-CSRFToken", $("input[name=csrfmiddlewaretoken]").val(), true);

    try {
        var response = connection.syncRequest(method, uri, {}, JSON.stringify(obj));
        connection._use_default_post_header = true;
        var response_code  = response.conn.status;
        var json = response.conn.responseText;
        return {
            code    : response_code,
            data    : JSON.parse(json),
            conn    : response.conn
        };
    }
    catch(e) {
        Solstice.log(e);
        return;
    }

};


SolBase.prototype.AsyncGET = function(uri, callback, arg) {
    return this._async_http('GET', uri, null, callback, arg);
};

SolBase.prototype.AsyncPOST = function(uri, obj, callback, arg) {
    return this._async_http('POST', uri, obj, callback, arg);
};

SolBase.prototype.AsyncPUT = function(uri, obj, callback, arg) {
   return this._async_http('PUT', uri, obj, callback, arg);
};

SolBase.prototype.AsyncDELETE = function(uri, callback, arg) {
    return this._async_http('DELETE', uri, null, callback, arg);
};


SolBase.prototype._async_http = function(method, uri, obj, callback, arg) {
    var connection = YAHOO.util.Connect;
    connection.setDefaultPostHeader(false);

    connection.initHeader("Accept", "application/json", false);
    connection.initHeader("Content-type", "application/json", false);
    connection.initHeader("X-XSRF-Token", solstice_xsrf_token, false);
    connection.initHeader("X-CSRFToken", $("input[name=csrfmiddlewaretoken]").val(), true);

    var callback = {
        cache: false,
        success: this._handleSuccess,
        failure: this._handleSuccess,
        argument: [this, callback, arg]
    };

    var request = connection.asyncRequest(method, uri, callback, JSON.stringify(obj));
    connection.setDefaultPostHeader(true);

    return request;

};

SolBase.prototype._handleSuccess = function(o) {
    var self = this.argument[0];
    var callback = this.argument[1];
    var arg = this.argument[2];

    var json;
    var status = o.status;
    if (o.responseText != "") {
        try {
            json = YAHOO.lang.JSON.parse(o.responseText);
        }
        catch (e) {
            status = 500;
            json = { error:"Error parsing response: "+e.message };
        };
    }

    callback.call(self, {
        code    : status,
        data    : json,
        conn    : o
    }, arg);
};


SolBase.prototype._renderTo = function() {
    var content;
    var div = arguments[0];
    if (arguments.length == 3) {
        var template = arguments[1];
        var params = arguments[2];
        try {
            var content = HandlebarsUtils.to_string(template, params);
            $(div).html(content);
        }
        catch (e) {
            Solstice.log(e);
            return;
        }
    }
    else if (arguments.length == 2) {
        var view = arguments[1];
        content = view.toString();
    }
    else {
        throw("In valid number of arguments to _renderTo: "+arguments.length);
    }

    if (typeof div == "string") {
        div = document.getElementById(div);
    }
    try {
        div.innerHTML = content;
    }
    catch (e) {
        Solstice.log(e);
        return;
    }

    if (arguments.length == 2 && arguments[1].postRender) {
        arguments[1].postRender();
    }

};

SolBase.prototype.showErrors = function(container_id, errors) {
    for (var i = 0; i < errors.length; i++) {
        var message = errors[i].message;
        var field = errors[i].field;
        var error_container = document.getElementById('err_'+field+'_'+container_id);
        if(error_container){
            error_container.innerHTML = Solstice.String.encodeHTML(message);
            Solstice.Element.showInline(error_container);
        }
    }
};

SolBase.prototype.hideErrors = function(container_id) {
    YAHOO.util.Dom.getElementsByClassName('sol_error_notification_text', null, container_id, function(element) { Solstice.Element.hide(element);});
};

SolBase.prototype.hideAllErrors = function() {
    YAHOO.util.Dom.getElementsByClassName('sol_error_notification_text', null, document.body, function(element) { Solstice.Element.hide(element);});
};

SolBase.prototype.showInputLoading = function(container_id, field) {
    var error_container = document.getElementById('err_'+field+'_'+container_id);
    error_container.innerHTML = '<img src="/static/images/processing.gif" alt="">';
    Solstice.Element.showInline(error_container);
};
