var Uploader = function(div_id, args) {
    this.id = div_id;
};

Uploader.prototype = new QueryBase();

Uploader.prototype.draw = function() {
    this._renderTo(this.id, 'uploader/step1.html', { id : this.id });

    this._buildUploader();

    $(document).trigger("sqlshare_content_change");
};

Uploader.prototype._buildUploader = function() {
    var me = this;
    $("#sqlshare_uploader").fileupload({
        url: Solstice.getDocumentBase() + "/sqlshare/upload/",
        add: function(e, data) {
            var params = {};
            params.files = [];

            var file_info = data.files[0];
            var display_size = me._formatBytes(file_info.size);
            params.files.push({
                name: file_info.name,
                size: file_info.size,
                display_size: display_size,
                container_id: me.id,
                file_id: file_info.name,

            });

            Solstice.Element.hide('ss_upload_error');
            Solstice.Element.hide(me.id+"_selectFilesLink");
            Solstice.Element.hide(me.id+"_step1_next_wrapper");
            me._renderTo(me.id+'_files_list', 'uploader/file_list.html', params);

            data.submit();
        },
        progressall: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);

            var width = 5 * progress;
            document.getElementById(me.id+"_file_status").style.width = width+"px";
        },
        done: function(e, data) {
            var response = jQuery.parseJSON(data.result);

            me.AsyncGET(me._getRestRoot()+"parser/"+response.ss_id+"/"+response.sol_id, function(ev) {
                var data = ev.data;
                me._postParser(data);
            });
        }
    });

};

Uploader.prototype._initUploader = function() {
    this.uploader.setAllowMultipleFiles(false);
    Solstice.Element.show(this.id+'_selectFilesLink');
}

Uploader.prototype._onFileSelect = function(event) {
    var params = {};
    params.files = [];
    for (name in event.fileList) {
        var file = event.fileList[name];
        var display_size = this._formatBytes(file.size);
        this._current_file_name = file;
        this._display_size = display_size;
        params.files.push({
            name            : file.name,
            size            : file.size,
            display_size    : display_size,
            container_id    : this.id,
            file_id         : name
        });
    }

    Solstice.Element.hide('ss_upload_error');
    Solstice.Element.hide(this.id+"_selectFilesLink");
    Solstice.Element.hide(this.id+"_step1_next_wrapper");
    this._renderTo(this.id+'_files_list', 'uploader/file_list.html', params);
};

Uploader.prototype._formatBytes = function(size) {
    if (size < 1024) {
        return Solstice.Lang.getString('SQLShare', 'file_size_bytes', { size: size });
    }
    size /= 1024;
    if (size < 1024) {
        size = Math.round(size * 100) / 100;
        return Solstice.Lang.getString('SQLShare', 'file_size_kilo', { size: size });
    }
    size /= 1024;
    if (size < 1024) {
        size = Math.round(size * 100) / 100;
        return Solstice.Lang.getString('SQLShare', 'file_size_mega', { size: size });
    }
    size /= 1024;
    size = Math.round(size * 100) / 100;
    return Solstice.Lang.getString('SQLShare', 'file_size_giga', { size: size });
}

Uploader.prototype._onUploadProgress = function(ev) {
    var width = Math.round(500*(ev["bytesLoaded"]/ev["bytesTotal"]));
    document.getElementById(this.id+"_"+ev.id+"_file_status").style.width = width+"px";
};

Uploader.prototype._onSuccess = function(ev) {
    var data = ev.data;

    this.AsyncGET(this._getRestRoot()+"parser/"+data.ss_id+"/"+data.sol_id, function(ev) {
        var data = ev.data;
        this._postParser(data);
    });
};

Uploader.prototype._onAllFinished = function(ev) {
    Solstice.Element.show(this.id+"_analyzing_display");
    this._postFiles();
};

Uploader.prototype._postFiles = function(ev) {
    var elements = document.getElementsByName(this.id+'_upload_file');
    var ids = [];
};

Uploader.prototype._beginFile = function(id) {
    this.AsyncPOST(this._getRestRoot()+"/file/init", { id: id }, this._fetchFileOptions);
};

Uploader.prototype._fetchFileOptions = function(o) {
    if (o.code != 200) {
        // Error?
        this._showUploadError();
        return;
    }

    this.AsyncPOST(this._getRestRoot()+"/file/parser", o.data, this._postParser);
};


Uploader.prototype._postParser = function(data) {
    this._current_file_name = data.dataset_name;
    this._parser_options = data;
    this._original_columns = data.columns;
    this._drawParserOptions(data);
}

