var MyQueries = function(div_id) {
    this.id = div_id;
};

MyQueries.prototype = new SSBase();

MyQueries.prototype.draw = function() {
    this._renderTo(this.id, 'all_queries/loading.html', { id : this.id });
    this._fetchQueries();
};

MyQueries.prototype._fetchQueries = function() {
    this.setCurrentRequest(this.AsyncGET(this._getRestRoot()+"/proxy/REST.svc/v2/db/dataset/"+solstice_user.login_name, this._postFetch));
};

MyQueries.prototype._postFetch = function(o) {
    if (o.code == 200) {
        this._drawQueries(o.data);
    }
    else {
        this._renderTo(this.id, 'my_queries/error.html', {});
    }
};

MyQueries.prototype._drawQueries = function(data) {
    var my_data = [];
    my_data.container_id = this.id;
    for (var i = 0; i < data.length; i++) {
        my_data.push(data[i]);
    }
    this._renderTo(this.id, new SQLShare.View.MyQueries.List(my_data));
    SQLShare.onChangeContent.fire();
};


