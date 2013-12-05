

var SavedQuery = function(div_id, query_id) {
    this.wrapper_id = div_id;
    this.id = query_id;
    this.query_id = query_id;
    this._prepare_editor_counter = 0;

    if (query_id != null && query_id.match(/^[0-9]+$/)) {
        this._query_in_queue = true;
    }

    this.onQueryDelete = new YAHOO.util.CustomEvent('onQueryDelete');
};

SavedQuery.prototype = new QueryBase();

SavedQuery.prototype.draw = function() {
    this._renderTo(this.wrapper_id, 'saved_query/loading.html', { id : this.id });
    this._fetchSavedQuery();
};

SavedQuery.prototype._fetchSavedQuery = function() {
    if (this._query_in_queue) {
        this.AsyncGET(this._getRestRoot()+"/proxy/REST.svc/v2/db/process/"+this.query_id, this._postFetch);
    }
    else {
        this.AsyncGET(this._getRestRoot()+"/proxy/REST.svc/v2/db/dataset/"+this.query_id, this._postFetch);
    }
};

SavedQuery.prototype._postFetch = function(o) {
    if (o.code == 200) {
        this._drawSavedQuery(o.data);
    }
    else if (o.code == 404) {
        this._renderTo(this.wrapper_id, 'saved_query/not_found.html', {});
    }
    else {
        this._renderTo(this.wrapper_id, 'saved_query/error.html', {});
    }
};

SavedQuery.prototype._drawPreviewTable = function(query_data) {
    var columns = [];
    for (var column in query_data.columns) {
        columns.push(query_data.columns[column].name);
    }

    var header = document.getElementById('initial_preview_header');
    if (header) {
        document.getElementById('initial_total_rows').innerHTML = query_data.rows_total;
        if (query_data.rows_total < SQLShare.Constants.MAX_PREVIEW_ROWS) {
            document.getElementById('initial_max_rows').innerHTML = query_data.rows_total;
        }
        else {
            document.getElementById('initial_max_rows').innerHTML = SQLShare.Constants.MAX_PREVIEW_ROWS;
        }

        var column_count = query_data.columns.length;
        document.getElementById('initial_total_cols').innerHTML = column_count;
        if (column_count < SQLShare.Constants.MAX_PREVIEW_COLS) {
            document.getElementById('initial_max_cols').innerHTML = column_count;
        }
        else {
            document.getElementById('initial_max_cols').innerHTML = SQLShare.Constants.MAX_PREVIEW_COLS;
        }


        Solstice.Element.show('initial_preview_header');
    }

    this._drawTable(this.id+"_saved_results", columns, query_data.sample_data);
};

SavedQuery.prototype._drawSavedQuery = function(query_data) {
    query_data.container_id = this.id;

    var editor_pane = document.getElementById('ss_editor_col');

    this._renderTo(this.wrapper_id, new SQLShare.View.SavedQuery(query_data));


    this._model = query_data;
    this._query = query_data.sql_code;
    if (query_data.sample_data_status == "ok" || query_data.sample_data_status == "success") {
        this._drawPreviewTable(query_data);
    }
    else if (query_data.sample_data_status == "working") {
        this._renderTo(this.id+"_saved_results", "saved_query/loading_preview.html", {});
        this._loadWorkingPreview();
    }
    else if (query_data.sample_data_status == "working") {
        this._renderTo(this.id+"_saved_results", "saved_query/building_snapshot.html", {});
        return;
    }

    else {
        this._renderTo(this.id+"_saved_results", "saved_query/preview_error.html", {});
    }


    this._resetNameContainer();
    this._resetDescriptionContainer();
    this._resetStatementContainer();

    if (query_data.owner == solstice_user.login_name) {
        var me = this;
        $("#action_menu .make_private").on("click", function() { me._togglePublic(); });
        $("#action_menu .make_public").on("click", function() { me._togglePublic(); });
        $("#action_menu .sharing_settings").on("click", function() { me._openSharingDialog(); });
        $("#action_menu .download").on("click", function() { me._downloadQuery(); });
        $("#action_menu .delete").on("click", function() { me._confirmDelete(); });
        $("#action_menu").menu();
    }



    YAHOO.util.Event.removeListener(this.id+'_derive', "click");
    YAHOO.util.Event.removeListener(this.id+'_snapshot', "click");
    YAHOO.util.Event.addListener(this.id+'_derive', "click", this._deriveQuery, this, true);
    YAHOO.util.Event.addListener(this.id+'_snapshot', "click", this._snapshotQuery, this, true);
    YAHOO.util.Event.addListener(this.id+'_save_query', "click", this._saveQueryAs, this, true);
    YAHOO.util.Event.addListener(this.id+'_run_query', "click", this._processQuery, this, true);

    SQLShare.onChangeContent.fire();

    if (Solstice.Cookie.read('edit_query')) {
        Solstice.Cookie.remove('edit_query');
        this._renderEditPanel();
        this._postExposeStatementEditor();
    }

    if (this._query_in_queue) {
        this._postExposeStatementEditor();
    }
};

