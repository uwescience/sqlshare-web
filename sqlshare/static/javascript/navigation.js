var Navigation = function(id) {
    this.id = id;
    this.element = document.getElementById(id);
    this._init();
};

Navigation.prototype = new SSBase();

Navigation.prototype._init = function() {
    YAHOO.util.Event.addListener('ss_sidebar_content', "click", this._processNavigation, this, true);
    YAHOO.util.Event.addListener("recent_queries", "click", this._recentQueriesNav, this, true);

    YAHOO.util.Event.addListener("favorite_queries", "click", this._favoriteQueriesNav, this, true);

    this.onNewQuery = new YAHOO.util.CustomEvent("onNewQuery");
    this.onQueryQueue = new YAHOO.util.CustomEvent("onQueryQueue");
    this.onChooseUpload = new YAHOO.util.CustomEvent("onChooseUpload");
    this.onHomeState = new YAHOO.util.CustomEvent("onHomeState");
    this.onAllTables = new YAHOO.util.CustomEvent("onAllTables");
    this.onAllQueries = new YAHOO.util.CustomEvent("onAllQueries");
    this.onSharedQueries = new YAHOO.util.CustomEvent("onSharedQueries");
    this.onRecentQueries = new YAHOO.util.CustomEvent("onRecentQueries");
    this.onFavoriteQueries = new YAHOO.util.CustomEvent("onFavoriteQueries");
    this.onTableView = new YAHOO.util.CustomEvent("onTableView");
    this.onSavedQueryView = new YAHOO.util.CustomEvent("onSavedQueryView");
    this.onTaggedQueriesView = new YAHOO.util.CustomEvent("onTaggedQueriesView");
    this.onLoadCredentials = new YAHOO.util.CustomEvent("onLoadCredentials");
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
        if (YAHOO.util.History.getCurrentState('s') == rel) {
            this.loadState(rel);
            YAHOO.util.Event.stopEvent(ev);
        }
    }

    return;
    var option = dd.options[dd.selectedIndex];
    if (option.className == 'new_query') {
        this._newQueryNav();
    }
    else if (option.className == 'upload_file') {
        this._chooseUploadNav();
    }
    dd.selectedIndex = 0;
};

Navigation.prototype._allTablesNav = function() {
    var title = Solstice.Lang.getString("SQLShare", "page_title_all_tables");
    SQLShare.onNavigate.fire(title, "all_tables");
};

Navigation.prototype._loadAllTables = function(ev) {
    this.onAllTables.fire();
};

Navigation.prototype._loadTable = function(parts) {
    var path = parts.join('/');
    var title = Solstice.Lang.getString("SQLShare", "page_title_display_table");
    SQLShare.onNavigate.fire(title, "table/"+path);

    this.onTableView.fire(path);
};

Navigation.prototype._loadSavedQuery = function(parts) {
    var path = parts.join('/');
    this._highlightLeftNav();
    var title = Solstice.Lang.getString("SQLShare", "page_title_display_query");
    SQLShare.onNavigate.fire(title, "query/"+path);

    var query_parts = [];
    for (var i = 0; i < parts.length; i++) {
        query_parts[i] = encodeURIComponent(parts[i]);
    }

    this.onSavedQueryView.fire(query_parts.join('/'));
};

