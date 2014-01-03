"use strict";
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
    for (var tag in tag_set) {
        datasource.push(tag);
    }

    var available_tags = [];

    if (SQLShare._ALL_TAGS) {
        for (var key in SQLShare._ALL_TAGS) {
            if (SQLShare._ALL_TAGS.hasOwnProperty(key)) {
                available_tags.push(key);
            }
        }
    }

    $("#new_query_tags").tagit({
        availableTags: available_tags,
    });

};

SQLShare.View.Query.SavePanel.prototype.getTagger = function() {
    return this._tagger;
};