SavedQuery.prototype._openSharingDialog = function() {
    var popin = Solstice.YahooUI.PopIn.init('share_dataset', true);
    popin.cfg.setProperty('width', '440px');

    popin.setHeader(Solstice.Lang.getString('SQLShare', 'share_dataset_title'));

    this._getExistingPermissions(popin);

};

// Stubbing this out for when we get the rest together
SavedQuery.prototype._getExistingPermissions = function(popin) {
    var full_url = this._getRestRoot()+"/dataset/"+this.query_id+'/permissions';
    this.AsyncGET(full_url, this._postGetPermissions, popin, true);
    //this._postGetPermissions({ code: 200 }, popin);
};

SavedQuery.prototype._postGetPermissions = function(o, popin) {
    if (o.code != 200) {
        return;
    }

    try {
    var data = o.data;

    this._model.is_public = data.is_public;

    var view = new SQLShare.View.Query.SharingPanel({
        permissions: { users: data.accounts, emails: data.emails },
        dataset: this._model
    });
    view.onSave.subscribe(function() {
        this.draw();
    }, this, true);

    popin.setBody(view.toString());
    view.postRender();
    popin.show();


    YAHOO.util.Event.removeListener('js-sharing-save-public', "click");
    YAHOO.util.Event.addListener('js-sharing-save-public', "click", this._makePublic, this, true);
    }
    catch(e) { console.log(e) };
};

SavedQuery.prototype._makePublic = function() {
    this._model.is_public = false;
    this._togglePublic();
    Solstice.YahooUI.PopIn.lower('share_dataset');
};

SavedQuery.prototype._downloadQuery = function() {
    var query = this._query;
    Solstice.Element.hide(this.id+'_download_error');
    SQLShare.onChangeContent.fire();
    this._downloadFile(query, this._onDownloadError);
};

SavedQuery.prototype._getDownloadURL = function(query) {
    var url;
    if (this._query_in_queue) {
        sql = this._editor.getCode();
        url = this._getRestRoot()+"/proxy/REST.svc/v1/db/file?SQL="+encodeURIComponent(sql);
        url += "&solstice_xsrf_token="+solstice_xsrf_token;
    }
    else {
        url = this._getRestRoot()+"/proxy/REST.svc/v2/db/dataset/"+this.query_id+"/result";
        url += "?solstice_xsrf_token="+solstice_xsrf_token;
    }
    return url;
};

SavedQuery.prototype._confirmDelete = function() {
    var popin = Solstice.YahooUI.PopIn.init('confirm_delete', true);
    popin.cfg.setProperty('close', false);

    popin.setHeader(Solstice.Lang.getString("SQLShare", "confirm_delete_title"));
    var view = new SQLShare.View.SavedQuery.ConfirmDelete(this._model);
    popin.setBody(view.toString());


    popin.show();
    YAHOO.util.Event.removeListener(this.id+'_delete_query', "click");
    YAHOO.util.Event.removeListener(this.id+'_delete_cancel', "click");
    YAHOO.util.Event.addListener(this.id+'_delete_query', "click", this._startDelete, this, true);
    YAHOO.util.Event.addListener(this.id+'_delete_cancel', "click", this._cancelDelete, this, true);
};

SavedQuery.prototype._cancelDelete = function() {
    Solstice.YahooUI.PopIn.lower('confirm_delete');
};