Uploader.prototype._showUploadError = function() {
    Solstice.Element.hide(this.id+'_analyzing_display');
    Solstice.Element.show('ss_upload_error');
    Solstice.Element.show(this.id+"_selectFilesLink");
};

Uploader.prototype._drawParserOptions = function(options) {
    var columns = options.columns;

    this._parser_options = options;
    this._parser_options.container_id = this.id;

    var column_params = [];
    var table_cols = [];
    for (var i = 0; i < columns.length; i++) {
        table_cols.push(columns[i].name);
        column_params.push({
            name: columns[i].name
        });
    }


    this._renderTo(this.id, new SQLShare.View.ParserOptions(this._parser_options));

    this._drawTable("upload_results", table_cols, options.sample_data);

    var me = this;
    $(slash_selector("#"+this.id+"_delimiter")).on("change", function(ev) {
        me._updatePreview(ev);
    });
    $(slash_selector("#"+this.id+"_has_column_header")).on("change", function(ev) {
        me._updatePreview(ev);
    });
    $(slash_selector("#"+this.id+"_step_3")).on("click", function(ev) {
        ev.preventDefault();
        me._loadStep3(ev);
    });
    $(slash_selector("#"+this.id+"_step_1")).on("click", function(ev) {
        ev.preventDefault();
        me._loadStep1Back(ev);
    });
    $(slash_selector("#"+this.id+"_cancel")).on("click", function(ev) {
        ev.preventDefault();
        me._cancel(ev);
    });

    $(document).trigger("sqlshare_content_change");
};

Uploader.prototype._step2Next = function(ev) {
    this._drawParserOptions(this._parser_options);
}

Uploader.prototype._loadStep2Back = function(ev) {
    this._drawParserOptions(this._parser_options);
}

Uploader.prototype._loadStep1Back = function(ev) {
    this._renderTo(this.id, "uploader/step1.html", {
        file_name   : this._current_file_name,
        size        : this._display_size,
        is_back     : true,
        id          : this.id
    });

    this._buildUploader();


    var me = this;
    $(slash_selector("#"+this.id+"_clear_upload")).on("click", function(ev) {
        ev.preventDefault();
        me._clearFiles(ev);
    });
    $(slash_selector("#"+this.id+"_step1")).on("click", function(ev) {
        ev.preventDefault();
        me._step2Next(ev);
    });
    $(slash_selector("#"+this.id+"_cancel")).on("click", function(ev) {
        ev.preventDefault();
        me._cancel(ev);
    });

    $(document).trigger("sqlshare_content_change");
}

Uploader.prototype._loadStep3 = function(ev) {
    this.delimiter = document.getElementById(this.id+'_delimiter').value;
    this.has_header = document.getElementById(this.id+'_has_column_header').checked ? true : false;

    this._parser_options.parser.has_column_headers = this.has_header;
    this._renderTo(this.id, new SQLShare.View.UploaderOptions(this._parser_options));

    var available_tags = [];

    if (SQLShare._ALL_TAGS) {
        for (var key in SQLShare._ALL_TAGS) {
            if (SQLShare._ALL_TAGS.hasOwnProperty(key)) {
                available_tags.push(key);
            }
        }
    }

    $("#upload_tags").tagit({
        availableTags: available_tags,
    });



    //"uploader/table_options.html", { id : this.id, title: this._current_file_name });

    var me = this;
    $(slash_selector("#"+this.id+"_load_table")).on("click", function(ev) {
        ev.preventDefault();
        me._loadTable(ev);
    });
    $(slash_selector("#"+this.id+"_back_to_2")).on("click", function(ev) {
        ev.preventDefault();
        me._loadStep2Back(ev);
    });
    $(slash_selector("#"+this.id+"_cancel")).on("click", function(ev) {
        ev.preventDefault();
        me._cancel(ev);
    });
};

Uploader.prototype._updatePreview = function() {
    var delimiter = document.getElementById(this.id+'_delimiter').value;
    var has_header = document.getElementById(this.id+'_has_column_header').checked ? true : false;

    this._parser_options.delimiter = delimiter;
    this._parser_options.has_header = has_header;
    this._parser_options.columns = this._original_columns;

    var sol_id = this._parser_options.sol_id;
    var ss_id = this._parser_options.ss_id;

    this.AsyncPUT(this._getRestRoot()+"parser/"+ss_id+"/"+sol_id, this._parser_options, this._postReParse);
};

Uploader.prototype._postReParse = function(o) {
    if (o.code == 200) {
        this._drawParserOptions(o.data);
        Solstice.Element.hide(this.id+'_parser_info');
        Solstice.Element.show(this.id+'_parser_changed');
    }
    else {
        this._drawParserError();
    }
};

