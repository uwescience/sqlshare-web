/**
 * @fileoverview 
 * Solstice provides a js interface with its language files.
 *
 * Usage :
 *  var lang = new Solstice.Lang('Namespace');
 *  var string = lang.getString('key');
 *
 *  or
 *
 *  var string = Solstice.Lang.getString('Namespace', 'key');
 */

/**
 * @class Abstract superclass for Lang
 * @constructor
 */
Solstice.LangParams = new Array();
Solstice.Lang = function (namespace, others) {
    this._initialize(namespace, others);
    this.namespace = namespace;
};

Solstice.Lang.prototype.getString = function(key, params){
    var data = Solstice.LangData[this.namespace];
    if(data && data['strs'] && data['strs'][key] != null){
        var text = data['strs'][key];
        return this._insertParams(text, params);
    }
    return;
}

Solstice.Lang.getString = function(namespace, key, params) {
    var lang = new Solstice.Lang(namespace);
    return lang.getString(key, params);
}

Solstice.Lang.prototype.getButtonLabel= function(key, params){
    var data = Solstice.LangData[this.namespace];
    if(data && data['btns'] && data['btns'][key] != null && data['btns'][key].content != null){
        var text = data['btns'][key].content;
        return this._insertParams(text, params);
    }
    return;
}

Solstice.Lang.getButtonLabel = function(namespace, key, params) {
    var lang = new Solstice.Lang(namespace);
    return lang.getButtonLabel(key, params);
}

Solstice.Lang.prototype.getButtonTitle= function(key, params){
    var data = Solstice.LangData[this.namespace];
    if(data && data['btns'] && data['btns'][key] != null && data['btns'][key].title != null){
        var text = data['btns'][key].title;
        return this._insertParams(text, params);
    }
    return;
}

Solstice.Lang.getButtonTitle = function(namespace, key, params) {
    var lang = new Solstice.Lang(namespace);
    return lang.getButtonTitle(key, params);
}

Solstice.Lang.prototype.getMessage = function(key, params){
    var data = Solstice.LangData[this.namespace];
    if(data && data['msgs'] && data['msgs'][key] != null){
        var text = data['msgs'][key];
        return this._insertParams(text, params);
    }
    return;
}

Solstice.Lang.getMessage= function(namespace, key, params) {
    var lang = new Solstice.Lang(namespace);
    return lang.getMessage(key, params);
}

Solstice.Lang.prototype.getError = function(key, params){
    var data = Solstice.LangData[this.namespace];
    if(data && data['errs'] && data['errs'][key] != null){
        var text = data['errs'][key];
        return this._insertParams(text, params);
    }
    return;
}

Solstice.Lang.getError = function(namespace, key, params) {
    var lang = new Solstice.Lang(namespace);
    return lang.getError(key, params);
}

Solstice.Lang.prototype.getHelp = function(key, params){
    var data = Solstice.LangData[this.namespace];
    if(data && data['hlps'] && data['hlps'][key] != null){
        var text = data['hlps'][key];
        return this._insertParams(text, params);
    }
    return;
}

Solstice.Lang.getHelp = function(namespace, key, params) {
    var lang = new Solstice.Lang(namespace);
    return lang.getHelp(key, params);
}

Solstice.Lang.prototype.setNamespace = function(namespace) {
    //make sure the given namespace has been initialized
    Solstice.Lang.prototype._initialize(namespace);
    this.namespace = namespace;
}

Solstice.Lang.prototype._insertParams = function(text, params){
    var global_params = Solstice.LangParams[this.namespace];
    var _params = new Object;
    for(var key in global_params){
        _params[key] = global_params[key];
    }
    for(var key in params){
        _params[key] = params[key];
    }
    var regex = new RegExp(/<!--\s+sol_var\s+(name=\s*){0,1}(\w+)\s+-->/g);

    //$0 is the matched pattern
    return text.replace(regex, function($0, $1, $2){ 
            var replacement = _params[$2];
            if(replacement != null){
                return replacement;
            }
            return '';
        });
}

Solstice.Lang.isInitialized = function(namespace) {
    if (Solstice.LangData[namespace] != null && Solstice.LangData[namespace].strs != null) {
        return true;
    }
    return false;
}

Solstice.Lang.initialize = function(namespace, callback, context, args) {
    new Solstice.Lang(namespace);

    Solstice.Lang._checkInitialization(namespace, callback, context, args);
}

Solstice.Lang._checkInitialization = function(namespace, callback, context, args) {
    if (Solstice.Lang.isInitialized(namespace)) {
        callback.apply(context, args ? args : []);
    }
    else {
        window.setTimeout(function() {
            Solstice.Lang._checkInitialization(namespace, callback, context, args);
        }, 50);
    }
}

Solstice.Lang.prototype._initialize = function(namespace, others) {
    if(Solstice.LangData[namespace] == null){
        //make sure you don't call fetch multiple times
        Solstice.LangData[namespace] = {};
        Solstice.LangParams[namespace] = {};
        var namespaces = new Array();
        if(others){
            namespaces = others;
        }
        namespaces[namespaces.length] = namespace;
        this._fetchLangData(namespaces);
    }
}

Solstice.Lang.prototype._fetchLangData = function(namespaces){
    // Now just included as a js file inline
    return true;
}
