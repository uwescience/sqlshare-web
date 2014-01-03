"use strict";
SQLShare.View.UploaderOptions = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'uploader/table_options.html';
};

SQLShare.View.UploaderOptions.prototype = new SQLShare.View();

SQLShare.View.UploaderOptions.prototype.generateParams = function() {
    var options = this.model;
//    var table_data = options.parser.table;

    this.setParam('id', options.container_id);
    this.setParam('title', options.dataset_name);
//    if (table_data.description) {
 //       this.setParam('description', table_data.description);
   // }

//    if (table_data.is_public) {
        this.setParam('is_public', true);
//    }

};

