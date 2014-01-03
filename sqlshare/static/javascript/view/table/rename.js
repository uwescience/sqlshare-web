"use strict";
SQLShare.View.Table.Rename = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'table/rename.html';
};

SQLShare.View.Table.Rename.prototype = new SQLShare.View();

SQLShare.View.Table.Rename.prototype.generateParams = function() {
    var table = this.model;

    this.setParam('id', table.container_id);
    this.setParam('name', table.tablename);
};
