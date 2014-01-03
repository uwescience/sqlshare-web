"use strict";
SQLShare.View.MyQueries = function() {};

SQLShare.View.MyQueries.List = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'my_queries/list.html';
};

SQLShare.View.MyQueries.List.prototype = new SQLShare.View.QueryListBase();

SQLShare.View.MyQueries.List.prototype.generateParams = function() {
    var list = this.model;

    this.setParam('id', list.container_id);
    if (!list.length) {
        this.setParam('no_queries', true);
    }
};

SQLShare.View.MyQueries.List.prototype.postRender = function() {
    var list = this.model;
    if (list.length) {
        this._drawTable(list.container_id+"_table", list);
    }
};
