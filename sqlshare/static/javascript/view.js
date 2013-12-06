
SQLShare.View = function(model) {
    SolView.call(this, model);
};

SQLShare.View.prototype = new SolView();

SQLShare.View.prototype._getApplication = function() { return 'SQLShare'; };

SQLShare.View.prototype._getTruncatedString = SSBase.prototype._getTruncatedString;
SQLShare.View.prototype._binarySearch = SSBase.prototype._binarySearch;
SQLShare.View.prototype._getStringPixelWidth = SSBase.prototype._getStringPixelWidth;

SQLShare.View.prototype._addDateParams = function(obj, namespace) {
    var months = [
        Solstice.Lang.getString('SQLShare', 'table_month_1'),
        Solstice.Lang.getString('SQLShare', 'table_month_2'),
        Solstice.Lang.getString('SQLShare', 'table_month_3'),
        Solstice.Lang.getString('SQLShare', 'table_month_4'),
        Solstice.Lang.getString('SQLShare', 'table_month_5'),
        Solstice.Lang.getString('SQLShare', 'table_month_6'),
        Solstice.Lang.getString('SQLShare', 'table_month_7'),
        Solstice.Lang.getString('SQLShare', 'table_month_8'),
        Solstice.Lang.getString('SQLShare', 'table_month_9'),
        Solstice.Lang.getString('SQLShare', 'table_month_10'),
        Solstice.Lang.getString('SQLShare', 'table_month_11'),
        Solstice.Lang.getString('SQLShare', 'table_month_12')
    ];

    if (namespace) {
        namespace = namespace+"_";
    }
    else {
        namespace = '';
    }

    this.setParam(namespace+'year', obj.getFullYear());
    this.setParam(namespace+'date', obj.getDate());
    this.setParam(namespace+'month', months[obj.getMonth()]);

    var hour = obj.getHours();
    if (hour >= 12) {
        this.setParam(namespace+'pm', true);
    }

    var min = obj.getMinutes();
    if (min < 10) {
        min = "0"+min;
    }

    var hours = obj.getHours() % 12;
    if (hours == 0) {
        hours = '12';
    }

    this.setParam(namespace+'hour', hours);
    this.setParam(namespace+'min', min);
};

SQLShare.View.prototype.formatDate = function(elLiner, oRecord, oColumn, oData) {
    var field = oColumn.getKey();

    var view = new SQLShare.View.TableDateCell({
        date_obj:  new Date(oRecord.getData(field)) //oRecord.getData('create_date')
    });

    elLiner.innerHTML = view.toString();
};

SQLShare.View.prototype._addAccessTooltips = function() {
    // jquery ui tooltips require a title attribute - so set one
    $('.ss-access-private').attr('title', '');
    $('.ss-access-public').attr('title', '');
    $('.ss-access-shared-viewer').attr('title', '');
    $('.ss-access-shared-owner').attr('title', '');

    $('.ss-access-private').tooltip({ content:  Solstice.Lang.getString("SQLShare", "private_access_tooltip") });
    $('.ss-access-public').tooltip({ content:  Solstice.Lang.getString("SQLShare", "public_access_tooltip") });
    $('.ss-access-shared-viewer').tooltip({ content:  Solstice.Lang.getString("SQLShare", "shared_viewer_access_tooltip") });
    $('.ss-access-shared-owner').tooltip({ content:  Solstice.Lang.getString("SQLShare", "shared_owner_access_tooltip") });
};

