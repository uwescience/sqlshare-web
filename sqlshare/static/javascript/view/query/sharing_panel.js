"use strict";
SQLShare.View.Query.SharingPanel = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'query/sharing_panel.html';

    Solstice.Element.hide('js-dataset-sharing-changed');
    Solstice.Element.hide('js-dataset-sharing-changed-with-users');
    Solstice.Element.hide('js-dataset-sharing-changed-public');

    Solstice.Element.show('js-dataset-sharing-info');
    Solstice.Element.show('js-dataset-sharing-info-public');
};

SQLShare.View.Query.SharingPanel.prototype = new SQLShare.View();

SQLShare.View.Query.SharingPanel.prototype.generateParams = function() {
    var data = this.model;
    var dataset = data.dataset;
    var permissions = data.permissions;

    var emails = permissions.emails || [];
    var users  = permissions.users || [];

    this._user_lookup = {};
    this._email_lookup = {};

    var all_accounts = [];
    for (var i = 0; i < emails.length; i++) {
        this._email_lookup[emails[i]] = true;
        var rel_value = emails[i].replace(/"/g, '__quote__');
        all_accounts.push({
            type:       'email',
            rel:        rel_value,
            sort_key:   emails[i],
            email:      emails[i]
        });
    }

    for (var i = 0; i < users.length; i++) {
        this._user_lookup[users[i].login] = true;
        all_accounts.push({
            type:       'user',
            sort_key:   users[i].login,
            login:      users[i].login,
            name:       (users[i].name ? users[i].name : ''),
            surname:    (users[i].surname ? users[i].surname : ''),
            email:      (users[i].origin_email ? users[i].origin_email : '')
        });
    }

    var sorted = all_accounts.sort(function(a,b) {
        if (a.sort_key > b.sort_key) {
            return 1;
        }
        if (a.sort_key < b.sort_key) {
            return -1;
        }
        return 0;
    });

    this.account_data = [];
    for (var i = 0; i < sorted.length; i++) {
        var entry = sorted[i];

        var current_data = {
            is_user:    (entry.type == "user" ? true : false),
            email:      entry.email,
            name:       entry.name,
            surname:    entry.surname,
            login:      entry.login,
            rel:        entry.rel
        };
        this.addParam('accounts', current_data);
        this.account_data.push(current_data);
    }

    if (sorted.length) {
        this.setParam('has_users', true);
    }

    this.setParam('is_public', dataset.is_public);
    this.setParam('dataset_name', dataset.name);
    this.setParam('owner_name', solstice_user.name);
    this.setParam('owner_surname', solstice_user.surname);

};


SQLShare.View.Query.SharingPanel.prototype.postRender = function() {
    this._buildPermissionsTable();
    this._buildAutoComplete();

    var dataset = this.model.dataset;
    if (dataset.is_public) {
        Solstice.Element.show('share_data_public');
    }
    else {
        Solstice.Element.show('share_data_workspace');
    }

    var me = this;
    $(".js-make_dataset_public").on("click", function(ev) {
        me._makeDatasetPublic(ev);
    });
    $(".js-make_dataset_private").on("click", function(ev) {
        me._makeDatasetPrivate(ev);
    });
    $(".js-close-sharing-panel").on("click", function(ev) {
        me._closeDialog(ev);
    });
    $("#sharing_panel_cancel").on("click", function(ev) {
        me._closeDialog(ev);
    });
    $("#sharing_panel_save").on("click", function(ev) {
        me._saveChanges(ev);
    });
};

SQLShare.View.Query.SharingPanel.prototype._handleListClick = function(ev) {
    ev.preventDefault();
    var el = $(ev.target);

    var row = null;
    if (el.hasClass('js-remove_account')) {
        var account = el.attr('rel');
        delete this._user_lookup[account];
        var row = this._getTableRow(el);
    }
    else if (el.hasClass('js-remove_email')) {
        var email = el.attr('rel');
        delete this._email_lookup[email];
        email = email.replace(/__quote__/g, '"');
        delete this._email_lookup[email];
        var row = this._getTableRow(el);
    }

    this.datatable.fnDeleteRow(row[0]);
    this._permissionsChanged();

};

SQLShare.View.Query.SharingPanel.prototype._makeDatasetPrivate = function(ev) {
    Solstice.Element.hide('share_data_public');
    Solstice.Element.show('share_data_workspace');
    this._permissionsChanged();
};

SQLShare.View.Query.SharingPanel.prototype._makeDatasetPublic = function(ev) {
    Solstice.Element.hide('share_data_workspace');
    Solstice.Element.show('share_data_public');
    this._permissionsChanged();
};

SQLShare.View.Query.SharingPanel.prototype._getTableRow = function(el) {
    while (el.prop('tagName').toLowerCase() != 'body' && el.prop('tagName').toLowerCase() != 'tr') {
        el = el.parent();
    }

    if (el.prop('tagName').toLowerCase() == 'tr') {
        return el;
    }

    return;
};

SQLShare.View.Query.SharingPanel.prototype._closeDialog = function() {
    $("#sharing_dataset_dialog").dialog("close");
};

SQLShare.View.Query.SharingPanel.prototype._saveChanges = function() {

    var value = document.getElementById('share_ds_autocomplete_input').value;

    if (value) {
        this.addEmail(value);
        document.getElementById('share_ds_autocomplete_input').value = '';
        var me = this;
        window.setTimeout(function() {
            me._saveChanges();
        }, 500);

        return;
    }

    Solstice.Element.hide('share_data_workspace');
    Solstice.Element.show('on_save_display');

    var accounts = [];
    var emails = [];

    for (var user in this._user_lookup) {
        accounts.push(user);
    }

    for (var email in this._email_lookup) {
        emails.push(email);
    }

    this.AsyncPUT(this._getRestRoot()+"/proxy/v3/db/dataset/"+this.model.dataset.container_id+"/permissions", {
        accounts: accounts,
        emails: emails,
        is_public: false
    }, this._postSavePermissions);

};


SQLShare.View.Query.SharingPanel.prototype._postSavePermissions = function(o) {
    if (o.code == 200) {
        $(document).trigger("sharing_panel_save");
        $("#sharing_dataset_dialog").dialog("close");
        Solstice.Message.setSuccess(Solstice.Lang.getMessage('SQLShare', 'dataset_permissions_updated'));
    }
    else {
        Solstice.Element.hide('on_save_display');
        Solstice.Element.show('share_data_workspace');
    }
};

SQLShare.View.Query.SharingPanel.prototype._buildPermissionsTable = function() {
    function name_formatter(data, type, row) {
        var data = {
            is_user : row[1],
            name    : row[2],
            surname : row[3],
            login   : row[4],
            email   : row[5]
        };

        return HandlebarsUtils.to_string('sharing_panel_name_cell', data);
    };

    function access_formatter(data, type, row) {
        var rel = row[6] || row[4];

        // Email item
        if (row[6]) {
            return '<span class="permission-action">Read-only <a href="javascript:void" class="remove-permission js-remove_email" rel="'+rel+'">x</a></span>';
        }
        else {
            // An actual account
            return '<span class="permission-action">Read-only <a href="javascript:void" class="remove-permission js-remove_account" rel="'+rel+'">x</a></span>';
        }
    };

    $('#permissions_wrapper').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="permissions_table"></table>' );
    var table_data = [];
    for (var i = 0; i < this.account_data.length; i++) {
        table_data.push([
            "", // dataTable gets upset w/ a null field.
            this.account_data[i].is_user,
            this.account_data[i].name,
            this.account_data[i].surname,
            this.account_data[i].login,
            this.account_data[i].email,
            this.account_data[i].rel
        ]);
    }

    var datatable = $("#permissions_table").dataTable({
        aaData: table_data,
        aoColumns: [
            { sTitle: "Name" },
            { sTitle: "" }
        ],
        aoColumnDefs: [
            { mRender: name_formatter, aTargets: [0] },
            { mRender: access_formatter, aTargets: [1] }
        ]
    });

    this.datatable = datatable;
    var me = this;
    $(".remove-permission").on("click", function(ev) {
        me._handleListClick(ev);
    });

};

SQLShare.View.Query.SharingPanel.prototype._buildAutoComplete = function() {
    var me = this;
    var user_data = {};
    var permissions_datatable = this.datatable;
    $("#share_ds_autocomplete_input").autocomplete({
        source: function(request, callback) {
            $.ajax({
                "url": me._getRestRoot()+"users?q="+request.term,
                "success": function(data) {
                    var callback_data = [];
                    for (var i = 0; i < data.users.length; i++) {
                        var user = data.users[i];
                        user_data[user.login] = user;

                        callback_data.push({ label: user.name+" "+user.surname+" ("+user.login+")", value: user.login });
                    }
                    callback(callback_data);
                },
                "error": function() {
                    callback([]);
                }
            });
        },
        select: function(ev, selected) {
            $("#share_ds_autocomplete_input").val("");
            var login_name = selected.item.value;
            var user_info = user_data[login_name];


            me._user_lookup[login_name] = true;
            me._permissionsChanged();

            permissions_datatable.fnAddData([
                "", // dataTable gets upset w/ a null field
                true, // actual user account
                user_info.name,
                user_info.surname,
                user_info.login,
                '',
                ''
            ]);

            $(".remove-permission").on("click", function(ev) {
                me._handleListClick(ev);
            });
            ev.preventDefault();
        }
    });

    $("#share_ds_autocomplete_input").on("keypress", function(ev) {
        if (ev.keyCode != 13) {
            return;
        }
        ev.preventDefault();
        me.addEmail($("#share_ds_autocomplete_input").val());
        $("#share_ds_autocomplete_input").val("");
    });

};

SQLShare.View.Query.SharingPanel.prototype.addEmail = function(value) {
    if (value == "") {
        return;
    }

    if (this._email_lookup[value]) {
        return;
    }

    this._email_lookup[value] = true;
    this._permissionsChanged();

    var permissions_datatable = this.datatable;
    var rel_value = value.replace(/"/g, '__quote__');
    var rel_value = value.replace(/&quot;/g, '__quote__');
    permissions_datatable.fnAddData([
        "",
        false, // not a user, just an email address
        '',
        '',
        value,
        rel_value
    ]);

    var me = this;
    $(".remove-permission").on("click", function(ev) {
        me._handleListClick(ev);
    });
};

SQLShare.View.Query.SharingPanel.prototype._permissionsChanged = function() {
    Solstice.Element.hide('js-dataset-sharing-info');
    Solstice.Element.hide('js-dataset-sharing-info-public');
    Solstice.Element.hide('js-dataset-sharing-changed-with-users');
    Solstice.Element.hide('js-dataset-sharing-changed');
    var has_shares = false;
    for (var email in this._email_lookup) {
        has_shares = true;
        break;
    }
    for (var user in this._user_lookup) {
        has_shares = true;
        break;
    }
    if (has_shares) {
        Solstice.Element.show('js-dataset-sharing-changed-with-users');
    }
    else {
        Solstice.Element.show('js-dataset-sharing-changed');
    }
    Solstice.Element.show('js-dataset-sharing-changed-public');
};

SQLShare.View.Query.SharingPanel.prototype._getRestPath = function() {
    return 'sqlshare';
};
