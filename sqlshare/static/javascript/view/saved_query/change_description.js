SQLShare.View.SavedQuery.ChangeDescription = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'saved_query/change_description.html';
};

SQLShare.View.SavedQuery.ChangeDescription.prototype = new SQLShare.View();

SQLShare.View.SavedQuery.ChangeDescription.prototype.generateParams = function() {
    var query = this.model;

    this.setParam('id', query.container_id);
    this.setParam('name', query.name);

    if (query.description) {
        this.setParam('description', query.description);
    }

    var tags = getQuerySetTags(this.model);

    this._tag_data = tags;

    for (var tag in tags) {
        if (tags.hasOwnProperty(tag)) {
            this.addParam('tags', { tag: tag });
        }
    }

    if (query.owner == solstice_user.login_name) {
        this.setParam('is_editable', true);
        this.setParam('is_owner', true);
    }

};

SQLShare.View.SavedQuery.ChangeDescription.prototype.postRender = function() {
    if (this.model.owner == solstice_user.login_name) {
        document.getElementById(this.model.container_id+'_description').focus();
    }

    var tags = this._tag_data;
    function keep_readonly_tags(ev, data) {
        var tag = data["tagLabel"];

        if (tags[tag] && tags[tag].view_only) {
            return false;
        }

    }

    var available_tags = [];

    if (SQLShare._ALL_TAGS) {
        for (var key in SQLShare._ALL_TAGS) {
            if (SQLShare._ALL_TAGS.hasOwnProperty(key)) {
                available_tags.push(key);
            }
        }
    }

    $("#query_tags").tagit({
        availableTags: available_tags,
        beforeTagRemoved: keep_readonly_tags
    });

};
