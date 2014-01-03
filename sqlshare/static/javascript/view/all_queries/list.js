"use strict";
SQLShare.View.AllQueries = function() {};

SQLShare.View.AllQueries.List = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'all_queries/list.html';
};

SQLShare.View.AllQueries.List.prototype = new SQLShare.View.QueryListBase();

SQLShare.View.AllQueries.List.prototype.generateParams = function() {
    var list = this.model;

    this.setParam('id', list.container_id);
    if (!list.length) {
        this.setParam('no_queries', true);
    }
};

SQLShare.View.AllQueries.List.prototype.postRender = function() {
    var list = this.model;
    if (list.length) {
        this._drawTable(list.container_id+"_table", list);
    }
};

