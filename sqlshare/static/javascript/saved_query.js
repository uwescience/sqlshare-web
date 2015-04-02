

var SavedQuery = function(div_id, query_id) {
    this.wrapper_id = div_id;
    this.id = query_id;
    this.query_id = query_id;
    this._prepare_editor_counter = 0;

    if (query_id != null && query_id.match(/^[0-9]+$/)) {
        this._query_in_queue = true;
    }
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
        this.AsyncGET(this._getRestRoot()+"/proxy/v3/db/dataset/"+this.query_id, this._postFetch);
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

    var me = this;
    if (query_data.owner == solstice_user.login_name) {
        $("#action_menu .make_private").on("click", function() { me._togglePublic(); });
        $("#action_menu .make_public").on("click", function() { me._togglePublic(); });
        $("#action_menu .sharing_settings").on("click", function() { me._openSharingDialog(); });
        $("#action_menu .download").on("click", function() { me._downloadQuery(); });
        $("#action_menu .delete").on("click", function() { me._confirmDelete(); });
        $("#action_menu").menu();
    }
    else {
        $(".download").on("click", function(ev) { ev.preventDefault();  me._downloadQuery(); });
    }

    $(slash_selector("#"+this.id+"_derive")).off("click");
    $(slash_selector("#"+this.id+"_snapshot")).off("click");


    $(slash_selector("#"+this.id+"_derive")).on("click", function(ev) {
        ev.preventDefault();
        me._deriveQuery(ev);
    });
    $(slash_selector("#"+this.id+"_snapshot")).on("click", function(ev) {
        ev.preventDefault();
        me._snapshotQuery(ev);
    });
    $(slash_selector("#"+this.id+"_save_query")).on("click", function(ev) {
        ev.preventDefault();
        me._saveQueryAs(ev);
    });
    $(slash_selector("#"+this.id+"_run_query")).on("click", function(ev) {
        ev.preventDefault();
        me._processQuery(ev);
    });

    $(document).trigger("sqlshare_content_change");

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
    if (!$("#sharing_dataset_dialog").length) {
        $("body").append("<div id='sharing_dataset_dialog'></div>");
    }

    $("#sharing_dataset_dialog").html("");
    $("#sharing_dataset_dialog").dialog({
        modal: true,
        width: "440px",
        title: Solstice.Lang.getString('SQLShare', 'share_dataset_title')
    });

    this._getExistingPermissions();

};

// Stubbing this out for when we get the rest together
SavedQuery.prototype._getExistingPermissions = function() {
    var full_url = this._getRestRoot()+"/dataset/"+this.query_id+'/permissions';
    this.AsyncGET(full_url, this._postGetPermissions, null, true);
    //this._postGetPermissions({ code: 200 }, popin);
};

SavedQuery.prototype._postGetPermissions = function(o) {
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

    var me = this;
    $(document).on("sharing_panel_save", function() {
        me.draw();
    });

    $("#sharing_dataset_dialog").html(view.toString());
    // Recenter after content.  the timeout makes sure the browser's figured out the new content
    // size
    window.setTimeout(function() {
        $("#sharing_dataset_dialog").dialog("option", "position", "center");
    }, 0);

    view.postRender();

    $("#js-sharing-save-public").off("click");
    $("#js-sharing-save-public").on("click", function(ev) {
        me._makePublic(me);
    });
    }
    catch(e) { console.log(e) };
};

SavedQuery.prototype._makePublic = function() {
    this._model.is_public = false;
    this._togglePublic();
    $("#sharing_dataset_dialog").dialog("close");
};

SavedQuery.prototype._downloadQuery = function() {
    var query = this._query;
    Solstice.Element.hide(this.id+'_download_error');
    $(document).trigger("sqlshare_content_change");
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

    if (!$("#delete_dataset_dialog").length) {
        $("body").append("<div id='delete_dataset_dialog'></div>");
    }

    var view = new SQLShare.View.SavedQuery.ConfirmDelete(this._model);

    $("#delete_dataset_dialog").dialog({
        modal: true,
        title: Solstice.Lang.getString("SQLShare", "confirm_delete_title"),
        dialogClass: 'dialog-no-close-button'
    });

    $("#delete_dataset_dialog").html(view.toString());

    $(slash_selector("#"+this.id+'_delete_query')).off("click");
    $(slash_selector("#"+this.id+'_delete_cancel')).off("click");

    var me = this;
    $(slash_selector("#"+this.id+'_delete_query')).on("click", function(ev) {
        me._startDelete(ev);
    });
    $(slash_selector("#"+this.id+'_delete_cancel')).on("click", function(ev) {
        me._cancelDelete(ev);
    });
};

SavedQuery.prototype._cancelDelete = function() {
    $("#delete_dataset_dialog").dialog("close");
};

