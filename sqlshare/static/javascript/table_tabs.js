SQLShare.TableTabs = function() {
    this._tabs = [];
    this.initialize();
};

SQLShare.TableTabs.prototype = new SSBase();

SQLShare.TableTabs.prototype.initialize = function() {
    YAHOO.util.Event.addListener("tab_nav_tables", "click", this._handleTabClick, this, true);
    YAHOO.util.Event.addListener(window, "resize", this._redrawMenu, this, true);
    $("#overflow_menu").menu();

    var me = this;
    $("#overflow_menu").on("click", function (ev) {
        me._handleMenuClick(ev);
    });

};

SQLShare.TableTabs.prototype.clearHighlight = function() {
    for (var i = 0; i < this._tabs.length; i++) {
        YAHOO.util.Dom.removeClass("tab_nav_content_"+i, "active");
        this._tabs[i].highlighted = false;
    }
};

SQLShare.TableTabs.prototype.removeTab = function(type, id) {
    var matched_id = -1;
    for (var i = 0; i < this._tabs.length; i++) {
        var tab = this._tabs[i];
        if (tab.inactive != true && tab.type == type && tab.id == id) {
            var matched_id = i;
            tab.inactive = true;
        }
    }

    if (matched_id >= 0) {
        var anim = new YAHOO.util.Anim("tab_nav_element_"+matched_id, {
            width: { to: 0 }
        });
        anim.onComplete.subscribe(this._postHideAnimation, { tabs: this, id: matched_id }, true);
        anim.animate();
    }
};

SQLShare.TableTabs.prototype._postHideAnimation = function(ev, what) {
    var this_actual = this.tabs;
    var id = this.id;

    Solstice.Element.hide('tab_nav_element_'+id);
    var tab = this_actual._tabs[id];

    if (tab.highlighted) {
        window.location.href = solstice_document_base+"sqlshare/#s=home";
    }
    this_actual._redrawMenu();
};

SQLShare.TableTabs.prototype._handleTabClick = function(ev) {
    var target = YAHOO.util.Event.getTarget(ev);
    if (YAHOO.util.Dom.hasClass(target, 'tab_close')) {
        var name = target.name;
        var matches = name.match('tab_([0-9]+)');
        var position = matches[1];
        var tab = this._tabs[position];

        this.removeTab(tab.type, tab.id);
    }
};

