var QueryBase = function() {
};

QueryBase.prototype = new SSBase();

QueryBase.prototype._drawTable = function(id, columns, data) {
    var max_col = columns.length;
    if (max_col > SQLShare.Constants.MAX_PREVIEW_COLS) {
        max_col = SQLShare.Constants.MAX_PREVIEW_COLS;
        Solstice.Message.setInfo(Solstice.Lang.getMessage('SQLShare', 'max_preview_cols_exceeded', {
            shown: SQLShare.Constants.MAX_PREVIEW_COLS,
            total: columns.length
        }));
    }

    var table_id = id+"_table";
    $(slash_selector("#"+id)).html('<table cellpadding="0" cellspacing="0" border="0" class="display" id="'+table_id+'"></table>');
    var column_titles = [];
    for (var i = 0; i < columns.length; i++) {
        column_titles.push({ sTitle: columns[i] });
    }

    window.setTimeout(function() {
        $(slash_selector("#"+table_id)).dataTable({
            aaData: data,
            aoColumns: column_titles,
        });
    }, 0);
};


QueryBase.prototype._downloadFile = function(query, error_callback) {
    this._createNewIFrame();
    var iframe = this._getDownloadIFrame();
    $(iframe).off("load");
    if (error_callback) {
        var me = this;
        $(iframe).on("load", function(ev) {
            error_callback.apply(me);
        });
    }
    var download_url = this._getDownloadURL(query);
    iframe.location.href = download_url;
};

QueryBase.prototype._getDownloadError = function() {
    var iframe = this._getDownloadIFrame();
    return iframe.document.body;
};

QueryBase.prototype._createNewIFrame = function() {
    var iframe_name = 'query_download_iframe_'+(new Date()).getTime();
    try {
        new_iframe = document.createElement('<iframe name="'+iframe_name+'">');
        new_iframe.style.display = 'none';
    }
    catch (e) {
        new_iframe = document.createElement('iframe');
        new_iframe.setAttribute('name', iframe_name);
        new_iframe.style.width  = '1px';
        new_iframe.style.height = '1px';
        new_iframe.style.border = '0px';
        new_iframe.style.left = '-1000px';
        new_iframe.style.position = 'absolute';
    }
    new_iframe.setAttribute('src', Solstice.getDocumentBase() + '/content/blank.html');
    new_iframe.setAttribute('tabindex', '-1');
    document.getElementById('solstice_app_form').appendChild(new_iframe);

    iframe = window[iframe_name];

    this._current_iframe = iframe;
};

QueryBase.prototype._getDownloadIFrame = function() {
    var iframe = this._current_iframe;

    return iframe;
};

QueryBase.prototype._highlightName = function(ev) {
    $(slash_selector("#"+this.id+"_name_container")).addClass("hover");
};

QueryBase.prototype._removeNameHighlight = function(ev) {
    $(slash_selector("#"+this.id+"_name_container")).removeClass("hover");
};

QueryBase.prototype._resetNameContainer = function() {
    // This is to prevent table renaming until we sort out behavior post release 1
    return;

};

QueryBase.prototype._cancelReplace = function() {
    this._overwrite_panel.hide();
};

QueryBase.prototype._replaceTable = function() {
    this._saveNewName();
    this._overwrite_panel.hide();
};


QueryBase.prototype._saveNewName = function() {
    var original_name = this._getObjectName();
    this._setObjectName(this._new_name);
    var name = this._getObjectName();
    this._new_name = null;
    this.AsyncPOST(this._getRestRoot()+"/proxy/REST.svc/v2/db/"+this._getObjectType()+"/"+this._model.owner+"/"+name, this._model, this._postSaveName);
}

QueryBase.prototype._postSaveName = function(o) {
    var obj_type = this._getObjectType();
    if (o.code == 201) {
        var owner = this._model.owner;
        var name = this._model.name;

        $.History.go("s="+obj_type+'/'+owner+'/'+name);
        Solstice.Message.setSuccess(Solstice.Lang.getMessage('SQLShare', obj_type+'_renamed'));
    }
    else {
        Solstice.Message.setError(Solstice.Lang.getMessage('SQLShare', obj_type+'_rename_failed'));
        if (window.console) {
            window.console.log(o);
        }
    }
};

