SQLShare.View.QueryQueue = function() {};

SQLShare.View.QueryQueue.Display = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'query_queue/display.html';
};

SQLShare.View.QueryQueue.Display.prototype = new SQLShare.View();

SQLShare.View.QueryQueue.Display.prototype.generateParams = function() {
    this.setParam('id', this.model.container_id);

    var query_data = this.model.queries;
    var len = query_data.length;

    if (!len) {
        this.setParam('no_queries', true);
    }

    var finished_count = 0;

    var full_data = {};

    for (var i = 0; i < len; i++) {
        var data = query_data[i];

        full_data[data.url] = data.sample_data_status;

        var start_date = (typeof(data.date_created) == 'string') ? new Date(data.date_created) : data.date_created;
        var end_display = null;
        if (data.date_finished) {
            var end_date = (typeof(data.date_finished) == 'string') ? new Date(data.date_finished) : data.date_finished;
            end_display = end_date.toString();
            finished_count++;
        }

        var query_id;
        var matches = data.url.match(/([0-9]+)$/);
        if (matches) {
            query_id = matches[0];
        }

        this.addParam('queries', {
            sql: data.sql_code,
            status: data.status,
            url: data.url,
            start: start_date.toString(),
            end: end_display,
            query_id: query_id
        });
    }
    SQLShare.onUpdateFinishQueryCount.fire(finished_count);

    this._data = full_data;

    this.setParam('total_tasks', len);
    this.setParam('running_tasks', len - finished_count);
    this.setParam('finished_tasks', finished_count);

};

SQLShare.View.QueryQueue.Display.prototype.updateData = function(data) {
    var current = this._data;

    var new_data = {};
    var changed_data = false;
    for (var i = 0; i < data.length; i++) {
        var url = data[i].url;
        var status = data[i].sample_data_status;

        if (!current[url]) {
            changed_data = true;
            new_data[url] = status;
            delete current[url];
        }
        else if (current[url] != status) {
            changed_data = true;
            new_data[url] = status;
        }
        else {
            new_data[url] = status;
            delete current[url];
        }
    }

    for (var url in current) {
        changed_data = true;
    }

    this._data = new_data;
    return changed_data;
};

SQLShare.View.QueryQueue.Display.prototype.postRender = function() {
    var col_defs = [
        { key:'sql', label: 'SQL', sortable: true, formatter: this.formatSQL },
        { key:'start', label: 'Started', sortable: true, formatter:this.formatDate, width: 200},
        { key:'status', label: 'Status', sortable: true, width: 110 },
        { key:'remove', label: '', sortable: false, width: 20 }
    ];

    var data_source = new YAHOO.util.DataSource(YAHOO.util.Dom.get('js-query-queue-table'));
    data_source.responseType = YAHOO.util.DataSource.TYPE_HTMLTABLE;
    data_source.responseSchema = {
        fields: [
            {key: 'sql' },
            {key: 'start', parser:'date' },
            {key: 'status' },
            {key: 'remove' },
            {key: 'id' },
            {key: 'finished' }
        ]
    };

    var width = document.getElementById('ss_app_workspace').offsetWidth;
    var height = document.getElementById('ss_app_workspace').offsetHeight;
    var table_height = height - 80;

    var data_table = new YAHOO.widget.ScrollingDataTable('js-query-queue', col_defs, data_source, {
        sortedBy: { key: 'start', dir: 'asc' },
        height: table_height+"px"
    });
    SQLShare._DATA_TABLE = data_table;
};

SQLShare.View.QueryQueue.Display.prototype.formatSQL = function(elLiner, oRecord, oColumn, oData) {
    var field = oColumn.getKey();

    var id = oRecord.getData('id');
    var s = oRecord.getData('status');
    var f = oRecord.getData('finished');
    if (f == '1') {
        value = ['<span class="view_queue_entry" id="js-query-', id, '">', oRecord.getData(field), '</span>'].join('');
    }
    else {
        value = ['<span class="in_queue_unfinished">', oRecord.getData(field), '</span>'].join('');
    }

    elLiner.innerHTML = value;
};

SQLShare.View.QueryQueue.Display.prototype.formatDate = function(elLiner, oRecord, oColumn, oData) {
    var field = oColumn.getKey();

    var view = new SQLShare.View.TableDateCell({
        date_obj:  new Date(oRecord.getData(field)) //oRecord.getData('create_date')
    });

    var class_name = 'in_queue_unfinished';
    if (oRecord.getData('finished')) {
        class_name = 'view_queue_entry';
    }

    elLiner.innerHTML = ['<span class="',class_name,'">',view.toString(),'</span>'].join('');
};



