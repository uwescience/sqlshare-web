"use strict";
SQLShare.View.SavedQuery.ChangeStatement = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'saved_query/change_statement.html';
};

SQLShare.View.SavedQuery.ChangeStatement.prototype = new SQLShare.View();

SQLShare.View.SavedQuery.ChangeStatement.prototype.generateParams = function() {
    var query = this.model;

    this.setParam('id', query.container_id);
    if (query.long_desc) {
        this.setParam('statement', query.sql_code);
    }
};
