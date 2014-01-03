var Navigation = function(id) {
    this.id = id;
    this.element = document.getElementById(id);
    this._init();
};

Navigation.prototype = new SSBase();

Navigation.prototype.getCurrentState = function() {
    var matches = window.location.hash.match(/^#s=([^&]+)/);
    if (matches) {
        return matches[1];
    }
    return;
}

Navigation.prototype._init = function() {
    var me = this;
    $("#ss_sidebar_content").on("click", function(ev) {
        me._processNavigation(ev);
    });
};

Navigation.prototype._processNavigation = function(ev) {
    var target = ev.target;
    // IE isn't having it
    if (!target) {
        return;
    }
    var rel = target.rel;

    this.abortCurrentRequest();

    if (rel) {
        if (this.getCurrentState() == rel) {
            this.loadState(rel);
            ev.preventDefault();
        }
    }
};

Navigation.prototype._loadSavedQuery = function(parts) {
    var path = parts.join('/');
    this._highlightLeftNav();
    var title = Solstice.Lang.getString("SQLShare", "page_title_display_query");
    $(document).trigger("sqlshare_navigation", title, "query/"+path);

    var query_parts = [];
    for (var i = 0; i < parts.length; i++) {
        query_parts[i] = parts[i];
    }

    $(document).trigger("saved_query", [[query_parts.join('/')]]);
};

Navigation.prototype._loadTaggedQueries = function(parts) {
    var tag = parts[0];
    var title = Solstice.Lang.getString("SQLShare", "page_title_display_tag", {
        tag: tag
    });
    $(document).trigger("sqlshare_navigation", title, "tag/"+tag);

    this._highlightTag(tag);
    this._highlightLeftNav('popular_tag_'+tag);

    $(document).trigger("tagged_queries", [[tag]]);
};

Navigation.prototype._highlightTag = function(tag) {
    if (document.getElementById('check_tagging_sidebar')) {
        this._highlightLeftNav('popular_tag_'+tag);
    }
    else {
        var me = this;
        window.setTimeout(function() {
            me._highlightTag(tag);
        }, 1000);
    }
};

Navigation.prototype._loadRecentQueries = function(ev) {
};

Navigation.prototype._allQueriesNav = function() {
    var title = Solstice.Lang.getString("SQLShare", "page_title_all_queries");
    $(document).trigger("sqlshare_navigation", title, "all_queries");
};

Navigation.prototype._sharedQueriesNav = function() {
    var title = Solstice.Lang.getString("SQLShare", "page_title_shared_queries");
    $(document).trigger("sqlshare_navigation", title, "shared_queries");
};


Navigation.prototype._loadAllQueries = function(ev) {
    $(document).trigger("all_queries");
    this._highlightLeftNav('all_queries_li');
};

Navigation.prototype._loadSharedQueries = function(ev) {
    $(document).trigger("shared_queries");
    this._highlightLeftNav('shared_queries_li');
};



Navigation.prototype.loadState = function(state) {
    var parts = state.split('/');
    var top_level = parts.shift();

    this.abortCurrentRequest();
    Solstice.Message.clear();

    switch(top_level) {
        case 'home':
            this._loadHome(null, parts);
            break;
        case 'query':
            if (parts && parts.length) {
                this._loadSavedQuery(parts);
            }
            else {
                this._newQuery(true);
            }
            break;
        case 'tag':
            if (parts && parts.length) {
                this._loadTaggedQueries(parts);
            }
            else {
                this._loadHome(null);
            }
            break;
        case 'querylist':
            this._queryQueue(true);
            break;
        case 'file':
            this._chooseUpload(true);
            break;
        case 'all_queries':
            this._loadAllQueries(null, parts);
            break;
        case 'shared':
            this._loadSharedQueries(null, parts);
            break;
        case 'recent':
            this._loadRecentQueries(null, parts);
            break;
        case 'table':
            this._loadTable(parts);
            break;
        case 'credentials':
            this._loadCredentials(true);
            break;
        default:
            // ... invalid state
            this._loadHome();
    }
};

Navigation.prototype._loadHome = function(event, args) {
    var title = Solstice.Lang.getString("SQLShare", "page_title_home");
    $(document).trigger("sqlshare_navigation", title, "home");
    $(document).trigger("home_state");
    this._highlightLeftNav('your_queries_li');
};

Navigation.prototype._newQueryNav = function(fire_event) {
    this._newQuery(fire_event);
    if (this.getCurrentState() == "query") {
        $(document).trigger("new_query");
    }
}

Navigation.prototype._newQuery = function(fire_event) {
    // Update navigation state?
    var title = Solstice.Lang.getString("SQLShare", "page_title_new_query");
    $(document).trigger("sqlshare_navigation", title, "query");
    this._highlightLeftNav('new_query_li');
    if (fire_event) {
        $(document).trigger("new_query");
    }
};

Navigation.prototype._loadCredentials = function(fire_event) {
    // Update navigation state?
    var title = Solstice.Lang.getString("SQLShare", "page_title_rest_credentials");
    $(document).trigger("sqlshare_navigation", title, "credentials");
    if (fire_event) {
        $(document).trigger("load_credentials");
    }
};

Navigation.prototype._queryQueueNav = function(fire_event) {
    this._queryQueue(fire_event);
    if (this.getCurrentState() == "querylist") {
        $(document).trigger("query_queue");
    }
}


Navigation.prototype._queryQueue = function(fire_event) {
    // Update navigation state?
    var title = Solstice.Lang.getString("SQLShare", "page_title_query_list");
    $(document).trigger("sqlshare_navigation", title, "querylist");
    this._highlightLeftNav('query_list_li');
    if (fire_event) {
        $(document).trigger("query_queue");
    }
};


Navigation.prototype._chooseUploadNav = function(fire_event) {
    this._chooseUpload(fire_event);
    if (this.getCurrentState() == "file") {
        $(document).trigger("choose_upload");
    }
};

Navigation.prototype._chooseUpload = function(fire_event) {
    // Update navigation state?
    var title = Solstice.Lang.getString("SQLShare", "page_title_upload_file");
    $(document).trigger("sqlshare_navigation", title, "file");
    this._highlightLeftNav('new_upload_li');
    if (fire_event) {
        $(document).trigger("choose_upload");
    }
};

Navigation.prototype._highlightLeftNav = function(new_active) {
    if (this._current_highlight) {
        $("#"+this._current_highlight).removeClass("active");
        this._current_highlight = null;
    }
    if (new_active) {
        $("#"+new_active).addClass("active");
        this._current_highlight = new_active;
    }
};
