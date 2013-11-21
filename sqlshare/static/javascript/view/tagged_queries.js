SQLShare.View.TaggedQueries = function() {};

SQLShare.View.TaggedQueries.List = function(model, tag) {
    SQLShare.View.call(this, model);
    this.tag = tag;
    this.template = 'tagged_queries/list.html';
};

SQLShare.View.TaggedQueries.List.prototype = new SQLShare.View.QueryListBase();

SQLShare.View.TaggedQueries.List.prototype.generateParams = function() {
    var list = this.model;

    this.setParam('tag', this.tag);
    this.setParam('id', list.container_id);
    if (!list.length) {
        this.setParam('no_queries', true);
    }
};

SQLShare.View.TaggedQueries.List.prototype.postRender = function() {
    var list = this.model;
    if (list.length) {
        this._drawTable(list.container_id+"_table", list);
    }
};
