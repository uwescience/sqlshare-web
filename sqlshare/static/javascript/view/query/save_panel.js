SQLShare.View.Query.SavePanel = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'query/save_panel.html';
};

SQLShare.View.Query.SavePanel.prototype = new SQLShare.View();

SQLShare.View.Query.SavePanel.prototype.generateParams = function() {
    this.setParam('id', this.model.id);
    if (this.model.description) {
        this.setParam('description', this.model.description);
    }
    if (this.model.name) {
        this.setParam('name', this.model.name);
    }
    if (this.model.is_public) {
        this.setParam('is_public', true);
    }


};

SQLShare.View.Query.SavePanel.prototype.postRender = function() {
    var tag_set = SQLShare._ALL_TAGS || {};
    var datasource = [];
    for (tag in tag_set) {
        datasource.push(tag);
    }

    var me = this;
    YUI().use('tagger', function(Y) {
        var tags = new Y.Tagger('new_query_tag_container', {
            tags: {},
            datasource: datasource
        });
        tags.initialize();
        me._tagger = tags;
    });

};

SQLShare.View.Query.SavePanel.prototype.getTagger = function() {
    return this._tagger;
};

