SQLShare.View.TableOwnerCell = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'all_queries/table_owner_cell.html';
};

SQLShare.View.TableOwnerCell.prototype = new SQLShare.View();

SQLShare.View.TableOwnerCell.prototype.generateParams = function() {
    var model = this.model;

    this.setParam('owner', model.owner);
    this.setParam('is_public', model.is_public);
    this.setParam('is_shared', model.is_shared);
    this.setParam('is_owner', (model.owner == solstice_user.login_name ? true : false));
};