SavedQuery.prototype._startDelete = function() {
    var popin = Solstice.YahooUI.PopIn.get('confirm_delete');
    popin.setBody("");
    var view = new SQLShare.View.SavedQuery.Deleting(this._model);
    popin.setBody(view.toString());

    this.AsyncDELETE(this._getRestRoot()+"/proxy/REST.svc/v2/db/dataset/"+this.query_id, this._postDelete);
};

SavedQuery.prototype._postDelete = function(o) {
    Solstice.Message.setSuccess(Solstice.Lang.getMessage('SQLShare', 'query_deleted'));
    window.location.href = 'sqlshare/#s=home';
    Solstice.YahooUI.PopIn.lower('confirm_delete');

    this._model.query_id = this.query_id;

    this.onQueryDelete.fire(this._model);
};

SavedQuery.prototype._onDownloadError = function() {
    var error = this._getDownloadError();
    var error_div = document.getElementById(this.id+'_download_error');
    error_div.innerHTML = error.innerHTML;
    Solstice.Element.show(error_div);
    SQLShare.onChangeContent.fire();
};

SavedQuery.prototype._resetStatementContainer = function() {
    YAHOO.util.Dom.removeClass(this.id+"_statement_container", "hover");
    YAHOO.util.Event.removeListener(this.id+'_edit_query', "click");
    YAHOO.util.Event.addListener(this.id+'_edit_query', "click", this._resetEditPanel, this, true);
};

SavedQuery.prototype._resetEditPanel = function(ev) {
    this._editQuery(this._model);
    SQLShare.onEditQuery.fire(this);
    this._openStatementDialog();
};

SavedQuery.prototype._openStatementDialog = function(ev) {
    var center_width = document.getElementById('ss_content').offsetWidth;

    var anim_mid = new YAHOO.util.Anim("ss_app_workspace", {
        width: { to: (center_width - 560) }
    });

    var starting_width = parseInt(document.getElementById('ss_app_workspace').style.width);
    anim_mid.onTween.subscribe(function() {
        var width = document.getElementById('ss_app_workspace').style.width;
        width = parseInt(width);

        var right_width = (starting_width - width) - 5;
        if (right_width > 0) {
            document.getElementById('ss_editor_col').style.width = right_width + 'px';
        }
    });
    anim_mid.onComplete.subscribe(this._postExposeStatementEditorHook, { me: this}, true);
    anim_mid.animate();

    return;
};

SavedQuery.prototype._editQuery = function(model) {
    this._renderTo('edit_query_container', new SQLShare.View.SavedQuery.Edit(model));
    YAHOO.util.Event.removeListener('ss_save_statement', "click");
    YAHOO.util.Event.removeListener('ss_run_query', "click");
    YAHOO.util.Event.removeListener('ss_cancel_statement', "click");

    YAHOO.util.Dom.addClass('ss_editor_col', 'current_edit');
    YAHOO.util.Dom.addClass('ss_editor_col', 'qid_'+this.query_id);

};

SavedQuery.prototype._renderEditPanel = function() {
    this._editQuery(this._model);
};

SavedQuery.prototype._deriveQuery = function() {

    var query = "SELECT * FROM "+this._model.qualified_name;

    var derived = new SavedQuery(this.wrapper_id);
    derived._model = {
        sql_code:query,
        container_id: '__new'
    }
    derived.id = '__new';
    derived._renderEditPanel();
    derived._openStatementDialog();
};


SavedQuery.prototype._snapshotQuery = function() {

    var query = "SELECT * FROM "+this._model.qualified_name;

    var derived = new SavedQuery(this.wrapper_id);
    var name = this._model.qualified_name;
    if (!this._model.owner) {
        name = Solstice.Lang.getString('SQLShare', 'snapshot_unsaved_query_name');
        query = this._model.sql_code;
    }
    derived._model = {
        sql_code:query,
        name: Solstice.Lang.getString('SQLShare', 'snapshot_default_name', { name: name}),
        description: Solstice.Lang.getString('SQLShare', 'snapshot_default_description', { sql: this._model.sql_code}),
        is_snapshot: true,
        container_id: '__new'
    }
    derived.id = '__new';
    derived._saveQueryAs();
};


SavedQuery.prototype._postExposeStatementEditorHook = function() {
    this.me._postExposeStatementEditor();
};

