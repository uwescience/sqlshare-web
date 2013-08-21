SQLShare.View.QueryListBase = function() {
};

SQLShare.View.QueryListBase.prototype = new SQLShare.View();

SQLShare.View.QueryListBase.prototype._drawTable = function(id, list) {

    var name_formatter = function(elLiner, oRecord, oColumn, oData) {
        var view = new SQLShare.View.TableNameCell({
            name:  oRecord.getData('name'),
            owner:  oRecord.getData('owner'),
            description:  oRecord.getData('description'),
            url:    oRecord.getData('url'),
            tags: oRecord.getData('tags')
        });

        elLiner.innerHTML = view.toString();
    };

    var owner_formatter = function(elLiner, oRecord, oColumn, oData) {
        var view = new SQLShare.View.TableOwnerCell({
            owner:  oRecord.getData('owner'),
            is_public:  oRecord.getData('is_public'),
            is_shared:  oRecord.getData('is_shared')
        });

        elLiner.innerHTML = view.toString();
    };

    var row_click = function(ev) {
        YAHOO.util.Event.stopEvent(ev);
        var target = ev.target;
        var td = target.children[0];
        var check_els = [];
        check_els.push(td);
        for (var i = 0; i < check_els.length; i++) {
            var el = check_els[i];
            if (el.getAttribute('href')) {
                var href = el.getAttribute('href');
                window.location.href = href;
                return;
            }
            if (el.children) {
                var len = el.children.length;
                for (var j = 0; j < len; j++) {
                    check_els.push(el.children[j]);
                }
            }
        }
    };

    YAHOO.widget.DataTable.Formatter.owner_permissions = owner_formatter;
    YAHOO.widget.DataTable.Formatter.name_description = name_formatter;
    YAHOO.widget.DataTable.Formatter.modify_date = this.formatDate;

    var width = document.getElementById('ss_app_workspace').offsetWidth;
    var height = document.getElementById('ss_app_workspace').offsetHeight;
    var table_height = height - 80;

    var padding = 100;
    var date_width = 140;
    var owner_width = 200;
    var name_width = width - date_width - owner_width - padding;
    if (name_width < 0) {
        name_width = undefined;
    }

    var column_defs = [
        {key: 'name', label: Solstice.Lang.getString('SQLShare', 'query_list_name'), sortable: true, formatter: "name_description", width: name_width },
        {key: 'owner', label: Solstice.Lang.getString('SQLShare', 'query_list_owner'), sortable: true, formatter: "owner_permissions", width: owner_width },
        {key: 'modify_date', label: Solstice.Lang.getString('SQLShare', 'query_list_modify_date'), sortable: true, resizeable: true, formatter: "modify_date", width: date_width }
    ];

    var data = [];

    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        var raw_tags = item.tags;

        var tag_hash = {};
        for (var pc = 0; pc < raw_tags.length; pc++) {
            var person_tags = raw_tags[pc].tags;
            for (var t = 0; t < person_tags.length; t++) {
                tag_hash[person_tags[t]] = true;
            }
        }

        var tags = [];
        for (tag in tag_hash) {
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


        data.push({
            name: item.name,
            tags: tags,
            modify_date: new Date(list[i].date_modified),
            owner: item.owner,
            is_public: item.is_public,
            is_shared: item.is_shared,
            description: item.description,
            url: item.url,
            sql: item.sql_code
        });
    }


    data = data.sort(function(a, b) {
        if (a.modify_date < b.modify_date) {
            return 1;
        }
        if (a.modify_date > b.modify_date) {
            return -1;
        }
        return 0;
    });

    var data_source = new YAHOO.util.DataSource(data);
    data_source.responseType =  YAHOO.util.DataSource.TYPE_JSARRAY;
    data_source.responseSchema = {
        fields: [ 'name', 'tags', 'owner', 'modify_date', 'is_public', 'is_shared', 'description', 'url', 'sql']
    };

    data_source.doBeforeCallback = function(req, raw, res, cb) {
        var data = res.results || [];
        var filtered = [];

        if (req) {
            req = req.toLowerCase();
            var words = req.split(/\s+/)
            var len = data.length;
            for (var i = 0; i < len; i++) {
                var matches = false;
                for (var j = 0; j < words.length; j++) {
                    var word = words[j];
                    var tag_matches = false;
                    var tags = data[i].tags;
                    if (tags) {
                        for (var t = 0; t < tags.length; t++) {
                            var tag = tags[t];
                            if (tag.toLowerCase().indexOf(word) >= 0) {
                                tag_matches = true;
                            }
                        }
                    }

                    if (data[i].name.toLowerCase().indexOf(word) >= 0 ||
                        data[i].owner.toLowerCase().indexOf(word) >= 0 ||
                        data[i].description.toLowerCase().indexOf(word) >= 0 ||
                        data[i].sql.toLowerCase().indexOf(word) >= 0 ||
                        tag_matches == true) {
                           matches = true;
                    }
                    else {
                        matches = false;
                        break;
                    }
                }

                if (matches) {
                    filtered.push(data[i]);
                }
            }
            res.results = filtered;
        }

        return res;
    };

    var data_table = new YAHOO.widget.ScrollingDataTable(id, column_defs, data_source, {
        sortedBy: { key: 'modify_date', dir: 'desc' },
        height: table_height+"px",
        renderLoopSize: 50
    });
    data_table.subscribe('postRenderEvent', this._addAccessTooltips);
    data_table.subscribe('postRenderEvent', function() {
        YAHOO.util.Event.addListener(YAHOO.util.Dom.getElementsByClassName('js-table-tag'), 'click', function(ev) {
            YAHOO.util.Event.stopEvent(ev);
            window.location.href = "sqlshare/#s=tag/"+this.getAttribute('rel');
        });

    });

    // ouch.  used in SQLShare.prototype._resizeCenterColumn
    SQLShare._DATA_TABLE = data_table;

    data_table.subscribe("rowClickEvent", row_click);

    YAHOO.util.Event.removeListener('clear_query_filter', 'click');
    YAHOO.util.Event.addListener('clear_query_filter', 'click', function() {
        YAHOO.util.Dom.get('query_filter').value = '';
        YAHOO.util.Dom.removeClass('js-filter-wrapper', 'has_filter');
        this._runFilter({ value:'', table: data_table, source:data_source, wait:false });
    }, this, true);

    YAHOO.util.Event.removeListener('query_filter', 'keyup');
    YAHOO.util.Event.addListener('query_filter', 'keyup', function() {
        var value = YAHOO.util.Dom.get('query_filter').value;
        if (value) {
            YAHOO.util.Dom.addClass('js-filter-wrapper', 'has_filter');
        }
        else {
            YAHOO.util.Dom.removeClass('js-filter-wrapper', 'has_filter');
        }
        this._runFilter({ value:YAHOO.util.Dom.get('query_filter').value, table: data_table, source:data_source, wait:true});
    }, this, true);

};

SQLShare.View.QueryListBase.prototype._runFilter = function(args) {
    var value = args.value;
    var data_source = args.source;
    var data_table = args.table;
    var timeout = args.wait ? 500 : 0;

    if (SQLShare._filter_timeout) {
        clearTimeout(SQLShare._filter_timeout);
    }
    SQLShare._filter_timeout = setTimeout(function() {
        data_source.sendRequest(YAHOO.util.Dom.get('query_filter').value, {
            success : data_table.onDataReturnInitializeTable,
            failure : data_table.onDataReturnInitializeTable,
            scope   : data_table
        });
    }, timeout);
};
