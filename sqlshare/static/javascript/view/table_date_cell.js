"use strict";
SQLShare.View.TableDateCell = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'all_queries/table_date_cell.html';
};

SQLShare.View.TableDateCell.prototype = new SQLShare.View();

SQLShare.View.TableDateCell.prototype.generateParams = function() {
    var model = this.model;

    this._addDateParams(model.date_obj);

};


