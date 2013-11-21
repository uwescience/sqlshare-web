SQLShare.View.SavedQuery.ChangeDescription = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'saved_query/change_description.html';
};

SQLShare.View.SavedQuery.ChangeDescription.prototype = new SQLShare.View();

SQLShare.View.SavedQuery.ChangeDescription.prototype.generateParams = function() {
    var query = this.model;

    this.setParam('id', query.container_id);
    this.setParam('name', query.name);
    
    if (query.description) {
        this.setParam('description', query.description);
    }

    if (query.owner == solstice_user.login_name) {
        this.setParam('is_editable', true);
        this.setParam('is_owner', true);
    }

};

SQLShare.View.SavedQuery.ChangeDescription.prototype.postRender = function() {
    if (this.model.owner == solstice_user.login_name) {
        document.getElementById(this.model.container_id+'_description').focus();
    }

};