SavedQuery.prototype._postExposeStatementEditor = function(ev) {
    document.getElementById('edit_query_container').style.overflow = '';

    var query = this._model;
    var area_id = 'ss_edit_statement_area';
    if (this._query_in_queue) {
        area_id = this.id+'_sql_display';
    }

    this._editor = CodeMirror.fromTextArea(area_id, {
        textWrapping: false,
        parserfile: "parsesql.js",
        stylesheet: solstice_document_base+"/static/styles/sqlcolors.css",
        path: solstice_document_base+'/static/javascript/codemirror/',
        autoMatchParens: true
    });

    this._prepareEditor();

    SQLShare.onChangeContent.fire();

    YAHOO.util.Event.removeListener('ss_save_statement', "click");
    YAHOO.util.Event.removeListener('ss_run_query', "click");
    YAHOO.util.Event.removeListener('ss_cancel_statement', "click");
    YAHOO.util.Event.addListener('ss_save_statement', "click", this._beginStatementSave, this, true);
    YAHOO.util.Event.addListener('ss_save_as', "click", this._showSaveAsDialog, this, true);
    YAHOO.util.Event.addListener('ss_run_query', "click", this._processQuery, this, true);
    YAHOO.util.Event.addListener('ss_cancel_statement', "click", this._cancelStatementSave, this, true);
};

SavedQuery.prototype._cancelStatementSave = function(ev) {
    Solstice.Message.clear();
    if (ev) {
        YAHOO.util.Event.stopEvent(ev);
    }
    SQLShare.onEditDone.fire(this);
    var center_width = document.getElementById('ss_app_workspace').offsetWidth;

    YAHOO.util.Dom.removeClass('ss_editor_col', 'qid_'+this.query_id);


    var anim = new YAHOO.util.Anim("ss_editor_col", {
        width: { to: 0 }
    });

    var starting_width = parseInt(document.getElementById('ss_editor_col').style.width);
    var center_starting_width = parseInt(document.getElementById('ss_app_workspace').style.width);
    anim.onTween.subscribe(function() {
        var width = document.getElementById('ss_editor_col').style.width;
        width = parseInt(width);

        var center_width = center_starting_width + (starting_width - width) - 5;
        if (center_width > 0) {
            document.getElementById('ss_app_workspace').style.width = center_width + 'px';
        }
    });


    anim.onComplete.subscribe(this._postHideStatementEditorHook, { me: this}, true);
    anim.animate();

};

SavedQuery.prototype.abortCurrentRequest = function() {
    if (SSBase._saved_query_request) {
        var value = YAHOO.util.Connect.abort(SSBase._saved_query_request, function() { console.log('ran abort'); }, false);
    }
    if (SSBase._saved_query_timeout) {
        clearTimeout(SSBase._saved_query_timeout);
    }

    if (SSBase._saved_query_results_timeout) {
        clearTimeout(SSBase._saved_query_results_timeout);
    }

};


SavedQuery.prototype._setQueryResultsTimeout = function(timeout) {
    SSBase._saved_query_results_timeout = timeout;
};


SSBase.prototype.setCurrentRequest = function(o) {
    SSBase._saved_query_request = o;
};


SSBase.prototype.setResultsTimeout = function(timeout) {
    SSBase._saved_query_results_timeout = timeout;
};

SavedQuery.prototype.clearResultsTimeout = function() {
    clearTimeout(SSBase._saved_query_results_timeout);
};

