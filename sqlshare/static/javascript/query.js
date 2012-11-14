var Query = function(div_id, query_id) {
    this.id = div_id;
    this.query_id = query_id;
    this._prepare_editor_counter = 0;
};

Query.prototype = new QueryBase();

Query.prototype.draw = function() {
    this._renderTo(this.id, 'query/interface.html', { id : this.id });
    this._editor = CodeMirror.fromTextArea(this.id +'_query', {
        textWrapping: false,
        parserfile: "parsesql.js",
        stylesheet: solstice_document_base+"/static/styles/sqlcolors.css",
        path: solstice_document_base+'/static/javascript/codemirror/',
        autoMatchParens: true
    });

    this._prepareEditor();

    YAHOO.util.Event.removeListener(this.id+'_run_query', "click");
    YAHOO.util.Event.removeListener(this.id+'_save_query', "click");
    YAHOO.util.Event.removeListener(this.id+'_download_query', "click");

    YAHOO.util.Event.addListener(this.id+'_run_query', "click", this._processQuery, this, true);
    YAHOO.util.Event.addListener(this.id+'_save_query', "click", this._showSaveAsDialog, this, true);
    YAHOO.util.Event.addListener(this.id+'_download_query', "click", this._downloadQuery, this, true);
};

Query.prototype._prepareEditor = function() {
    var me = this;
    // this outer timeout is for IE
    window.setTimeout(function() {
    try {
        Solstice.Element.show(me.id+'_query_wrapper');
        var query = YAHOO.util.History.getCurrentState('q');
        if (query == '') {
            query = YAHOO.util.History.getBookmarkedState("q");
        }
        else if (query == null) {
            me._editor.setCode("\n");
        }
        else {
            me._editor.setCode(query);
        }
        me._editor.focus();
    }
    catch (e) {
        // The editor doesn't seem to have an event to trigger on...
        // so keep trying for 5 seconds while this.editor isn't defined.
        if (e.message !== undefined && me._prepare_editor_counter < 10) {
            me._prepare_editor_counter++;
            var me2 = me;
            window.setTimeout(function() { me2._prepareEditor(); }, 500);
            return;
        }
        throw(e);
    }
    me._prepare_editor_counter = 0;

    }, 100);
};

Query.prototype._showSaveAsDialog = function() {
    this._saveQueryAs();
};

Query.prototype._postSaveAs = function(o) {
    var owner = o.data.owner;
    var name = o.data.name;
    var url = o.data.url;

    url = url.replace(/^\/REST.svc\/v2\/db\/dataset/, 'query');
    YAHOO.util.History.navigate('s', decodeURI(url));

    var popin = Solstice.YahooUI.PopIn.get('save_query_as');
    popin.hide();
};

Query.prototype._downloadQuery = function() {
    var query = this._editor.getCode();
    Solstice.Element.hide(this.id+'_download_error');
    this._downloadFile(query, this._onDownloadError);
};

Query.prototype._onDownloadError = function() {
    var error = this._getDownloadError();
    var error_div = document.getElementById(this.id+'_download_error');
    error_div.innerHTML = error.innerHTML;
    Solstice.Element.show(error_div);
};

Query.prototype._getDownloadURL = function(query) {
    return this._getRestRoot()+"/proxy/REST.svc/v1/db/file?SQL="+encodeURIComponent(query)+"&solstice_xsrf_token="+solstice_xsrf_token;
};


