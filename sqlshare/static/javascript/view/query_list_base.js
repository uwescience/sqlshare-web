"use strict";
SQLShare.View.QueryListBase = function() {
};

SQLShare.View.QueryListBase.prototype = new SQLShare.View();

SQLShare.View.QueryListBase.prototype._drawTable = function(id, list) {
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

        var html = view.toString();
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
        var html = view.toString();
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

        var url = aData[7].replace(/^\/v3\/db\/dataset/, 'query');

        window.location.href = '/sqlshare/#s='+url;
    })
}

function get_tag_list_from_raw(raw_tags) {
    var tag_hash = {};
    for (var pc = 0; pc < raw_tags.length; pc++) {
        var person_tags = raw_tags[pc].tags;
        for (var t = 0; t < person_tags.length; t++) {
            tag_hash[person_tags[t]] = true;
        }
    }

    var tags = [];
    for (var tag in tag_hash) {
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