QueryBase.prototype._resetDescriptionContainer = function() {
    if (!document.getElementById("js-description-container")) {
        return;
    }

    var view = new SQLShare.View.SavedQuery.DescriptionArea(this._model);
    document.getElementById('js-description-container').innerHTML = view.toString();
    view.postRender();

    $(slash_selector("#"+this.id+"_description_container")).removeClass("hover");

    var me = this;

    $(slash_selector("#"+this.id+'_description_container')).on("mouseover", function(ev) {
        me._highlightDescription(ev);
    });
    $(slash_selector("#"+this.id+'_description_container')).on("mouseout", function(ev) {
        me._removeDescriptionHighlight(ev);
    });
    $(slash_selector("#"+this.id+'_description_container')).on("click", function(ev) {
        me._openDescriptionDialog(ev);
    });

    $("#description_tags_dialog").dialog("close");
};

QueryBase.prototype._highlightDescription = function(ev) {
    $(slash_selector("#"+this.id+"_description_container")).addClass("hover");
};

QueryBase.prototype._removeDescriptionHighlight = function(ev) {
    $(slash_selector("#"+this.id+"_description_container")).removeClass("hover");
};

QueryBase.prototype._openDescriptionDialog = function(ev) {
    var query = this._model;

    $(slash_selector("#"+this.id+'_description_container')).off("mouseover");
    $(slash_selector("#"+this.id+'_description_container')).off("mouseout");
    $(slash_selector("#"+this.id+'_description_container')).off("click");

    if (!$("#description_tags_dialog").length) {
        $("body").append("<div id='description_tags_dialog'></div>");
    }

    $("#description_tags_dialog").dialog({
        modal: true,
        title: Solstice.Lang.getString('SQLShare', 'edit_dataset_description_tags'),
        width: '640px'
    });

    var view = this._getChangeDescriptionView();
    var body = view.toString();

    $("#description_tags_dialog").html(view.toString());
    window.setTimeout(function() {
        $("#description_tags_dialog").dialog("option", "position", "center");
    }, 0);

    this._removeDescriptionHighlight();
    view.postRender();

    var me = this;

    $(slash_selector("#"+this.id+'_save_description')).on("click", function(ev) {
        me._beginDescriptionSave(ev);
    });
    $(slash_selector("#"+this.id+'_cancel_description')).on("click", function(ev) {
        me._cancelDescriptionSave(ev);
    });
};

getQuerySetTags = function(query) {
    var raw_tags = query.tags;
    var is_dataset_owner = false;

    if (query.owner == solstice_user.login_name) {
        is_dataset_owner = true;
    }


    var tag_hash = {};
    for (var pc = 0; pc < raw_tags.length; pc++) {
        var person_tags = raw_tags[pc].tags;
        var owner = raw_tags[pc].name;

        var view_only = true;
        if (owner == solstice_user.login_name || is_dataset_owner) {
            view_only = false;
        }

        for (var t = 0; t < person_tags.length; t++) {
            tag_hash[person_tags[t]] = {
                view_only: view_only
            };

        }
    }

    return tag_hash;
}

QueryBase.prototype._cancelDescriptionSave = function(ev) {
    ev.preventDefault();
    var container = document.getElementById(this.id+'_description_container');

    var obj_name = this._getObjectDescription();
    container.innerHTML = obj_name.encodeHTML();

    this._resetDescriptionContainer();
};