SQLShare.TableTabs.prototype.highlightTab = function(type, id) {
    // Only highlight tabs for real saved queries...
    if (id.match(/^[0-9]+$/)) {
        return;
    }

    var found_tab = false;
    for (var i = 0; i < this._tabs.length; i++) {
        var tab = this._tabs[i];
        if (tab.inactive != true && tab.type == type && tab.id == id) {
            YAHOO.util.Dom.addClass("tab_nav_content_"+i, "active");
            tab.highlighted = true;
            found_tab = true;
        }
        else {
            YAHOO.util.Dom.removeClass("tab_nav_content_"+i, "active");
            tab.highlighted = false;
        }
    }
    if (!found_tab) {
        var li = document.createElement("li");
        li.id = "tab_nav_element_"+this._tabs.length;
        var ul = document.getElementById("table_tab_list");
        ul.appendChild(li);
        var div = document.createElement('div');
        div.id = "tab_nav_content_"+this._tabs.length;
        li.appendChild(div);

        // 130 is pretty arbitrary, based on the old css max-width of 160
        var base_name = unescape(id).replace(/^.*\//, '');
        var new_string = this._getTruncatedString(base_name, 130);
        if (new_string != base_name) {
            new_string += "...";
        }

        this._renderTo(div.id, 'table_tab.html', {
            highlighted: true,
            type: type,
            name: id,
            display_name: unescape(new_string),
            position: this._tabs.length
        });

        YAHOO.util.Dom.addClass("tab_nav_content_"+i, "active");
        this._tabs.push({ type: type, id: id, display: base_name, highlighted: true });
    }

    this._redrawMenu();
};

SQLShare.TableTabs.prototype.tabInEditState = function(type, id) {
    for (var i = 0; i < this._tabs.length; i++) {
        var tab = this._tabs[i];
        if (tab.inactive != true && tab.type == type && tab.id == id) {
            YAHOO.util.Dom.addClass("tab_nav_content_"+i, "current_edit");
            tab.in_edit_state = true;
            found_tab = true;
        }
        else {
            YAHOO.util.Dom.removeClass("tab_nav_content_"+i, "current_edit");
            tab.in_edit_state = false;
        }
    }
    this._redrawMenu();
};

SQLShare.TableTabs.prototype.getCurrentQueryID = function() {
    for (var i = 0; i < this._tabs.length; i++) {
        var tab = this._tabs[i];
        if (tab.inactive != true && tab.highlighted) {
            return tab.id;
        }
    }
}

SQLShare.TableTabs.prototype.removeEditState = function(type, id) {
    for (var i = 0; i < this._tabs.length; i++) {
        var tab = this._tabs[i];
        YAHOO.util.Dom.removeClass("tab_nav_content_"+i, "current_edit");
        tab.in_edit_state = false;
    }
    this._redrawMenu();
};

SQLShare.TableTabs.prototype._redrawMenu = function() {
    var dropdown_size = 50;
    // 180 is the tab width + left/right padding
    // 530 is the negative right margin.

    var total_space = parseInt(document.getElementById('tab_nav_tables').offsetWidth) - dropdown_size - 530;
    var used_space = 0;
    var max = 0;

    var visible_tabs = [];

    for (var i = this._tabs.length - 1; i >= 0; i--) {
        var tab = this._tabs[i];
        if (!tab.inactive) {
            var text = tab.display;
            var full_width = this._getStringPixelWidth(text) + 40;
            used_space += full_width;
            if (used_space < total_space) {
                max++;
            }
            visible_tabs.unshift({ position: i, tab: tab});
        }
    }

    var show_menu = false;

    var menu_highlighted = false;
    var menu_in_edit = false;
    var overflow_params = [];

    for (var i = visible_tabs.length - max - 1; i >=  0; i--) {
        if (i >= 0) {
            Solstice.Element.hide('tab_nav_element_'+visible_tabs[i].position);
            show_menu = true;

            var classname = '';
            if (visible_tabs[i].tab.highlighted) {
                menu_highlighted = true;
            }
            if (visible_tabs[i].tab.in_edit_state) {
                menu_in_edit = true;
                classname = 'current_edit';
            }

            overflow_params.push({
                id: visible_tabs[i].tab.id,
                display: unescape(visible_tabs[i].tab.display),
                classname: classname
            });
        }
    }

    for (var i = visible_tabs.length - max; i < visible_tabs.length; i++) {
        if (i >= 0) {
            Solstice.Element.showInline('tab_nav_element_'+visible_tabs[i].position);
        }
    }

    if (show_menu) {
        var template = 'tab_nav_overflow.html';
        $("#overflow_list").html(HandlebarsUtils.to_string(template, { "queries": overflow_params }));
        $("#overflow_menu").menu("refresh");
        $("#overflow_list").css('z-index', 2);
        $("#table_tab_overflow_li").css("display", "inline-block");
    }
    else {
        $("#table_tab_overflow_li").css("display", "none");
    }

    if (menu_highlighted) {
        YAHOO.util.Dom.addClass("table_tab_overflow_div", "active");
    }
    else {
        YAHOO.util.Dom.removeClass("table_tab_overflow_div", "active");
    }

    if (menu_in_edit) {
        YAHOO.util.Dom.addClass("table_tab_overflow_div", "current_edit");
    }
    else {
        YAHOO.util.Dom.removeClass("table_tab_overflow_div", "current_edit");
    }

    
};

SQLShare.TableTabs.prototype._handleMenuClick = function(ev) {
    ev.stopPropagation();

    var target = ev.target;
    if (!target) {
        target = ev.srcElement;
    }
    if (YAHOO.util.Dom.hasClass(target, 'remove')) {
        this.removeTab('query', target.getAttribute('name'));
    }
    if (YAHOO.util.Dom.hasClass(target, 'go')) {
        console.log("In here?");
    }
    return false;
};