Uploader.prototype._drawParserError = function(o) {
    Solstice.Element.hide('dataset_preview_container');
    Solstice.Element.show('dataset_preview_error_container');
};

Uploader.prototype._loadTable = function(ev) {

    Solstice.Element.hide('ss_title_required');
    Solstice.Element.hide('ss_title_invalid');

    var is_public = false;
    var checkbox = document.getElementById(this.id+'_is_public');

    if (document.getElementById(this.id+'_is_public').checked) {
        is_public = true;
    }

    var options = this._parser_options.parser;

    var base_name = document.getElementById(this.id+'_table_title').value;
    if (base_name == "") {
        Solstice.Element.show('ss_title_required');
        return;
    }

    if (base_name.length > 120) {
        Solstice.Element.show('ss_title_invalid');
        return;
    }
    if (base_name.match(/[^a-z0-9!@$%^&\*\(\)_\-=\[\]{}\|;:'",\.<> ]/i)) {
        Solstice.Element.show('ss_title_invalid');
        return;
    }

    options.table_name        = base_name;
    options.table_description = document.getElementById(this.id+'_description').value;
    options.tags = $("#upload_tags").tagit("assignedTags");

    this._final_table_name = base_name;
    this._query_name = document.getElementById(this.id+'_table_title').value;

    this._options = options;
    this._ss_id = this._parser_options.ss_id;

    this._renderTo(this.id, "uploader/uploading.html", {});
    var request = this.AsyncPUT(this._getRestRoot()+"/file/upload", {
        parser:         this._parser_options.parser,
        sol_id:         this._parser_options.sol_id,
        ss_id:          this._parser_options.ss_id,
        table_name:     this._parser_options.table_name,
        dataset_name:   base_name,
        description:    options.table_description,
        is_public:      is_public,
        columns:        this._parser_options.columns,
        sample_data:    this._parser_options.sample_data
    }, this._postLoadTable, null, {
        progress: function(o) {
            var content = o.target.responseText;

            try {
                var matches = content.match(/^{"total":([0-9]+), "progress":"([\.]+)/);
                if (matches) {
                    var percent = matches[2].length / matches[1];
                    document.getElementById('upload_progress_meter').style.width = parseInt(percent * 100)+"px";
                }
            }
            catch(e) { console.log(e); }
        }
    });

    this._options.is_public   = is_public;
};


Uploader.prototype._postLoadTable = function(o) {
    if (o.code == 200) {
        var data = o.data;
        if (data.error) {
            var detail = '';
            if (data && data.error) {
                detail = data.error;
            }
            this._renderTo(this.id, "uploader/error.html", { detail: detail});
        }
        else {
            this._getFileUploadStatus();
        }
    }
    else {
        this._renderTo(this.id, "uploader/error.html", { });
    }
};

Uploader.prototype._getFileUploadStatus = function() {
    this.AsyncGET(this._getRestRoot()+"/proxy/REST.svc/v3/file/"+this._ss_id+"/database", this._postGetFileStatus);
};

Uploader.prototype._postGetFileStatus = function(o) {
    if (o.code == 202) {
        var uploader = this;
        var data = o.data;
        var total = data.records_total;
        var uploaded = data.records_uploaded;

        if (total > 0) {
            var percent = uploaded / total;
            document.getElementById('upload_progress_meter').style.width = 100 + parseInt(percent * 100)+"px";
        }

        window.setTimeout(function() {
            uploader.AsyncGET(uploader._getRestRoot()+"/proxy/REST.svc/v3/file/"+uploader._ss_id+"/database", uploader._postGetFileStatus);
        }, 2000);
        return;
    }
    else if (o.code == 201) {
        var new_location = o.conn.getResponseHeader['Location'];
        var destination = 'query/'+solstice_user.sqlshare_schema+'/'+this._final_table_name;

        var tags = this._options.tags;
        if (tags) {
            this.AsyncPUT(this._getRestRoot()+"/proxy/REST.svc/v2/db/dataset/"+solstice_user.sqlshare_schema+"/"+this._options.table_name+"/tags", [{"name":solstice_user.sqlshare_schema, "tags":tags }], this._postSaveTags, destination);
        }
        else {
            var url = destination.replace(/^\/REST.svc\/v1\/db\//, '');
            $.History.go("s="+decodeURI(url));
        }
        return;
    }
    else {
        this._renderTo(this.id, "uploader/error.html", { detail: o.data.Detail });
        return;
    }
};

Uploader.prototype._postSaveTags = function(o, destination) {
    var url = destination.replace(/^\/REST.svc\/v1\/db\//, '');
    $.History.go("s="+decodeURI(url));
};

Uploader.prototype._cancel = function() {
    window.location.href = "sqlshare/#s=home";
};

