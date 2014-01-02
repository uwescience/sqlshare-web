
var SQLShare = function(div_id) {
    this.id = div_id;
};

SQLShare.prototype = new SSBase();

SQLShare.prototype.run = function() {
    var nav = new Navigation(this.id);
    var me = this;

    $(document).on("new_query", function () { return me._drawQueryInterface.apply(me, arguments); });
    $(document).on("query_queue", function () { return me._drawQueryQueueInterface.apply(me, arguments); });
    $(document).on("choose_upload", function () { return me._drawUploadInterface.apply(me, arguments); });
    $(document).on("home_state", function () { return me._drawHomeScreen.apply(me, arguments); });
    $(document).on("all_queries", function () { return me._drawAllQueriesInterface.apply(me, arguments); });
    $(document).on("shared_queries", function () { return me._drawSharedQueriesInterface.apply(me, arguments); });
    $(document).on("recent_queries", function () { return me._drawRecentQueriesInterface.apply(me, arguments); });
    $(document).on("saved_query", function () { return me._drawSavedQueryInterface.apply(me, arguments); });
    $(document).on("tagged_queries", function () { return me._drawTaggedQueriesInterface.apply(me, arguments); });
    $(document).on("load_credentials", function () { return me._drawManageCredentials.apply(me, arguments); });

    this.nav = nav;
    this._tabs = new SQLShare.TableTabs();

    SQLShare.recent_queries_menu = new RecentQueries(this);


    SQLShare.onChangeContent = new YAHOO.util.CustomEvent('sqlshare:content_change');
    SQLShare.onChangeContent.subscribe(this._resetWorkspace, this, true);

    SQLShare.onEditQuery = new YAHOO.util.CustomEvent('sqlshare:edit_query');
    SQLShare.onEditQuery.subscribe(this._handleEditQuery, this, true);

    SQLShare.onEditDone = new YAHOO.util.CustomEvent('sqlshare:on_edit_done');
    SQLShare.onEditDone.subscribe(this._handleEditQueryDone, this, true);

    SQLShare.onUpdateFinishQueryCount = new YAHOO.util.CustomEvent('sqlshare:update_finished_query_count');
    SQLShare.onUpdateFinishQueryCount.subscribe(this._handleFinishCountEvent, this, true);

    this._getUser();
};

SQLShare.prototype._handleFinishCountEvent = function(ev, count) {
    this.updateFinishedQueryCount(count);
};

SQLShare.prototype.updateFinishedQueryCount = function(count) {
    document.getElementById('nav_finished_query_count').innerHTML = count;
};

SQLShare.prototype._handleEditQuery = function(type, args) {
    var query = args[0];
    var id = query.query_id;

    this._tabs.tabInEditState('query', id);
};

SQLShare.prototype._handleEditQueryDone = function(type, args) {
    this._tabs.removeEditState();
};

SQLShare.prototype._resetWorkspace = function() {
    this._resizeCenterColumn();
    document.getElementById('ss_app').scrollTop = '0px';
    document.getElementById('ss_app_workspace').scrollTop = '0px';
    document.getElementById('ss_content').scrollTop = '0px';
    document.getElementById('ss_application_wrapper').scrollTop = '0px';

    var current_tab = this._tabs.getCurrentQueryID();
    if ($("#ss_editor_col").hasClass("qid_"+current_tab)) {
        $("#ss_editor_col").addClass("current_edit");
    }
    else {
        $("#ss_editor_col").removeClass("current_edit");
    }
    window.scrollTo(0, 0);
};

