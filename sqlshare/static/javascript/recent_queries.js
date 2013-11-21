var RecentQueries = function() {
    var menu = new YAHOO.widget.Menu("recent_queries_menu", {
    });
    menu.render('menu_container');
    this._menu = menu;
};

RecentQueries.prototype = new SSBase();

RecentQueries.prototype.renderMenu = function(ev, queries) {
};

RecentQueries.prototype.draw = function(ev, queries) {
    var menu = this._menu;
    menu.clearContent();
    var nav_item = document.getElementById('recent_queries');
    menu.cfg.setProperty('x', nav_item.offsetLeft + nav_item.offsetWidth - 23);
    menu.cfg.setProperty('y', nav_item.offsetTop + 8);

    for (var i = 0; i < queries.length; i++) {
        var item = queries[i];
        try {
        menu.addItem({
            text: unescape(item.name),
            url: "sqlshare/#s=query/"+item.owner+"/"+item.name,
            onclick: {
                fn: this._loadQuery,
                obj: item,
                scope: this
            }
        });
        }
        catch(e) { console.log(e) }
    }

    menu.render();
    menu.show();
};

RecentQueries.prototype._loadQuery = function(type, args, item) {
    var ev = args[0];

    window.location.href = solstice_document_base + "sqlshare/#s=query/"+item.owner+"/"+item.name;
};



