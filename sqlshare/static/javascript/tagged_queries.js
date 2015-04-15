var TaggedQueries = function(div_id, tag) {
    this.id = div_id;
    this.tag = tag.toLowerCase();
};

TaggedQueries.prototype = new SSBase();

TaggedQueries.prototype.draw = function() {
    this._renderTo(this.id, 'tagged_queries/loading.html', { id : this.id });
    this._fetchQueries();
};

TaggedQueries.prototype._fetchQueries = function() {
    this.setCurrentRequest(this.AsyncGET(this._getRestRoot()+"/proxy/v3/db/dataset/tagged/"+this.tag, this._postFetch));
};

TaggedQueries.prototype._postFetch = function(o) {
    if (o.code == 200) {
        this._drawQueries(o.data);
    }
    else {
        this._renderTo(this.id, 'tagged_queries/error.html', {});
    }
};

TaggedQueries.prototype._drawQueries = function(data) {
    var my_data = [];
    my_data.container_id = this.id;
    for (var i = 0; i < data.length; i++) {
        var tags = data[i].tags;
        var found = false;
        for (var p = 0; p < tags.length; p++) {
            if (found) {
                break;
            }
            var person_tags = tags[p].tags;
            for (var t = 0; t < person_tags.length; t++) {
                var tag = person_tags[t];
                if (tag.toLowerCase() == this.tag) {
                    my_data.push(data[i]);
                    found = true;
                    break;
                }
            }
        }
    }
    this._renderTo(this.id, new SQLShare.View.TaggedQueries.List(my_data, this.tag));
    $(document).trigger("sqlshare_content_change");
};