QueryBase.prototype._beginDescriptionSave = function(ev) {
    if (this._model.owner == solstice_user.login_name) {
        var new_description = document.getElementById(this.id+'_description').value;

        if (new_description == this._getObjectDescription()) {
            this._saveTags();
            return;
        }

        this._setObjectDescription(new_description);

        var container = document.getElementById(this.id+'_description_container');
        container.innerHTML = new_description.encodeHTML();
        this.AsyncPUT(this._getRestRoot()+"/proxy/v3/db/"+this._getURIFragment(), this._model, this._saveTags);
    }
    else {
        this._saveTags();
    }
};

QueryBase.prototype._saveTags = function(o) {
    var data = this._getNewTagData();

    if (data.is_changed) {
        this.AsyncPUT(this._getRestRoot()+"/proxy/v3/db/"+this._getURIFragment()+"/tags", data.tags, this._postSaveDescription, data.tags);
    }
    else {
        return this._postSaveDescription({ code: 200 }, data.tags);
    }

};

QueryBase.prototype._postSaveDescription = function(o, tags) {
    if (o.code == 200) {
        this._model.tags = tags;
        (new SQLShare()).drawSidebarLists();
    }
    this._resetDescriptionContainer();
};

QueryBase.prototype._togglePublic = function() {
    this._model.is_public = !this._model.is_public;
    this.AsyncPUT(this._getRestRoot()+"/proxy/REST.svc/v2/db/"+this._getURIFragment(), this._model, this._postTogglePublic);
};

QueryBase.prototype._postTogglePublic = function(o) {
    // override in subclasses...
}

QueryBase.prototype._processQuery = function(ev) {
    ev.preventDefault();
    this.abortCurrentRequest();
    var query = this._editor.getCode();
    Solstice.Element.show('new_query_preview_panel');
    Solstice.Element.hide('dataset_preview_header');

    $(document).trigger("sqlshare_content_change");

    this._renderTo(this.id+"_results", 'query/running.html', {});
    // Should this be configurable anywhere?
    var max_rows = SQLShare.Constants.MAX_PREVIEW_ROWS;
    this.setCurrentRequest(this.AsyncPOST(this._getRestRoot()+"/proxy/REST.svc/v2/db", { sql: query, max_records: max_rows, sleep: 0 }, this._postQuery));
};

QueryBase.prototype._postQuery = function(o) {
    if (o.code == 202) {
        var new_location = o.conn.getResponseHeader('Location');
        var full_url = new_location;
        this._full_url = full_url;
        this.AsyncGET(full_url, this._postInitialRedirect);
    }
    else {
        var error;
        if (o.data) {
            error = o.data.error;
        }
        if (o.code == 414) {
            error = Solstice.Lang.getString('SQLShare', 'error_query_too_long');
        }
        if (error == "") {
            error = Solstice.Lang.getString('SQLShare', 'error_query_generic');
        }
        this._renderTo(this.id+"_results", "query/error.html", { error: error });
    }
};

QueryBase.prototype._postInitialRedirect = function(o) {
    var query = this;
    var full_url = this._full_url;
    if (o.code == 202) {
        this.setResultsTimeout(window.setTimeout(function() { query._waitForQueryResults(full_url, 1) }, 2000));
    }
    else if (o.code == 200) {
        this._finishQuery(o.data);
    }
    else {
        if (o.data) {
            error = o.data.error;
        }
        if (o.code == 414) {
            error = Solstice.Lang.getString('SQLShare', 'error_query_too_long');
        }
        if (error == "") {
            error = Solstice.Lang.getString('SQLShare', 'error_query_generic');
        }
        this._renderTo(this.id+"_results", "query/error.html", { error: error });
    }

}

QueryBase.prototype._waitForQueryResults = function(full_url, count) {
    this.AsyncGET(full_url, this._postWaitForQueryResults, { count: count });
};

QueryBase.prototype._cancelQuery = function(ev) {
    var matches = this._full_url.match(/([0-9]+)$/);
    var process_id = matches[0];

    this.AsyncDELETE(this._getRestRoot()+'/proxy/REST.svc/v2/db/process/'+process_id, this._postDelete);
};