SQLShare.prototype._resizeCenterColumn = function() {
    var window_width = Solstice.Geometry.getBrowserWidth();
    var window_height = Solstice.Geometry.getBrowserHeight();

    var left_size = document.getElementById('ss_sidebar').offsetWidth;
    var right_size = document.getElementById('ss_editor_col').offsetWidth;
    var container_size = document.getElementById('ss_content').offsetWidth;

    var content_available = window_width - left_size;
    var wrapper_available = content_available;
    var workspace_available = content_available - right_size - 40;
    
    
    
    if (right_size) {
        workspace_available -= 0;
    }
    
    // make sure application is viewable on resolutions less than 1100px
    if ( window_width < 1100 ) {
        if (right_size) { workspace_available = 300; }
        else { workspace_available = 912; }
    }

    // the offset is basically a guess - it's whatever's in the header, or the footer, and none of that
    // is nailed down yet.
    var vertical_available = window_height - 41;
    var content_margin = 42;

    document.getElementById('ss_content').style.width = content_available+'px';
    document.getElementById('ss_application_wrapper').style.height = vertical_available+'px';
    document.getElementById('ss_application_wrapper').style.width = wrapper_available+'px';
    
    document.getElementById('ss_app_workspace').style.width = workspace_available+'px';    
    document.getElementById('ss_app_workspace').style.height = vertical_available - content_margin + 'px';
    document.getElementById('edit_query_container').style.height = vertical_available - content_margin + 'px';
//    document.getElementById('ss_editor_col').style.height = vertical_available - content_margin + 'px';

    document.getElementById('ss_app').style.height = window_height+'px';
    document.getElementById('ss_sidebar_content').style.height = window_height+'px';

    var content_height = document.getElementById('ss_app_workspace').scrollHeight;
    var display_height = parseInt(document.getElementById('ss_app_workspace').style.height);

    var content_width = document.getElementById('ss_app_workspace').scrollWidth;
    var display_width = parseInt(document.getElementById('ss_app_workspace').style.width);

    if (content_height > display_height + 20) {
        document.getElementById('ss_app_workspace').style.overflowY = 'auto';
    }
    else {
        document.getElementById('ss_app_workspace').style.overflowY = 'hidden';
    }

    if (content_width > display_width + 20) {
        document.getElementById('ss_app_workspace').style.overflowX = 'hidden';
    }
    else {
        document.getElementById('ss_app_workspace').style.overflowX = 'hidden';
    }

    if (document.getElementById('ss_table_container')) {
        var total_height = document.getElementById('edit_query_container').style.height;
        total_height = total_height.replace(/px$/, '');
        var editor_height = document.getElementById('ss_content_body').scrollHeight;
        var buttons_height = document.getElementById('ss_edit_button_row').scrollHeight;

        // this is another arbitrary padding number
        var padding = 90;

        var datatable_height = total_height - editor_height - buttons_height - padding;
        if (datatable_height < 100) {
            datatable_height = 100;
        }

        document.getElementById('ss_table_container').style.height = datatable_height + 'px';
    }

    if (document.getElementById('ss_content_table')) {
        // Reset this, so it doesn't influence the total height
        document.getElementById('ss_table_container_main').style.height = '0px';
        var total_height = document.getElementById('ss_app_workspace').style.height;
        var header_height = document.getElementById('ss_content_header').scrollHeight;
        var body_height = document.getElementById('ss_content_body_main').scrollHeight;

        var padding = 43;

        total_height = total_height.replace(/px$/, '');

        var table_height = total_height - header_height - body_height - padding;

        // want to make sure data is still visible - folks can scroll if they need to
        if (table_height < 150) {
            table_height = 150;
        }

        document.getElementById('ss_table_container_main').style.height = table_height+'px';
    }

    var editor_height = document.getElementById('ss_editor_col').scrollHeight;

    if (editor_height > vertical_available) {
        document.getElementById('ss_editor_col').style.height = (vertical_available - 40) + 'px';
        document.getElementById('ss_editor_col').style.overflowY = 'scroll';
    }
    else{
        document.getElementById('ss_editor_col').style.height = null;
        document.getElementById('ss_editor_col').style.overflowY = 'hidden';
    }

    if (SQLShare._DATA_TABLE) {
        try {
            var width = document.getElementById('ss_app_workspace').offsetWidth;
            var height = document.getElementById('ss_app_workspace').offsetHeight;
            var table_height = height - 80;

            var padding = 100;
            var date_width = 140;
            var owner_width = 200;
            var name_width = width - date_width - owner_width - padding;
            if (name_width < 150) {
                name_width = 150;
            }

            SQLShare._DATA_TABLE.set('height', table_height+"px");
            SQLShare._DATA_TABLE.setColumnWidth(SQLShare._DATA_TABLE.getColumn(0), name_width);
        }
        catch (e) {
            SQLShare._DATA_TABLE = null;
        }
    }

    if (document.getElementById('new_query_preview_panel')) {
        var height = document.getElementById('ss_app_workspace').offsetHeight;
        var table_height = height - 325;

        document.getElementById('ss_table_container_main').style.height = table_height+"px";
    }

    var sidebar_ul = document.getElementById('js-sidebar-tag-list');
    if (sidebar_ul) {
        var first_li = sidebar_ul.children[0];
        if (first_li) {
            var li_height = first_li.offsetHeight;
            li_height += 4; // margin bottom

            var max_height = window_height - 400;
            var new_ul_height = parseInt(max_height / li_height) * li_height;

            new_ul_height -= 10; // padding
            new_ul_height -= 4; // li margin?

            sidebar_ul.style.height = new_ul_height+'px';
        }
    }
};

