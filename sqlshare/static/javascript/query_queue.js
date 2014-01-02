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

    var me = this;
    $("#js-query-queue-table .remove_query").on("click", function(ev) {
        var target = ev.target;
        var id = target.id.replace(/^remove_/, '');
        var type = target.rel;
        me.AsyncDELETE(me._getRestRoot()+'/proxy/'+id, me._postDelete, { type: type });

    });

    $(document).trigger("sqlshare_content_change");

    var me = this;
    this.setCurrentTimeout(window.setTimeout(function() { me._fetchUpdates(); }, 2000));
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