Navigation.prototype._loadTaggedQueries = function(parts) {
    var tag = parts[0];
    var title = Solstice.Lang.getString("SQLShare", "page_title_display_tag", {
        tag: tag
    });
    SQLShare.onNavigate.fire(title, "tag/"+tag);

    this._highlightTag(tag);
    this._highlightLeftNav('popular_tag_'+tag);

    this.onTaggedQueriesView.fire(tag);
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

Navigation.prototype._recentQueriesNav = function(ev) {
//    new RecentQueries(ev, ...
//    var title = Solstice.Lang.getString("SQLShare", "page_title_recent_queries");
//    SQLShare.onNavigate.fire(title, "recent");
    this.onRecentQueries.fire(ev);
};

Navigation.prototype._loadRecentQueries = function(ev) {
};

Navigation.prototype._favoriteQueriesNav = function(ev) {
    this.onFavoriteQueries.fire(ev);
};

Navigation.prototype._allQueriesNav = function() {
    var title = Solstice.Lang.getString("SQLShare", "page_title_all_queries");
    SQLShare.onNavigate.fire(title, "all_queries");
};

Navigation.prototype._sharedQueriesNav = function() {
    var title = Solstice.Lang.getString("SQLShare", "page_title_shared_queries");
    SQLShare.onNavigate.fire(title, "shared_queries");
};


Navigation.prototype._loadAllQueries = function(ev) {
    this.onAllQueries.fire();
    this._highlightLeftNav('all_queries_li');
};

Navigation.prototype._loadSharedQueries = function(ev) {
    this.onSharedQueries.fire();
    this._highlightLeftNav('shared_queries_li');
};



Navigation.prototype.loadState = function(state) {
    var parts = state.split('/');
    var top_level = parts.shift();

    this.abortCurrentRequest();
    Solstice.YahooUI.Message.clear();

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
        case 'all_tables':
            this._loadAllTables(null, parts);
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
    SQLShare.onNavigate.fire(title, "home");
    this.onHomeState.fire();
    this._highlightLeftNav('your_queries_li');
};

Navigation.prototype._newQueryNav = function(fire_event) {
    this._newQuery(fire_event);
    if (YAHOO.util.History.getCurrentState("s") == "query") {
        this.onNewQuery.fire();
    }
}

Navigation.prototype._newQuery = function(fire_event) {
    // Update navigation state?
    var title = Solstice.Lang.getString("SQLShare", "page_title_new_query");
    SQLShare.onNavigate.fire(title, "query");
    this._highlightLeftNav('new_query_li');
    if (fire_event) {
        this.onNewQuery.fire();
    }
};

Navigation.prototype._loadCredentials = function(fire_event) {
    // Update navigation state?
    var title = Solstice.Lang.getString("SQLShare", "page_title_rest_credentials");
    SQLShare.onNavigate.fire(title, "credentials");
    if (fire_event) {
        this.onLoadCredentials.fire();
    }
};

Navigation.prototype._queryQueueNav = function(fire_event) {
    this._queryQueue(fire_event);
    if (YAHOO.util.History.getCurrentState("s") == "querylist") {
        this.onQueryQueue.fire();
    }
}


Navigation.prototype._queryQueue = function(fire_event) {
    // Update navigation state?
    var title = Solstice.Lang.getString("SQLShare", "page_title_query_list");
    SQLShare.onNavigate.fire(title, "querylist");
    this._highlightLeftNav('query_list_li');
    if (fire_event) {
        this.onQueryQueue.fire();
    }
};


Navigation.prototype._chooseUploadNav = function(fire_event) {
    this._chooseUpload(fire_event);
    if (YAHOO.util.History.getCurrentState("s") == "file") {
        this.onChooseUpload.fire();
    }
};

Navigation.prototype._chooseUpload = function(fire_event) {
    // Update navigation state?
    var title = Solstice.Lang.getString("SQLShare", "page_title_upload_file");
    SQLShare.onNavigate.fire(title, "file");
    this._highlightLeftNav('new_upload_li');
    if (fire_event) {
        this.onChooseUpload.fire();
    }
};


Navigation.prototype._unimplementedFeature = function(ev, type) {
    YAHOO.util.Event.stopEvent(ev);
    var win = window.open('sqlshare/content/not_implemented.html?type='+type, "unimplemented", "width=500,height=205,resizable=0,status=0,location=0");
    win.focus();
};


Navigation.prototype._highlightLeftNav = function(new_active) {
    if (this._current_highlight) {
        YAHOO.util.Dom.removeClass(this._current_highlight, 'active');
        this._current_highlight = null;
    }
    if (new_active) {
        YAHOO.util.Dom.addClass(new_active, 'active');
        this._current_highlight = new_active;
    }
};
