"use strict";
SQLShare.View.SavedQuery = function(model) {
    SQLShare.View.call(this, model);

    if (model.container_id.match(/^[0-9]+$/)) {
        this.template = 'saved_query/in_process.html';
    }
    else {
        this.template = 'saved_query/display.html';
    }
};

SQLShare.View.SavedQuery.prototype = new SQLShare.View();

SQLShare.View.SavedQuery.prototype.generateParams = function() {
    var query = this.model;

    var description_view = new SQLShare.View.SavedQuery.DescriptionArea(query);
    this.setParam('description_area', description_view.toString());
    description_view.postRender();

    var statement = query.sql_code;

    // This is a little bit hackey - but seemed better than a global var/event to track it
    if (document.getElementById('ss_editor_col').offsetWidth) {
        this.setParam('edit_disabled', true);
    }

    this.setParam('id', query.container_id);

    if (!query.container_id.match(/^[0-9]+$/)) {

        this.setParam('name', query.name);
        this.setParam('description', Solstice.String.newlinesToBreaks(query.description));
        this.setParam('owner', query.owner);
    }
    this.setParam('statement', statement);

    this._addDateParams(new Date(query.date_modified), 'mod_date');

    if (query.is_public) {
        this.setParam('is_public', true);
    }
    if (query.is_shared) {
        this.setParam('is_shared', true);
    }

    if (query.owner == solstice_user.login_name) {
        this.setParam('is_editable', true);
        this.setParam('is_owner', true);
    }

    for (var i in query.columns) {
        var column = query.columns[i];
        this.addParam('columns', {
            name    : column.name,
            db_type : column.dbtype
        });
    }

    for (var i in query.sample_data) {
        var row = query.sample_data[i];
        var params = [];
        for (var j in row) {
            var val = row[j];
            if (typeof(val) != 'string') {
                val = ""+val;
            }
            params.push({ value: val });
        }
        this.addParam('rows', { values: params });
    }

};

SQLShare.View.SavedQuery.prototype.postRender= function() {
    var query = this.model.sql_code;
    var matches = query.match(/\r\n|\r|\n/g);

    // padding on the div
    var baseline = 20;
    var height_per_line = 17;

    var height;
    if (matches) {
        height = baseline + (matches.length * height_per_line);
    }
    else {
        height = 35;
    }
    if (height > 150) {
        height = 150;
    }

    if (!this.model.container_id.match(/^[0-9]+$/)) {
        this._editor = CodeMirror.fromTextArea(this.model.container_id+'_sql_display', {
            textWrapping: false,
            parserfile: "parsesql.js",
            stylesheet: solstice_document_base+"/static/styles/sqlcolors.css",
            path: solstice_document_base+'/static/javascript/codemirror/',
            readOnly: true,
            height: height+'px'
        });
    }

    this._addAccessTooltips();
};
