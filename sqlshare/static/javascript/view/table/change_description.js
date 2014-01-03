"use strict";
SQLShare.View.Table.ChangeDescription = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'table/change_description.html';
};

SQLShare.View.Table.ChangeDescription.prototype = new SQLShare.View();

SQLShare.View.Table.ChangeDescription.prototype.generateParams = function() {
    var table = this.model;

    this.setParam('id', table.container_id);
    if (table.description) {
        this.setParam('description', table.description);
    }
};
