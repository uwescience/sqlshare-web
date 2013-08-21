var QueryQueue = function(div_id) {
    this.id = div_id;
};

QueryQueue.prototype = new SSBase();

QueryQueue.prototype.draw = function() {
    this._renderTo(this.id, 'query_queue/loading.html', { id : this.id });
    this._fetchQueries();
};

QueryQueue.prototype._fetchQueries = function() {
    this.setCurrentRequest(this.AsyncGET(this._getRestRoot()+"/proxy/REST.svc/v2/db/process", this._postFetch));
};

QueryQueue.prototype._fetchUpdates = function() {
    this.setCurrentRequest(this.AsyncGET(this._getRestRoot()+"/proxy/REST.svc/v2/db/process", this._postFetchUpdates));
};

QueryQueue.prototype._postFetch = function(o) {
    if (o.code == 200) {
        this._drawQueries(o.data);
    }
    else {
        this._renderTo(this.id, 'all_queries/error.html', {});
    }
};

QueryQueue.prototype._postFetchUpdates = function(o) {
    if (o.code == 200) {
        this._updateQueries(o.data);
    }
    else {
        this.setCurrentTimeout(window.setTimeout(function() { me._fetchUpdates(); }, 10 * 1000));
    }
};

QueryQueue.prototype._updateQueries = function(data) {
    if (this.view.updateData(data)) {
        this._drawQueries(data);
    }
    else {
        var me = this;
        this.setCurrentTimeout(window.setTimeout(function() { me._fetchUpdates(); }, 10 * 1000));
    }
};

QueryQueue.prototype._drawQueries = function(data) {
    data= data.sort(function(a,b) {
        if (!a.create_date_obj) {
            a.create_date_obj = new Date(a.date_created)
        }
        if (!b.create_date_obj) {
            b.create_date_obj = new Date(b.date_created)
        }

        if (a.create_date_obj.getTime() > b.create_date_obj.getTime()) {
            return -1;
        }
        if (a.create_date_obj.getTime() < b.create_date_obj.getTime()) {
            return 1;
        }
        return 0;
    });

    this.view = new SQLShare.View.QueryQueue.Display({
        container_id: this.id,
        queries     : data
    });

    this._renderTo(this.id, this.view);

    SQLShare._DATA_TABLE.subscribe("cellClickEvent", this._handleListClick, this, true);

    SQLShare.onChangeContent.fire();

    var me = this;
    this.setCurrentTimeout(window.setTimeout(function() { me._fetchUpdates(); }, 2000));
};

QueryQueue.prototype._handleListClick = function(ev) {
    var target = ev.target;
    var td = target.children[0];
    var check_els = [];
    check_els.push(td);
    for (var i = 0; i < check_els.length; i++) {
        var el = check_els[i];
        if (el.className == 'remove') {
            var id = el.id.replace(/^remove_/, '');
            var type = target.rel;
            this.AsyncDELETE(this._getRestRoot()+'/proxy/'+id, this._postDelete, { type: type });
            return;
         }
        else if (el.className == 'view_queue_entry') {
            var id = el.id.replace(/^js-query-/, '');
            window.location.href = 'sqlshare/#s=query/'+id;
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

QueryQueue.prototype._postDelete = function(o, args) {
    if (o.code == 410) {
        this.draw();

        var type = args.type;
        if (type == 'remove') {
            Solstice.Message.setSuccess(Solstice.Lang.getMessage('SQLShare', 'queued_query_removed'));
        }
        else {
            Solstice.Message.setSuccess(Solstice.Lang.getMessage('SQLShare', 'queued_query_cancelled'));
        }
    }
};


