"use strict";
SQLShare.View.SavedQuery.Edit = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'saved_query/edit.html';
};

SQLShare.View.SavedQuery.Edit.prototype = new SQLShare.View();

SQLShare.View.SavedQuery.Edit.prototype.generateParams = function() {
    var query = this.model;

    var statement = query.sql_code;
//    statement = Solstice.String.newlinesToBreaks(statement);

    var url = query.url;
    if (url) {
        url = url.replace(/^\/v3\/db\/dataset/, 'query');
        this.setParam('url', url);
        this.setParam('id', query.container_id);
        if (!query.container_id.match(/^[0-9]+$/)) {
            this.setParam('name', query.name);
            this.setParam('description', query.description);

            this.setParam('owner', query.owner);
            this.setParam('date_modified', query.date_modified);
        }
    }
    else {
        this.setParam('id', query.container_id);
    }

    this.setParam('statement', statement);
    if (query.is_public) {
        this.setParam('is_public', true);
    }

    if (query.owner == solstice_user.login_name) {
        this.setParam('is_saveable', true);
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

