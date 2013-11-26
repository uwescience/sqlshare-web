var RecentQueries = function(sqlshare) {
    $("#recent_queries_menu").menu();

    $("#recent_queries_menu").on("menufocus", function(ev) {
        // This phase is when the menu opens.  Clicking a menu item the first time
        // gives an event w/ a phase of 2
        if (ev.eventPhase != 3) {
            return;
        }
        var template = 'recent_queries.html';
        var query_params = [];

        var recent_queries = sqlshare.getRecentQueries();
        for (var i = 0; i < recent_queries.length; i++) {
            var item = recent_queries[i];
            query_params.push({
                display: unescape(item.name),
                name: item.name,
                owner: item.owner
            });
        }

        $("#recent_query_list").html(HandlebarsUtils.to_string(template, { "queries": query_params }));
    });
    $("#recent_queries_menu").menu("refresh");
};

RecentQueries.prototype = new SSBase();

RecentQueries.prototype.renderMenu = function(ev, queries) {
};

RecentQueries.prototype.draw = function(ev, queries) {
};


