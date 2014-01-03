"use strict";
"use strict";
SQLShare.View.SavedQuery.DescriptionArea = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'saved_query/description_area.html';
};

SQLShare.View.SavedQuery.DescriptionArea.prototype = new SQLShare.View();

SQLShare.View.SavedQuery.DescriptionArea.prototype.generateParams = function() {
    var query = this.model;

    var raw_tags = query.tags;

    if (query.owner == solstice_user.login_name) {
        this.setParam('is_editable', true);
        this.setParam('is_owner', true);
    }


    if (raw_tags) {
        var tag_hash = {};
        for (var pc = 0; pc < raw_tags.length; pc++) {
            var person_tags = raw_tags[pc].tags;
            for (var t = 0; t < person_tags.length; t++) {
                tag_hash[person_tags[t]] = true;
            }
        }

        var tags = [];
        for (var tag in tag_hash) {
            tags.push(tag);
        }

        tags = tags.sort(function(a, b) {
            if (a.toLowerCase() < b.toLowerCase()) {
                return -1;
            }
            if (a.toLowerCase() > b.toLowerCase()) {
                return 1;
            }
            return 0;
        });
        for (var i = 0; i < tags.length; i++) {
            this.addParam('tags', {
                name: tags[i]
            });
        }
    }

    if (!query.container_id.match(/^[0-9]+$/)) {
        this.setParam('description', Solstice.String.newlinesToBreaks(query.description));
    }

    this.setParam('id', query.container_id);
};

SQLShare.View.SavedQuery.DescriptionArea.prototype.postRender = function() {
};

