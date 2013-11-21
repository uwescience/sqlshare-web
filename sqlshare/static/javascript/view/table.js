SQLShare.View.Table = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'table/display.html';
};

SQLShare.View.Table.prototype = new SQLShare.View();

SQLShare.View.Table.prototype.generateParams = function() {
    var table = this.model;

    this.setParam('id', table.container_id);
    this.setParam('is_public', table.is_public);
    this.setParam('tablename', table.tablename);
    this.setParam('description', table.description);
    this.setParam('row_count', table.rows);

    for (var i in table.columns) {
        var column = table.columns[i];
        this.addParam('columns', {
            name    : column.name,
            db_type : column.dbtype
        });
    }

    for (var i in table.sample_data) {
        var row = table.sample_data[i];
        var params = [];
        for (var j in row) {
            var val = row[j];
            params.push({ value: val });
        }
        this.addParam('rows', { values: params });
    }
};

