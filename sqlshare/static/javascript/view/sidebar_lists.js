SQLShare.View.SidebarLists = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'sidebar_lists.html';
};

SQLShare.View.SidebarLists.prototype = new SQLShare.View();

SQLShare.View.SidebarLists.prototype.generateParams = function() {
    this._generateTagParams();
    this._generateFavoriteParams();
};

SQLShare.View.SidebarLists.prototype._generateFavoriteParams = function() {
    var list = this.model;
    list = list.sort(function(a,b) {
        return a.popularity - b.popularity
    });

    list = list.sort(function(a,b) {
        if (a.popularity > b.popularity) {
            return -1;
        }
        if (a.popularity < b.popularity) {
            return 1;
        }
        if (a.name > b.name) {
            return 1;
        }
        if (a.name < b.name) {
            return -1;
        }
        return 0;
    });

    var max = 5;
    if (max > list.length) {
        max = list.length;
    }

    for (var i = 0; i < max; i++) {
        var item = list[i];
        if (item.popularity > 0) {
            this.addParam('popular_datasets', {
                name: unescape(item.name).encodeHTML(),
                url: "sqlshare/#s=query/"+item.owner.encodeHTML()+"/"+item.name.encodeHTML(),
                popularity: item.popularity
            });
        }
    }

};

SQLShare.View.SidebarLists.prototype._generateTagParams = function() {
    var list = this.model;
    var all_tags = {};
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        var raw_tags = item.tags;

        var tag_hash = {};
        for (var pc = 0; pc < raw_tags.length; pc++) {
            var person_tags = raw_tags[pc].tags;
            for (var t = 0; t < person_tags.length; t++) {
                var tag = person_tags[t];
                if (!all_tags[tag]) {
                    all_tags[tag] = 1;
                }
                else {
                    all_tags[tag]++;
                }
            }
        }
    }

    SQLShare._ALL_TAGS = all_tags;

    var tag_list = [];
    for (tag in all_tags) {
        tag_list.push(tag);
    }

    tag_list = tag_list.sort(function(a, b) {
        if (all_tags[a] < all_tags[b]) {
            return 1;
        }
        if (all_tags[a] > all_tags[b]) {
            return -1;
        }
        return 0;
    });

    var max_tag = tag_list.length;

    for (var i = 0; i < max_tag; i++) {
        this.addParam('tags', {
            name: tag_list[i].encodeHTML(),
            url_name: encodeURIComponent(tag_list[i]),
            count: all_tags[tag_list[i]]
        });
    }

};