SQLShare.prototype._drawHomeScreen = function() {
    this._tabs.clearHighlight();
    var widget = new MyQueries(this.id+'_workspace');
    widget.draw();
}

SQLShare.prototype._drawUploadInterface = function(event, args) {
    this._tabs.clearHighlight();
    var new_upload = new Uploader(this.id+'_workspace', args);
    new_upload.draw();
}

SQLShare.prototype._drawQueryInterface = function(query_id) {
    this._tabs.clearHighlight();
    var query = new Query(this.id+'_workspace', query_id);
    query.draw();
};

SQLShare.prototype._drawManageCredentials = function() {
    this._tabs.clearHighlight();
    var page = new ManageCredentials(this.id+'_workspace');
    page.draw();
};


SQLShare.prototype._drawQueryQueueInterface = function(query_id) {
    this._tabs.clearHighlight();
    var controller = new QueryQueue(this.id+'_workspace');
    controller.draw();
};

SQLShare.prototype._drawAllQueriesInterface = function() {
    this._tabs.clearHighlight();
    var widget = new AllQueries(this.id+'_workspace');
    widget.draw();
};

SQLShare.prototype._drawSharedQueriesInterface = function() {
    this._tabs.clearHighlight();
    var widget = new SharedQueries(this.id+'_workspace');
    widget.draw();
};


SQLShare.prototype._drawRecentQueriesInterface = function(ev, args) {
};

SQLShare.prototype._drawSavedQueryInterface = function(ev, args) {
    var query = args[0];

    try {
        this._tabs.highlightTab('query', query);
    }
    catch (e) { console.log(e) }
    this._newRecentQuery(query);

    var widget = new SavedQuery(this.id+'_workspace', query);
    widget.draw();

    var me = this;
    $(document).on("query_delete", function(ev, model) {
        me._handleQueryDelete(ev, model);
    });

    this.drawSidebarLists();
};

SQLShare.prototype._drawTaggedQueriesInterface = function(ev, args) {
    var tag = args[0];

    this._tabs.clearHighlight();
    var widget = new TaggedQueries(this.id+'_workspace', tag);
    widget.draw();
};

SQLShare.prototype._handleQueryDelete = function(type, query) {
    this._tabs.clearHighlight();

    for (var i = 0; i < this._recentQueries.length; i++) {
        if (this._recentQueries[i].name == encodeURIComponent(query.name) && this._recentQueries[i].owner == encodeURIComponent(query.owner)) {
            this._recentQueries.splice(i, 1);
        }
    }

    this._tabs.removeTab('query', query.query_id);
};