QueryBase.prototype._postDelete = function(o) {
    if (o.code == 410) {
        this.clearResultsTimeout();
        Solstice.Element.hide('new_query_preview_panel');

        Solstice.Message.setSuccess(Solstice.Lang.getMessage('SQLShare', 'queued_query_cancelled'));
    }
};

QueryBase.prototype._postWaitForQueryResults = function(o, args) {
    var count = args.count;
    if (count == 1) {
        Solstice.Element.show('query_in_queue');
    }
    var full_url = this._full_url;
    if (o.code == 202) {
        var query = this;
         this.setResultsTimeout(window.setTimeout(function() { query._waitForQueryResults(full_url, count + 1) }, 5000));
    }
    else if (o.code == 200) {
        this._finishQuery(o.data);
    }
    else {
        var error;
        if (o.data) {
            error = o.data.error;
        }
        if (o.code == 414) {
            error = Solstice.Lang.getString('SQLShare', 'error_query_too_long');
        }
        if (error == "") {
            error = Solstice.Lang.getString('SQLShare', 'error_query_generic');
        }
        this._renderTo(this.id+"_results", "query/error.html", { error: error });
    }
};

QueryBase.prototype._finishQuery = function(data) {
    var header = document.getElementById('dataset_preview_header');
    if (header) {
        document.getElementById('preview_total_rows').innerHTML = data.rows_total;
        if (data.rows_total < SQLShare.Constants.MAX_PREVIEW_ROWS) {
            document.getElementById('preview_max_rows').innerHTML = data.rows_total;
        }
        else {
            document.getElementById('preview_max_rows').innerHTML = SQLShare.Constants.MAX_PREVIEW_ROWS;
            document.getElementById('preview_total_rows').innerHTML = Solstice.Lang.getString('SQLShare', 'preview_found_max_hits', { max: SQLShare.Constants.MAX_PREVIEW_ROWS });
        }
        var column_count = data.columns.length;
        document.getElementById('preview_total_cols').innerHTML = column_count;
        if (column_count < SQLShare.Constants.MAX_PREVIEW_COLS) {
            document.getElementById('preview_max_cols').innerHTML = column_count;
        }
        else {
            document.getElementById('preview_max_cols').innerHTML = SQLShare.Constants.MAX_PREVIEW_COLS;
        }


        Solstice.Element.show('dataset_preview_header');
    }

    var cols = [];
    var len = data.columns.length;
    for (var i = 0; i < len; i++) {
        cols.push(data.columns[i].name);
    }

    this._drawTable(this.id+"_results", cols, data.sample_data);
};

QueryBase.prototype._saveQueryAs = function() {
    if (!$("#save_query_dialog").length) {
        $("body").append("<div id='save_query_dialog'></div>");
    }

    $("#save_query_dialog").dialog({
        modal: true,
        width: '440px',
        title: Solstice.Lang.getString('SQLShare', 'save_query_title')
    });


    var description;
    var name;
    var is_public;
    if (this._model) {
        description = this._model.description;
        name = this._model.name;
        is_public = this._model.is_public;
    }
    var view = new SQLShare.View.Query.SavePanel({
        id: this.id,
        description: description,
        name: name,
        is_public: is_public
    });

    $("#save_query_dialog").html(view.toString());

    window.setTimeout(function() {
        $("#save_query_dialog").dialog("option", "position", "center");
    }, 0);

    view.postRender();
    this._save_panel_view = view;

    var me = this;

    $("#"+this.id+'_save').on("click", function(ev) {
        me._save(ev);
    });
    $("#"+this.id+'_cancel').on("click", function(ev) {
        me._cancelSaveAs(ev);
    });
};

QueryBase.prototype._cancelSaveAs = function(ev) {
    if (ev) {
        ev.preventDefault();
    }

    $("#save_query_dialog").dialog("close");
};

