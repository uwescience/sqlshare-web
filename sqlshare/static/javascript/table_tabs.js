"use strict";
SQLShare.TableTabs = function() {
    this._tabs = [];
    this.initialize();
};

SQLShare.TableTabs.prototype = new SSBase();

SQLShare.TableTabs.prototype.initialize = function() {
    $("#overflow_menu").menu();

    var me = this;

    $(window).on("resize", function(ev) {
        me._redrawMenu();
    });
    $("#tab_nav_tables").on("click", function(ev) {
        me._handleTabClick(ev);
    });

    $("#overflow_menu").on("click", function (ev) {
        me._handleMenuClick(ev);
    });
};

SQLShare.TableTabs.prototype.clearHighlight = function() {
    for (var i = 0; i < this._tabs.length; i++) {
        $("#tab_nav_content_"+i).removeClass("active");
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

    var me = this;
    me.matched_id = matched_id;
    if (matched_id >= 0) {
        $("#tab_nav_element_"+matched_id).animate({
            width: 0
        },
        {
            complete: function() { me._postHideAnimation(); }
        });
    }
};

SQLShare.TableTabs.prototype._postHideAnimation = function() {
    var id = this.matched_id;

    Solstice.Element.hide('tab_nav_element_'+id);
    var tab = this._tabs[id];

    if (tab.highlighted) {
        window.location.href = solstice_document_base+"sqlshare/#s=home";
    }
    this._redrawMenu();
};

SQLShare.TableTabs.prototype._handleTabClick = function(ev) {
    var target = ev.target;
    if ($(target).hasClass('tab_close')) {
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
            $("#tab_nav_content_"+i).addClass("active");
            tab.highlighted = true;
            found_tab = true;
        }
        else {
            $("#tab_nav_content_"+i).removeClass("active");
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

        $("#tab_nav_content_"+i).addClass("active");
        this._tabs.push({ type: type, id: id, display: base_name, highlighted: true });
    }

    this._redrawMenu();
};

SQLShare.TableTabs.prototype.tabInEditState = function(type, id) {
    for (var i = 0; i < this._tabs.length; i++) {
        var tab = this._tabs[i];
        if (tab.inactive != true && tab.type == type && tab.id == id) {
            $("#tab_nav_content_"+i).addClass("current_edit");
            tab.in_edit_state = true;
        }
        else {
            $("#tab_nav_content_"+i).removeClass("current_edit");
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
        $("#tab_nav_content_"+i).removeClass("current_edit");
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
            $("#tab_nav_element_"+visible_tabs[i].position).css("display", "inline-block");
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
        $("#table_tab_overflow_div").addClass("active");
    }
    else {
        $("#table_tab_overflow_div").removeClass("active");
    }

    if (menu_in_edit) {
        $("#table_tab_overflow_div").addClass("current_edit");
    }
    else {
        $("#table_tab_overflow_div").removeClass("current_edit");
    }

    
};

SQLShare.TableTabs.prototype._handleMenuClick = function(ev) {
    ev.stopPropagation();

    var target = ev.target;
    if (!target) {
        target = ev.srcElement;
    }
    if ($(target).hasClass('remove')) {
        this.removeTab('query', target.getAttribute('name'));
    }
    if ($(target).hasClass('go')) {
        console.log("In here?");
    }
    return false;
};
