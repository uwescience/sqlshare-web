var SSBase = function() {
};

SSBase.prototype = new SolBase();

SSBase.prototype._getApplication = function() {
    return 'SQLShare';
};

SSBase.prototype._getRestPath = function() {
    return 'sqlshare';
};

SSBase.prototype.abortCurrentRequest = function() {
    if (SSBase._current_request) {
        SSBase._current_request.abort();
    }
    if (SSBase._current_timeout) {
        clearTimeout(SSBase._current_timeout);
    }

    if (SSBase._query_results_timeout) {
        clearTimeout(SSBase._query_results_timeout);
    }

};

SSBase.prototype.setCurrentTimeout = function(timeout) {
    SSBase._current_timeout = timeout;
};

SSBase.prototype.setCurrentRequest = function(o) {
    SSBase._current_request = o;
};

SSBase.prototype.setResultsTimeout = function(timeout) {
    SSBase._query_results_timeout = timeout;
};

SSBase.prototype.clearResultsTimeout = function() {
    clearTimeout(SSBase._query_results_timeout);
};

SSBase.prototype._getTruncatedString = function(full_value, pixel_length) {
    var position = this._binarySearch(full_value, pixel_length, 0, full_value.length);
    return full_value.substring(0, position);
};

SSBase.prototype._binarySearch = function(full_value, pixel_length, min, max) {
    if (min + 1 == max ) {
        var max_len = this._getStringPixelWidth(full_value.substring(0, max));
        if (max_len <= pixel_length) {
            return max;
        }
        return min;
    }
    if (min == max) {
        return max;
    }

    var check_pos = parseInt((min + max) / 2);

    var length = this._getStringPixelWidth(full_value.substring(0, check_pos));

    if (length == pixel_length) {
        return check_pos;
    }
    else if (length < pixel_length) {
        return this._binarySearch(full_value, pixel_length, check_pos, max);
    }
    else {
        return this._binarySearch(full_value, pixel_length, min, check_pos);
    }
};

SSBase.prototype._getStringPixelWidth = function(value) {
    var test_span = document.createElement('span');
    test_span.innerHTML = unescape(value).encodeHTML();
    test_span.style.backgroundColor = 'white';
    var container = document.getElementById('hidden_test_container');
    container.appendChild(test_span);
    var length = test_span.offsetWidth;
    container.removeChild(test_span);
    return length;
};


