var SharedQueries = function(div_id) {
    this.id = div_id;
};

SharedQueries.prototype = new SSBase();

SharedQueries.prototype.draw = function() {
    this._renderTo(this.id, 'shared_queries/loading.html', { id : this.id });
    this._fetchQueries();
};

SharedQueries.prototype._fetchQueries = function() {
    this.setCurrentRequest(this.AsyncGET(this._getRestRoot()+"/proxy/REST.svc/v2/db/dataset", this._postFetch));
};

SharedQueries.prototype._postFetch = function(o) {
    if (o.code == 200) {
        this._drawQueries(o.data);
    }
    else {
        this._renderTo(this.id, 'shared_queries/error.html', {});
    }
};

SharedQueries.prototype._drawQueries = function(data) {
    var my_data = [];

    for (var i = 0; i < data.length; i++) {
        if ((data[i].owner != solstice_user.login_name) && (data[i].is_shared == true) && (data[i].is_public == false)) {
            my_data.push(data[i]);
        }
    }
    my_data.container_id = this.id;

    this._renderTo(this.id, new SQLShare.View.SharedQueries.List(my_data));
    $(document).trigger("sqlshare_content_change");
};


