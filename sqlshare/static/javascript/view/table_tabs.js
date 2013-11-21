SQLShare.View.TableTabs = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'table_tabs.html';
};

SQLShare.View.TableTabs.prototype = new SQLShare.View();

SQLShare.View.TableTabs.prototype.generateParams = function() {
    var tabs = this.model;

    var container_width = document.getElementById('tab_nav_tables').offsetWidth;

    // This is the max-width of .ss-tables-list li
    var max = parseInt(container_width / 160);
    max = 2;

    var starting = 0;
    if (max < tabs.length) {
        starting = tabs.length - max;
        this.setParam('overflow', starting);
        this._overflow = starting;
    }

    for (var i = starting; i < tabs.length; i++) {
        var name = tabs[i].name;
        this.addParam('tabs', {
            name            : name,
            display_name    : unescape(name),
            type            : tabs[i].type,
            uri_name        : tabs[i].name,
            highlighted     : tabs[i].highlighted,
            position        : i
        });
    }
};

SQLShare.View.TableTabs.prototype.postRender = function() {
    if (!this._overflow) {
        return;
    }

    var starting = this._overflow;
    if (!SQLShare._TAB_MENU) {
        SQLShare._TAB_MENU = new YAHOO.widget.MenuBar("table_tab_overflow", { autosubmenudisplay: true, hidedelay: 750 });
    }

    top_level = SQLShare._TAB_MENU;
    var submenu = [];
    for (var i = 0; i < starting; i++) {
        var tab = this.model[i];
        var name = tab.name;
        var type = tab.type;
        var display_name = unescape(name);

        submenu.push({
            text: display_name,
            url: "sqlshare/#s="+type+"/"+name
            });
    }

    top_level.getItem(0).cfg.setProperty('submenu', { id: "overflow", itemdata: submenu });

    top_level.render("table_tab_overflow");
};

SQLShare.View.TableTabs.prototype._handleClick = function(ev) {
    console.log("YEA!");
};

