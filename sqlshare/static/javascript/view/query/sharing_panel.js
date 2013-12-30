SQLShare.View.Query.SharingPanel = function(model) {
    SQLShare.View.call(this, model);
    this.template = 'query/sharing_panel.html';

    Solstice.Element.hide('js-dataset-sharing-changed');
    Solstice.Element.hide('js-dataset-sharing-changed-with-users');
    Solstice.Element.hide('js-dataset-sharing-changed-public');

    Solstice.Element.show('js-dataset-sharing-info');
    Solstice.Element.show('js-dataset-sharing-info-public');

    this.onSave = new YAHOO.util.CustomEvent("onSave");

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

    for (var i = 0; i < sorted.length; i++) {
        var entry = sorted[i];
        this.addParam('accounts', {
            is_user:    (entry.type == "user" ? true : false),
            email:      entry.email,
            name:       entry.name,
            surname:    entry.surname,
            login:      entry.login,
            rel:        entry.rel
        });
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

    YAHOO.util.Event.addListener(YAHOO.util.Dom.getElementsByClassName('js-make_dataset_public'), 'click', this._makeDatasetPublic, this, true);
    YAHOO.util.Event.addListener(YAHOO.util.Dom.getElementsByClassName('js-make_dataset_private'), 'click', this._makeDatasetPrivate, this, true);
    YAHOO.util.Event.addListener(YAHOO.util.Dom.getElementsByClassName('js-close-sharing-panel'), 'click', this._closeDialog, this, true);

    YAHOO.util.Event.addListener('sharing_panel_cancel', 'click', this._closeDialog, this, true);
    YAHOO.util.Event.addListener('sharing_panel_save', 'click', this._saveChanges, this, true);
};

SQLShare.View.Query.SharingPanel.prototype._handleListClick = function(ev) {
    var target = ev.target;
    var td = target.children[0];
    var check_els = [];
    check_els.push(td);
    for (var i = 0; i < check_els.length; i++) {
        var target = check_els[i];

        if ($("#"+target).hasClass('js-remove_account')) {
            var account = target.getAttribute('rel');
            delete this._user_lookup[account];
            var row = this._getTableRow(target);
            this.datatable.deleteRow(row);
            this._permissionsChanged();
        }
        else if ($("#"+target).hasClass('js-remove_email')) {
            var email = target.getAttribute('rel');
            delete this._email_lookup[email];
            email = email.replace(/__quote__/g, '"');
            delete this._email_lookup[email];
            var row = this._getTableRow(target);
            this.datatable.deleteRow(row);
            this._permissionsChanged();
        }

        if (target.children) {
            var len = target.children.length;
            for (var j = 0; j < len; j++) {
                check_els.push(target.children[j]);
            }
        }
     }

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
    while (el.tagName.toLowerCase() != 'body' && el.tagName.toLowerCase() != 'tr') {
        el = el.parentNode;
    }

    if (el.tagName.toLowerCase() == 'tr') {
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

    this.AsyncPUT(this._getRestRoot()+"/dataset/"+this.model.dataset.container_id+"/permissions", {
        accounts: accounts,
        emails: emails,
        is_public: false
    }, this._postSavePermissions);

};


SQLShare.View.Query.SharingPanel.prototype._postSavePermissions = function(o) {
    if (o.code == 200) {
        this.onSave.fire();
        $("#sharing_dataset_dialog").dialog("close");
        Solstice.Message.setSuccess(Solstice.Lang.getMessage('SQLShare', 'dataset_permissions_updated'));
    }
    else {
        Solstice.Element.hide('on_save_display');
        Solstice.Element.show('share_data_workspace');
    }
};

SQLShare.View.Query.SharingPanel.prototype._buildPermissionsTable = function() {
    var columns = [
        { key: "name", label: "Name"},
        { key: "access", label: "" }
    ];

    var datasource = new YAHOO.util.DataSource(YAHOO.util.Dom.get('sharing_list'));
    datasource.responseType = YAHOO.util.DataSource.TYPE_HTMLTABLE;
    datasource.responseSchema = {
        fields: [
            { key:"name" },
            { key:"access" }
        ]};

    this.datatable = new YAHOO.widget.DataTable('permissions_wrapper', columns, datasource, {MSG_EMPTY: "You are currently not sharing this dataset with any other users."});
    this.datatable.subscribe("cellClickEvent", this._handleListClick, this, true);

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

            permissions_datatable.addRow({
                name: ['<span class="permission-user">', user_info.name, ' ', user_info.surname, ' (', user_info.login, ')</span>'].join(''),
                access: ["<span class='permission-action'>Read-only <a href='javascript:void(0);' class='js-remove_account' rel='", user_info.login, "'>x</a></span>"].join('')
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
    permissions_datatable.addRow({
        name: ['<span class="permission-user">', value, '</span>'].join(''),
        access: ["<span class='permission-action'>Read-only <a href='javascript:void(0);' class='js-remove_email' rel='", rel_value, "'>x</a></span>"].join('')
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
