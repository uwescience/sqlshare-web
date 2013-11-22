SQLShare.View.QueryListBase = function() {
};

SQLShare.View.QueryListBase.prototype = new SQLShare.View();

SQLShare.View.QueryListBase.prototype._drawTable = function(id, list) {
//    this._drawYUITable(id, list);
    draw_jquery_table(id, list);
}

function draw_jquery_table(id, list) {
    $('#'+id).html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="query_list_table"></table>' );

    var table_data = [];
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        var tags = get_tag_list_from_raw(item['tags']);

        table_data.push([
            item['name'],
            item['owner'],
            item['date_modified'],
            item['is_public'],
            item['is_shared'],
            item['description'],
            tags.join(","),
            item['url']
        ]);
    }

    var rendered_data = {
        name: {},
        owner: {},
        date_content: {},
        date_objects: {}
    };

    function name_formatter(data, type, row) {
        var key = row[0]+"/"+row[1];

        if (rendered_data['name'][key]) {
            return rendered_data['name'][key];
        }
        var tag_array = [];
        if (row[6]) {
            tag_array = row[6].split(",");
        }
        var view = new SQLShare.View.TableNameCell({
            name: row[0],
            owner: row[1],
            description: row[5],
            url: row[7],
            tags: tag_array
        });

        html = view.toString();
        rendered_data['name'][key] = html;

        return html;
    }

    function owner_formatter(data, type, row) {
        var key = row[0]+"/"+row[1];

        if (rendered_data['owner'][key]) {
            return rendered_data['owner'][key];
        }

        var view = new SQLShare.View.TableOwnerCell({
            owner:  row[1],
            is_public:  row[3],
            is_shared:  row[4]
        });
        html = view.toString();
        rendered_data["owner"][key] = html;
        return html;
    }

    function date_formatter(data, type, row) {
        var key = row[0]+"/"+row[1];
        if (type == "display" || type == "filter") {
            if (rendered_data['date_content'][key]) {
                return rendered_data['date_content'][key];
            }
            var view = new SQLShare.View.TableDateCell({
                date_obj:  new Date(data)
            });
            var html = view.toString();
            rendered_data['date_content'][key] = html;
            return html;
        }
        else {
            return new Date(data);
        }
    }

    var datatable = $("#query_list_table").dataTable({
        "aaData": table_data,
        "bProcessing": true,
        "bDeferRender": true,
        "oLanguage": {
            "sSearch": "Filter dataset by keyword:",
        },
        "aoColumns": [
            { "sTitle": "Name" },
            { "sTitle": "Sharing/Owner", "sWidth": 200 },
            { "sTitle": "Modified", "sWidth": 140 }
        ],
        "aoColumnDefs": [
            {
                "mRender": name_formatter,
                "aTargets": [0]
            },
            {
                "mRender": owner_formatter,
                "aTargets": [1]
            },
            {
                "mRender": date_formatter,
                "aTargets": [2]
            },
            { "bVisible": false,  "aTargets": [  ] },
            { "sType": "date", "aTargets": [2] }
        ],

    });

    $("#query_list_table").on("click", "tr", function(ev) {
        if (ev.target.nodeName == "A") {
            return;
        }
        var position = datatable.fnGetPosition( this );
        if (!position) {
            return;
        }
        var aData = datatable.fnGetData( position );

        var url = aData[7].replace(/^\/REST.svc\/v2\/db\/dataset/, 'query');

        window.location.href = '/sqlshare/#s='+url;
    })
}

SQLShare.View.QueryListBase.prototype._drawYUITable = function draw_yui_table(id, list) {
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

        tags = get_tag_list_from_raw(raw_tags);

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

function get_tag_list_from_raw(raw_tags) {
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

    return tags;
}

