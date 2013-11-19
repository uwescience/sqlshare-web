var SolView = function(model){
    this.model = model;
    this.params = {};
    this._child_views = {};
    this.template = '';
};

SolView.prototype = new SolBase();
SolView.prototype.container_id = '';

SolView.prototype.generateParams = function(){};

SolView.prototype.paint = function() {
    var content = this.toString();
    var container = document.getElementById(this.container_id);
    if (!container) {
        throw("No element found for id "+this.container_id);
    }
    container.innerHTML = content;

    // Run any inline javascript (ie register client actions, etc)
    var regEx = /<script>(.+?)<\/script>/g;
    var result;
    while((result = regEx.exec(content)) != null){
        try {
            eval(result[1]);
        }catch(exception){}
    }
    var child_views = this.getChildViews();
    for(var key in child_views){
        var child_view = child_views[key];
        child_view.paint();
    }
};

SolView.prototype.toString = function() {
    this.generateParams();

    return HandlebarsUtils.to_string(this.template, this.params);

};

SolView.prototype.setParam = function(key, value) {
    this.params[key] = value;
};

SolView.prototype.addParam = function(key, values) {
    if (!this.params[key]) {
        this.params[key] = [];
    }
    if (typeof this.params[key] != "object") {
        throw("Can't call addParam - "+key+" is already a non-array type.  value: "+this.params[key]);
    }
    if (typeof values != "object") {
        throw("Can't call addParam - the values given for "+key+" are not a hash");
    }
    this.params[key].push(values);
};

SolView.prototype.addChildView = function(key, view){
    this._child_views[key] = view;   
}

SolView.prototype.getChildView = function(key){
    return this._child_views[key];
}

SolView.prototype.getChildViews = function(){
    return this._child_views;    
}