SQLShare.prototype._initializeHistoryManager = function() {
    // this is sad - i was hoping components could just fire arbitrarily
    // named events, but the events need to be tied to a variable.  To
    // avoid passing around an object, i'm putting it on SQLShare as a class,
    // not the objects
    if (SQLShare.navigation) {
        return;
    }

    var sql_share = this;
    $.History.bind(function(state){
        // Translate the old requirement of s=... out
        state = state.replace(/^s=/, '');
        sql_share.nav.loadState(state);
    });

    var hash = window.location.hash;
    var matches = hash.match(/^#s=([^&]+)/);

    var initial_state = null;
    if (matches) {
        initial_state = matches[1];
    }
    initial_state = initial_state || "home";

    SQLShare.onNavigate = new YAHOO.util.CustomEvent("sqlshare:navigation", this);
    SQLShare.onNavigate.subscribe(this._handleNavigation, this, true);
    sql_share.nav.loadState(initial_state);
};

SQLShare.prototype._handleNavigation = function(ev, args) {
    var title = args.shift();
    var new_state = args[0];

    if (this.nav.getCurrentState() != new_state) {
        // Do we need to handle this?
    }

    if (title !== null) {
        window.document.title = title;
    }
};

SQLShare.prototype._getUser = function() {
    this.AsyncGET(this._getRestRoot()+"/user/", this._postUserLoad);
};

SQLShare.prototype._postUserLoad = function(o) {
    if (o.code == 200 || o.code == 201) {
        this._loadApp(o.data);
        return;
    }
    else {
        this.handleUserError(o);
    }
};

SQLShare.prototype.handleUserError = function(o) {
    if (o.code == 500 && o.conn.responseText.match(/^500 Can't connect to /)) {
        this._renderTo('ss_app_workspace', 'load_error/bad_host.html', {});
        this._resizeCenterColumn();
    }
};

SQLShare.prototype._loadApp = function(user_data) {
    solstice_user.sqlshare_schema = user_data.schema;
    solstice_user.sqlshare_user   = user_data.username;


    this._loadPreferences();

    this._resizeCenterColumn();
    YAHOO.util.Event.addListener(window, "resize", this._resizeCenterColumn, this, true);
    YAHOO.util.Event.addListener(window, "click", this._hideToolTips, this, true);

    this._initializeHistoryManager();
    this.drawSidebarLists();
    this._fetchFinishedFinishCount();
};

SQLShare.prototype._fetchFinishedFinishCount = function() {
    this.AsyncGET(this._getRestRoot()+"/proxy/REST.svc/v2/db/process", function(o) {
        if (o.code == 200) {
            var data = o.data;
            var len = data.length;
            var finished_count = 0;
            for (var i = 0; i < len; i++) {
                if (data[i].date_finished) {
                    finished_count++;
                }
            }
            SQLShare.onUpdateFinishQueryCount.fire(finished_count);
        }

        var me = this;
        window.setTimeout(function() { me._fetchFinishedFinishCount() }, 15 * 1000);
    });
};

SQLShare.prototype.drawSidebarLists = function() {
    this.AsyncGET(this._getRestRoot()+"/proxy/REST.svc/v2/db/dataset", this._renderSidebar)
};

SQLShare.prototype._renderSidebar= function(o) {

    if (o.code != 200) {
        return;
    }

    var list = o.data;

    this._renderTo('tagging_sidebar', new SQLShare.View.SidebarLists(o.data));
    this._resizeCenterColumn();
};

SQLShare.prototype._hideToolTips = function() {
};

SQLShare.prototype._loadPreferences = function() {
    this._loading_prefs = true;

    var json = Solstice.Cookie.read('recent');
    if (json) {
        this._recentQueries = jQuery.parseJSON(json);
    }
    else {
        this._recentQueries = [];
    }

    this._postPref();
};

SQLShare.prototype.getRecentQueries = function() {
    return this._recentQueries;
}

SQLShare.prototype._postPref = function(o) {
    if (this._load_recent_queries) {
        this._load_recent_queries = false;
        this._drawRecentQueriesInterface();
    }
    this._loading_prefs = false;
};

SQLShare.prototype._newRecentQuery = function(name) {
    if (!this._recentQueries) {
        this._recentQueries = [];
    }

    var parts = name.split('/');
    var owner = parts[0];
    var name = parts[1];

    var remove_at = -1;
    for (var i = 0; i < this._recentQueries.length; i++) {
        var entry = this._recentQueries[i];
        if (entry.name == name && entry.owner == owner) {
            remove_at = i;
        }
    }

    if (remove_at >= 0) {
        this._recentQueries.splice(remove_at, 1);
    }

    this._recentQueries.unshift({ name: name, owner: owner, last_viewed: (new Date()).toString() });

    if (this._recentQueries.length > SQLShare.Constants.MAX_RECENT_QUERIES) {
        this._recentQueries.splice(SQLShare.Constants.MAX_RECENT_QUERIES);
    }

    Solstice.Cookie.set('recent', JSON.stringify(this._recentQueries), 60*24*30*12);
}

function slash_selector(selector) {
    // this is needed to get around some ids that i can't get escaped properly
    if (selector.match(/^#/) && !selector.match(/ /)) {
        selector = selector.replace(/^#/, '');
        return $(document.getElementById(selector));
    }
    return selector.replace("/", "\\/", "g");
}

