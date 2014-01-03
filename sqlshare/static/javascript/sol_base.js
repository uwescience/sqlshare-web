var SolBase = function() {
};


SolBase.prototype._getRestRoot = function() {
    return "/"+this._getRestPath()+"/";
};

SolBase.prototype._getData = function(uri) {
    console.trace();
    return;
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
};


SolBase.prototype.AsyncGET = function(uri, callback, arg, opts) {
    return this._async_http('GET', uri, null, callback, arg, opts);
};

SolBase.prototype.AsyncPOST = function(uri, obj, callback, arg, opts) {
    return this._async_http('POST', uri, obj, callback, arg, opts);
};

SolBase.prototype.AsyncPUT = function(uri, obj, callback, arg, opts) {
   return this._async_http('PUT', uri, obj, callback, arg, opts);
};

SolBase.prototype.AsyncDELETE = function(uri, callback, arg, opts) {
    return this._async_http('DELETE', uri, null, callback, arg, opts);
};


SolBase.prototype._async_http = function(method, uri, obj, callback, arg, opts) {
    var me = this;

    if (!opts) { opts = {}; }


    var ajax_args = {
        type: method,
        headers: {
            "Accept": "application/json",
            "Content-type": "application/json",
            "X-CSRFToken": $("input[name=csrfmiddlewaretoken]").val()
        },
        data: obj ? JSON.stringify(obj) : null,
        complete: function(response) {
            me._handleSuccess(response, callback, arg);
        }
    };

    if (opts.progress) {
        ajax_args.xhrFields = {
            onprogress: opts.progress
        };
    }

    return $.ajax(uri, ajax_args);
};

SolBase.prototype._handleSuccess = function(response, callback, arg) {
    var self = this;

    var json;
    var status = response.status;
    if (response.responseText != "") {
        try {
            json = JSON.parse(response.responseText);
        }
        catch (e) {
            status = 500;
            json = { error:"Error parsing response: "+e.message };
        };
    }

    callback.call(self, {
        code    : status,
        data    : json,
        conn    : response
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

SolBase.prototype.showInputLoading = function(container_id, field) {
    var error_container = document.getElementById('err_'+field+'_'+container_id);
    error_container.innerHTML = '<img src="/static/images/processing.gif" alt="">';
    Solstice.Element.showInline(error_container);
};
