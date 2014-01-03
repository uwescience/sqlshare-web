"use strict";
SQLShare.View.SavedQuery.Rename = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'saved_query/rename.html';
};

SQLShare.View.SavedQuery.Rename.prototype = new SQLShare.View();

SQLShare.View.SavedQuery.Rename.prototype.generateParams = function() {
    var query = this.model;

    this.setParam('id', query.container_id);
    this.setParam('name', query.name);
};
