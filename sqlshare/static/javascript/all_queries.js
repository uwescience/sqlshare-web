"use strict";
var AllQueries = function(div_id) {
    this.id = div_id;
};

AllQueries.prototype = new SSBase();

AllQueries.prototype.draw = function() {
    this._renderTo(this.id, 'all_queries/loading.html', { id : this.id });
    this._fetchQueries();
};

AllQueries.prototype._fetchQueries = function() {
    this.setCurrentRequest(this.AsyncGET(this._getRestRoot()+"/proxy/REST.svc/v2/db/dataset", this._postFetch));
};

AllQueries.prototype._postFetch = function(o) {
    if (o.code == 200) {
        this._drawQueries(o.data);
    }
    else {
        this._renderTo(this.id, 'all_queries/error.html', {});
    }
};

AllQueries.prototype._drawQueries = function(data) {
    data.container_id = this.id;
    this._renderTo(this.id, new SQLShare.View.AllQueries.List(data));

    $(document).trigger("sqlshare_content_change");
};


