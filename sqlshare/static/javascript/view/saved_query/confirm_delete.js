SQLShare.View.SavedQuery.ConfirmDelete = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'saved_query/confirm_delete.html';
};

SQLShare.View.SavedQuery.ConfirmDelete.prototype = new SQLShare.View();

SQLShare.View.SavedQuery.ConfirmDelete.prototype.generateParams = function() {
    var query = this.model;

    this.setParam('id', query.container_id);

    this.setParam('name', query.name);
};