SavedQuery.prototype._prepareEditor = function() {
    var me = this;
    // this outer timeout is for IE
    window.setTimeout(function() {
    try {
        var area_wrapper = 'edit_query_wrapper';
        if (me._query_in_queue) {
            area_wrapper = me.id+'_query_wrapper';
        }

        Solstice.Element.show(area_wrapper);
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



SavedQuery.prototype._postHideStatementEditorHook = function() {
    this.me._postHideStatementEditor();
};

SavedQuery.prototype._postHideStatementEditor = function() {
    document.getElementById('edit_query_container').style.overflow = 'hidden';
    var buttons = YAHOO.util.Dom.getElementsByClassName("edit_query_button");
    var length = buttons.length;
    for (var i = 0; i < length; i++) {
        buttons[i].disabled = false;
    }
    SQLShare.onChangeContent.fire();
};

SavedQuery.prototype._showSaveAsDialog = function(ev) {
    Solstice.Message.clear();
    this._saveQueryAs();
    document.getElementById(this.id+"_query_name").select();
};

SavedQuery.prototype._loadWorkingPreview = function() {
    var full_url = this._getRestRoot()+"/proxy/REST.svc/v2/db/dataset/"+this.query_id;
    this.AsyncGET(full_url, this._loadDataPreview);
};

SavedQuery.prototype._loadDataPreview = function(o) {
    if (o.code == 200) {
        var query_data = o.data;
        if (query_data.sample_data_status == "ok") {
            this._drawPreviewTable(query_data);
            return;
        }
        if (query_data.sample_data_status == "error") {
            this._renderTo(this.id+"_saved_results", "saved_query/preview_error.html", {});
            return;
        }
        if (query_data.sample_data_status == "working") {
            this._renderTo(this.id+"_saved_results", "saved_query/building_snapshot.html", {});
            return;
        }
        var me = this;
        window.setTimeout(function() {
            me._loadWorkingPreview();
        },
        2000);
    }
    else {
        this._renderTo(this.id+"_saved_results", "saved_query/preview_error.html", {});
    }
};


SavedQuery.prototype._postSaveAs = function(o) {
    var owner = o.data.owner;
    var name = o.data.name;
    var url = o.data.url;

    url = url.replace(/^\/REST.svc\/v1\/db\//, '');
    var test_id = "#s="+url;

    if (decodeURIComponent(test_id) == decodeURIComponent(window.location.hash)) {
        this._fetchSavedQuery();
    }
    else {
        $.History.go("s="+decodeURI(url));
    }

    var popin = Solstice.YahooUI.PopIn.get('save_query_as');
    popin.hide();



    YAHOO.util.Dom.removeClass('ss_editor_col', 'qid_'+this.query_id);
    Solstice.Cookie.set('edit_query', true);
};

SavedQuery.prototype._beginStatementSave = function(ev) {
    var new_statement = this._editor.getCode();

    if (new_statement == this._model.sql_code) {
        return;
    }

    this._model._old_sql_code = this._model.sql_code;
    this._model.sql_code = new_statement;

    var url = this._model.url;
    Solstice.Message.clear();
    this.AsyncPUT(this._getRestRoot()+"/proxy/"+url, this._model, this._postSaveStatement);
};

SavedQuery.prototype._postSaveStatement = function(o) {
    if (o.code == 201 || o.code == 200) {
        this._resetStatementContainer();
        var owner = this._model.owner;
        var name = this._model.name;

        var url = this._model.url;
        url = url.replace(/^\/REST.svc\/v1\/db\//, '');
        var test_id = "#s="+url;

        if (decodeURIComponent(test_id) == decodeURIComponent(window.location.hash)) {
            this._fetchSavedQuery();
        }
        else {
            window.location.href = solstice_document_base+"sqlshare"+test_id;
        }
    }
    else {
        this._model.sql_code = this._model._old_sql_code;
        Solstice.Message.setError(Solstice.Lang.getMessage('SQLShare', 'error_saving_query'));
    }
};

SavedQuery.prototype._postTogglePublic = function(o) {
    if (o.data.is_public) {
        Solstice.Message.setSuccess(Solstice.Lang.getMessage('SQLShare', 'query_shared'));
    }
    else {
        Solstice.Message.setSuccess(Solstice.Lang.getMessage('SQLShare', 'query_unshared'));
    }
    this._fetchSavedQuery();
};

SavedQuery.prototype._getObjectType = function() { return 'query'; };
SavedQuery.prototype._getObjectName = function() { return this._model.name; };
SavedQuery.prototype._setObjectName = function(name) { this._model.name = name; };
SavedQuery.prototype._getRenameView = function() { return new SQLShare.View.SavedQuery.Rename(this._model); };

SavedQuery.prototype._getObjectDescription = function() { return this._model.description; };
SavedQuery.prototype._setObjectDescription = function(name) { this._model.description= name; };
SavedQuery.prototype._getChangeDescriptionView = function() { return new SQLShare.View.SavedQuery.ChangeDescription(this._model); };