QueryBase.prototype._save = function() {
    var name = document.getElementById(this.id+"_query_name").value;
    var description = document.getElementById(this.id+"_query_desc").value;


    if (name.match(/[^a-z0-9!@$%^&\*\(\)_\-={}\|;:'",\.<> ]/i)) {
        Solstice.Element.show(this.id+"_query_name_error");
        return;
    }

    var is_public = false;
    if (document.getElementById(this.id+"_is_public_check").checked) {
        is_public = true;
    }

    var query;
    if (this._editor) {
        query = this._editor.getCode();
    }
    else {
        query = this._query;
    }


    var is_snapshot = false;
    if (this._model && this._model.is_snapshot) {
        is_snapshot = true;
        query = this._model.sql_code;
    }

    this.AsyncPUT(this._getRestRoot()+"/proxy/v3/db/dataset/"+solstice_user.sqlshare_schema+"/"+encodeURIComponent(name),
        {
            sql_code: query,
            description: description,
            is_public: is_public,
            is_snapshot: is_snapshot
        }, this._postSave);
};

QueryBase.prototype._postSave = function(o) {
    if (o.code == 201 || o.code == 200) {
        var tags = $("#new_query_tags").tagit("assignedTags");
        if (tags) {
            this.AsyncPUT(this._getRestRoot()+"/proxy/v3/db/dataset/"+solstice_user.sqlshare_schema+"/"+o.data.name+"/tags", [{"name":solstice_user.sqlshare_schema, "tags":tags }], this._postSaveTags, o);
        }
        else {
            this._postSaveAs(o);
        }
    }
    else {
        Solstice.Message.setError(Solstice.Lang.getMessage('SQLShare', 'error_saving_query'));
    }
};


QueryBase.prototype._postSaveTags = function(o, first_response) {
    if (o.code == 201 || o.code == 200) {
        this._postSaveAs(first_response);
    }
    else {
        Solstice.Message.setError(Solstice.Lang.getMessage('SQLShare', 'error_saving_query'));
    }
};

QueryBase.prototype._getNewTagData = function() {
    var has_change = false;
    var is_dataset_owner = false;

    if (this._model.owner == solstice_user.login_name) {
        is_dataset_owner = true;
    }

    var starting_tags = this._model.tags;

    var starting_tag_hash = {};
    for (var pc = 0; pc < starting_tags.length; pc++) {
        var person_tags = starting_tags[pc].tags;
        var owner = starting_tags[pc].name;

        for (var t = 0; t < person_tags.length; t++) {
            starting_tag_hash[person_tags[t]] = true;
        }
    }

    var current_tags = $("#query_tags").tagit("assignedTags");
    var current_tag_hash = {};

    var new_tags_for_user = [];
    for (var i = 0; i < current_tags.length; i++) {
        var tag = current_tags[i];
        current_tag_hash[tag] = true;

        if (!starting_tag_hash[tag]) {
            has_change = true;
            new_tags_for_user.push(tag);
        }
    }

    var return_tags = [];

    for (var pc = 0; pc < starting_tags.length; pc++) {
        var person_tags = starting_tags[pc].tags;
        var owner = starting_tags[pc].name;

        if (owner == solstice_user.login_name) {
            for (var t = 0; t < person_tags.length; t++) {
                var tag = person_tags[t];
                if (!current_tag_hash[tag]) {
                    has_change = true;
                }
                else {
                    new_tags_for_user.push(tag);
                }
            }
        }
        else {
            if (is_dataset_owner) {
                var new_user_tags = [];
                for (var t = 0; t < person_tags.length; t++) {
                    var tag = person_tags[t];
                    if (!current_tag_hash[tag]) {
                        has_change = true;
                    }
                    else {
                        new_user_tags.push(tag);
                    }
                }
                return_tags.push({
                    name: owner,
                    tags: new_user_tags
                });
            }
            else {
                return_tags.push(starting_tags[pc]);
            }
        }
    }

    return_tags.push({
        name: solstice_user.login_name,
        tags: new_tags_for_user
    });

    return {
        is_changed: has_change,
        tags: return_tags
    };
};

QueryBase.prototype._getURIFragment = function() {
    return 'dataset/'+this.query_id;
};