SavedQuery.prototype._startDelete = function() {
    var view = new SQLShare.View.SavedQuery.Deleting(this._model);
    $("#delete_dataset_dialog").html(view.toString());

    this.AsyncDELETE(this._getRestRoot()+"/proxy/REST.svc/v2/db/dataset/"+this.query_id, this._postDelete);
};

SavedQuery.prototype._postDelete = function(o) {
    Solstice.Message.setSuccess(Solstice.Lang.getMessage('SQLShare', 'query_deleted'));
    window.location.href = 'sqlshare/#s=home';
    $("#delete_dataset_dialog").dialog("close");

    this._model.query_id = this.query_id;

//    this.onQueryDelete.fire(this._model);
    $(document).trigger("query_delete", [this._model]);
};

SavedQuery.prototype._onDownloadError = function() {
    var error = this._getDownloadError();
    var error_div = document.getElementById(this.id+'_download_error');
    error_div.innerHTML = error.innerHTML;
    Solstice.Element.show(error_div);
    $(document).trigger("sqlshare_content_change");
};

SavedQuery.prototype._resetStatementContainer = function() {
    $(slash_selector("#"+this.id+"_statement_container")).removeClass("hover");

    var me = this;

    $(slash_selector("#"+this.id+'_edit_query')).off("click");
    $(slash_selector("#"+this.id+'_edit_query')).on("click", function(ev) {
        me._resetEditPanel(ev);
    });
};

SavedQuery.prototype._resetEditPanel = function(ev) {
    this._editQuery(this._model);

    $(document).trigger("sqlshare_edit_query", this);
    this._openStatementDialog();
};

SavedQuery.prototype._openStatementDialog = function(ev) {
    var center_width = document.getElementById('ss_content').offsetWidth;

    var me = this;
    var starting_width = parseInt(document.getElementById('ss_app_workspace').style.width);
    $("#ss_app_workspace").animate({
        width: center_width - 560
    },
    {
        step: function() {
            var width = document.getElementById('ss_app_workspace').style.width;
            width = parseInt(width);

            var right_width = (starting_width - width) - 5;
            $("#ss_editor_col").css("width", right_width+"px");
        },
        complete: function() {
            me._postExposeStatementEditor();
        }
    });
    return;
};

SavedQuery.prototype._editQuery = function(model) {
    this._renderTo('edit_query_container', new SQLShare.View.SavedQuery.Edit(model));

    $("#ss_save_statement").off("click");
    $("#ss_run_query").off("click");
    $("#ss_cancel_statement").off("click");

    $("#ss_editor_col").addClass("current_edit");
    $("#ss_editor_col").addClass("qid_"+this.query_id);

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
        stylesheet: static_url+"/styles/sqlcolors.css",
        path: static_url+'/javascript/codemirror/',
        autoMatchParens: true
    });

    this._prepareEditor();

    $(document).trigger("sqlshare_content_change");

    $("#ss_save_statement").off("click");
    $("#ss_run_query").off("click");
    $("#ss_cancel_statement").off("click");

    var me = this;
    $("#ss_save_statement").on("click", function(ev) {
        ev.preventDefault();
        me._beginStatementSave(ev);
    });
    $("#ss_run_query").on("click", function(ev) {
        ev.preventDefault();
        me._processQuery(ev);
    });
    $("#ss_cancel_statement").on("click", function(ev) {
        ev.preventDefault();
        me._cancelStatementSave(ev);
    });
    $("#ss_save_as").on("click", function(ev) {
        ev.preventDefault();
        me._showSaveAsDialog(ev);
    });
};

SavedQuery.prototype._cancelStatementSave = function(ev) {
    Solstice.Message.clear();
    if (ev) {
        ev.preventDefault();
    }

    $(document).trigger("sqlshare_edit_done", this);
    var center_width = document.getElementById('ss_app_workspace').offsetWidth;

    $("#ss_editor_col").removeClass("qid_"+this.query_id);

    var me = this;
    var starting_width = parseInt(document.getElementById('ss_editor_col').style.width);
    var center_starting_width = parseInt(document.getElementById('ss_app_workspace').style.width);
    $("#ss_editor_col").animate({
        width: 0
    },
    {
        step: function() {
            var width = document.getElementById('ss_editor_col').style.width;
            width = parseInt(width);

            var center_width = center_starting_width + (starting_width - width);

            $("#ss_app_workspace").css("width", center_width+"px");
        },
        complete: function() {
            me._postExposeStatementEditor();
        }
    });

};

SavedQuery.prototype.abortCurrentRequest = function() {
    if (SSBase._saved_query_request) {
        SSBase._saved_query_request.abort();
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

    $("#ss_editor_col").removeClass("qid_"+this.query_id);
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
