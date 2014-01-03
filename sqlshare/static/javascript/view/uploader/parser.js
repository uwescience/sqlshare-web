"use strict";
SQLShare.View.ParserOptions = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'uploader/parser_options.html';
};

SQLShare.View.ParserOptions.prototype = new SQLShare.View();

SQLShare.View.ParserOptions.prototype.generateParams = function() {
    var options = this.model;

    if (options.parser.has_column_headers) {
        this.setParam('has_column_headers', true);
    }

    this.setParam('col_count', options.columns.length);
    this.setParam('id', options.container_id);

    var base_delimiters = [
        { display: ',', value: ',' },
        { display: '|', value: '|' },
        { display: 'Tab', value: "\\t" }
    ];

    if (options.parser.delimiter == "\t") {
        options.parser.delimiter = "\\t";
    }

    var found_delimiter = false;
    for (var i = 0; i < base_delimiters.length; i++) {
        var selected = false;
        if (base_delimiters[i].value == options.parser.delimiter) {
            selected = true;
            found_delimiter = true;
        }

        this.addParam('delimiters', {
            value: base_delimiters[i].value,
            display: base_delimiters[i].display,
            selected: selected
        });
    }

    if (!found_delimiter) {
        this.addParam('delimiters', {
            value: options.parser.delimiter,
            display: options.parser.delimiter,
            selected: true
        });
    }
};

