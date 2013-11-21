var ManageCredentials = function(div_id, query_id) {
    this.id = div_id;
    this.query_id = query_id;
};

ManageCredentials.prototype = new SSBase();

ManageCredentials.prototype.draw = function() {
    this._renderTo(this.id, 'manage_credentials/loading.html', { id : this.id });
    this.setCurrentRequest(this.AsyncGET(this._getRestRoot()+"/credentials", this._postFetch));
};

ManageCredentials.prototype._postFetch = function(o) {
    if (o.code == 200) {
        this._drawInterface(o.data);
    }
    else {
        this._renderTo(this.id, 'manage_credentials/error.html', {});
    }
};

ManageCredentials.prototype._drawInterface = function(data) {
    this._renderTo(this.id, 'manage_credentials/interface.html', {
        key: data.key
    });

    var me = this;
    YAHOO.util.Event.addListener('create_new_credentials', 'click', function() {
        if (confirm("This will break any apps using your current credentials, are you sure you want to do that?")) {
            me.AsyncPUT(me._getRestRoot()+"/credentials", null, me._postFetch)
        }
    });
};


