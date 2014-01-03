"use strict";
SQLShare.View.SavedQuery.Deleting = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'saved_query/deleting.html';
};

SQLShare.View.SavedQuery.Deleting.prototype = new SQLShare.View();

SQLShare.View.SavedQuery.Deleting.prototype.generateParams = function() {
    var query = this.model;

    this.setParam('id', query.container_id);

    this.setParam('name', query.name);
};
