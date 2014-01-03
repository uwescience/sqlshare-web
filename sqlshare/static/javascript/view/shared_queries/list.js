"use strict";
SQLShare.View.SharedQueries = function() {};

SQLShare.View.SharedQueries.List = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'shared_queries/list.html';
};

SQLShare.View.SharedQueries.List.prototype = new SQLShare.View.QueryListBase();

SQLShare.View.SharedQueries.List.prototype.generateParams = function() {
    var list = this.model;

    this.setParam('id', list.container_id);
    if (!list.length) {
        this.setParam('no_queries', true);
    }
};

SQLShare.View.SharedQueries.List.prototype.postRender = function() {
    var list = this.model;
    if (list.length) {
        this._drawTable(list.container_id+"_table", list);
    }
};

