/**
 * @fileoverview
 * This is the master JavaScript file that is included with every
 * HTML page that is shown.
 * Changes should be tested thoroughly as they affect every page.
 */



/***********************************************
 * @class Namespace for all solstice javascript, also contains some basic global functionality
 * @constructor
 */
Solstice = function (){};


/**
 * Writes a log to console.log if it's present and notifies the user that something was logged
 */

Solstice.log = function(message){
    if(window.console){
        if (window.console.trace) {
            window.console.trace(message);
        }
        else {
            window.console.trace(message);
        }

    }
}

/************
 * Returns the HTML document base.
 * @returns {string} document base as a string
 */

Solstice.getDocumentBase = function () {
    return solstice_document_base; //This is printed inline by solstice
}

/************
 * Returns the webservice rest root.
 * @returns {string} webservice rest root as a string
 */

Solstice.getWebServiceRestRoot = function () {
    return webservice_rest_root; //This is printed inline by solstice
}

/************
 * Returns the root path.
 * @returns {string} root path as a string
 */
Solstice.getRootPath = function () {
    var url = Solstice.getDocumentBase();
    var path = url.split('://').pop();
    if (path) {
        path = path.replace(/^[^\/]*/, '');
    }
    return path;
}

/************
 * Returns a boolean specifying if development mode is on or off
 * @returns {boolean} 
 */
Solstice.hasDevelopmentMode = function () {
    return solstice_development_mode;
}

/**
 * Returns the the ID of the Solstice-provided form element, for use in
 * application javascript.
 * @returns {string} ID of the Solstice form element
 */
Solstice.getAppFormID = function () {
    return 'solstice_app_form';
}


/**
 * Convient method to get the document object, browser safe.
 * @returns {domElement} The browser's document object.
 */
Solstice.document = function() {
    if(document.all){
        return document.all;
    }else{
        return document;
    }
}

/**
 * A method for returning a useful object for an iframe.
 * @param {string} name the name of the frame to be returned.
 * @returns {domElement} The object for the given frame name.
 */

Solstice.getWindow = function(name) {
    var frames = window.frames;
    for(var i=0;i<frames.length;i++){
        var test_name = "";
        try {
            test_name = frames[i].name;
        }
        catch (e) {
        };
        if(test_name == name){
            return frames[i].window;
        }
    }
}

/*
 * Ensures that the application occupies the topmost window when called. 
 * @return void
 */
Solstice.escapeFrames = function() {
    if (window.top != window) {
        var url_no_search = window.location.protocol+"//"+window.location.host+window.location.pathname;
        window.top.location.href = url_no_search;
    }
}

/******
 * Cookie functions
 * These are based on code from http://www.quirksmode.org/js/cookies.html
 * Thanks!
 */
Solstice.Cookie = function(){};

Solstice.Cookie.read = function (name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

Solstice.Cookie.set = function (name, value, minutes) {
    var expires = "";
    if (minutes) {
        var date = new Date();
        date.setTime(date.getTime()+(minutes*60*1000));
        expires = "; expires="+date.toGMTString();
    }
    var path = "/"+Solstice.getRootPath()+"/";
    path = path.replace(/\/+/g, "/");
    document.cookie = name+"="+value+expires+"; path="+path;
}

Solstice.Cookie.remove = function(name) {
    Solstice.Cookie.set(name,"",-1);
}

/**************************************************
 * @constructor
 * @class Backbutton blocking/hanlding methods.
 */
Solstice.BackButton = function (){ };

/**
 * Controlls whether the back button is blocked always or only on demand
 * @type boolean
 * @private
 */
Solstice.BackButton.disable_back_button = 0;

/**
 * Checks whether the event passed would result in a browser
 * back action.
 * @param {event} e the event to examine
 * @returns {boolean} whether or not the event is a back event
 * @private
 */
Solstice.BackButton.isBackAction = function (e) {
    var key_pressed;
    var tagname;
    var tagtype;
    var is_editable;
    if (window.event) {
        tagname = window.event.srcElement.tagName;
        if (tagname) {
            tagtype = window.event.srcElement.getAttribute('type');
            is_editable = window.event.srcElement.getAttribute('contentEditable');
            key_pressed = e.keyCode;
        }
    }
    else {
        tagname = e.target.tagName;
        tagtype = e.target.getAttribute('type');
        is_editable = e.target.getAttribute('contentEditable');
        key_pressed = e.which;
    }
    if ((8 == key_pressed) && is_editable) {
        return false;
    }
    if ((8 == key_pressed) && !Solstice.BackButton.isTextField(tagname, tagtype)) {
        return true;
    }
    if (Solstice.BackButton.disable_back_button && (37 == key_pressed) && (e.altKey || e.metaKey)) {
        return true;
    }
    // this is here for firefox...
    if (Solstice.BackButton.disable_back_button && (0 == key_pressed) && (e.altKey || e.metaKey)) {
        return true;
    }
    return false;
}

/**
 * Supports other back-button related functions by determining
 * whether an element is an input type (so backspace works in form fields, for example)
 * @param {string} tagname the string name of the html element, (eg DIV or INPUT)
 * @param {string} type the type field of the form element (eg password, input, or hidden)
 * @return {boolean} whether the element described is an input
 * @private
 */
Solstice.BackButton.isTextField = function (tagname, type) {
    if (tagname == 'TEXTAREA') { return true; }
    if ((tagname == 'INPUT') && (!type || type.toLocaleLowerCase() == 'text' || type.toLocaleLowerCase() == 'password')) { return true; };
    return false;
}


/*********************
 * @class Methods for discovering the geometry and position of elements
 * @constructor
 */
Solstice.Geometry = function () {};

/**
 * Calculate top offset of the given element.
 * @param {htmlElement} the element whose offset we want to determine
 * @return {int} the offset of the given element in pixels
 */
Solstice.Geometry.getOffsetTop = function(obj) {
    var currTop = 0;
    if (obj.offsetParent) {
        currTop = obj.offsetTop;
        while (obj = obj.offsetParent) {
            currTop += obj.offsetTop;
        }
    }
    return currTop;
}

/**
 * Calculates the left offest of the given element.
 * @param {htmlElement} the element whose offset we want to determine
 * @return {int} the left offset of the given element in pixels
 */
Solstice.Geometry.getOffsetLeft = function(obj) {
    var currLeft = 0;
    if (obj.offsetParent) {
        currLeft = obj.offsetLeft;
        while (obj = obj.offsetParent) {
            currLeft += obj.offsetLeft;
        }
    }
    return currLeft; 
}

/**
 * Discovers the width of the viewable region of the page
 * @returns {int} the width of the viewable region in pixels
 */
Solstice.Geometry.getBrowserWidth = function() {
    if (window.innerWidth) {
        // all except Explorer
        return window.innerWidth;
    } else if (document.documentElement && document.documentElement.clientWidth) {
        // Explorer 6 Strict
        return document.documentElement.clientWidth;
    } else if (document.body) {
        // other Explorers
        return document.body.clientWidth;
    }
    return;
}
    
/**
 * Discovers the height of the viewable region of the page
 * @returns {int} the height of the viewable region in pixels
 */
Solstice.Geometry.getBrowserHeight = function () {
    if (window.innerHeight) {
        // all except Explorer
        return window.innerHeight;
    } else if (document.documentElement && document.documentElement.clientHeight) {
        // Explorer 6 Strict
        return document.documentElement.clientHeight;
    } else if (document.body) {
        // other Explorers
        return document.body.clientHeight;
    }
    return;
}

/**
 * Discovers the width of the entire page
 * @return {int} the width of the entire page in pixels
 */
Solstice.Geometry.getPageWidth = function () {
    if (document.body.scrollWidth > document.body.offsetWidth) {
        return document.body.scrollWidth;
    } else {
        return document.body.offsetWidth;
    }
}

/**
 * Discovers the height of the entire page
 * @return {int} the height of the entire page in pixels
 */
Solstice.Geometry.getPageHeight = function () {
    if (document.body.scrollHeight > document.body.offsetHeight) {
        return document.body.scrollHeight;
    } else {
        return document.body.offsetHeight;
    }
}



/**
 * Discovers the position of the user's horizontal scrollbar - the offset they've scrolled to horizontally. 
 * @return {int} the horizontal offset of the users viewport in pixels
 */
Solstice.Geometry.getScrollXOffset = function () {
    if (self.pageXOffset) {
        // all except Explorer
        return self.pageXOffset;
    } else if (document.documentElement && document.documentElement.scrollLeft) {
        // Explorer 6 Strict
        return document.documentElement.scrollLeft;
    } else if (document.body) {
        // all other Explorers
        return document.body.scrollLeft;
    }
}

/**
 * Discovers the position of the user's scrollbar - the offset they've scrolled to vertically.
 * @return {int} the vertical offset of the users viewport in pixels
 */
Solstice.Geometry.getScrollYOffset = function () {
    if (self.pageYOffset) {
        // all except Explorer
        return self.pageYOffset;
    } else if (document.documentElement && document.documentElement.scrollTop) {
        // Explorer 6 Strict
        return document.documentElement.scrollTop;
    } else if (document.body) {
        // all other Explorers
        return document.body.scrollTop;
    }
}

/**
 * Discovers the horizontal offset of the passed event
 * @param {event} the event to inspect
 * @return {int} the horizontal offset of the event in pixels
 */
Solstice.Geometry.getEventX = function (event) {
    if (self.innerHeight) {
        // all except Explorer
        return event.pageX;
    } else if (document.documentElement && document.documentElement.scrollLeft) {
        // Explorer 6 Strict
        return event.clientX + document.documentElement.scrollLeft;
    } else if (document.body) {
        // other Explorers
        return event.clientX + document.body.scrollLeft;
    }
    return;
}

/**
 * Discovers the vertical offset of the passed event
 * @param {event} the event to inspect
 * @return {int} the vertical offset of the event in pixels
 */
Solstice.Geometry.getEventY = function (event) {
    if (self.innerHeight) {
        // all except Explorer
        return event.pageY;
    } else if (document.documentElement && document.documentElement.scrollTop) {
        // Explorer 6 Strict
        return event.clientY + document.documentElement.scrollTop;
    } else if (document.body) {
        // other Explorers
        return event.clientY + document.body.scrollTop;
    }
    return;
}

/****************
 * @class Methods used by Solstice to manipulate the messaging container 
 * @constructor
 */
Solstice.Message = function(){};

/**
 * @function Solstice.Message.setCookie
 * @description Set a persistent message
 * @param {string} type
 * @param {string} message
 * @returns {boolean} true
 */
Solstice.Message.setCookie = function(type, message) {
    var cookie_str = type + '_TYPE_' + message;
    Solstice.Cookie.set('message_service', cookie_str, 60);
    return true;
}

Solstice.findDuplicateIDs = function() {
    var tracker = {};
    Solstice._searchNodesForDupes(document, tracker);

    var has_dupes = false;
    for (var i in tracker) {
        var nodes = tracker[i];
        if (nodes.length > 1) {
            has_dupes = true;
            if (window.console) {
                window.console.log("Duplicate ID: "+i+" Nodes with id: "+nodes.length);
            }
            for (var j = 0; j < nodes.length; j++) {
                $(nodes[j]).css("border", "2px dashed red");
            }
        }
    }

    if (!has_dupes) {
        if (window.console) {
            window.console.log("No duplicate IDs");
        }
        else {
            alert("No duplicate IDs");
        }
    }

}

Solstice._searchNodesForDupes = function(node, tracker) {
    if (node.id) {
        if (!tracker[node.id]) {
            tracker[node.id] = [];
        }
        tracker[node.id].push(node);
    }
    var children = node.childNodes;
    var length = children.length;
    for (var i = 0; i < length; i++) {
        Solstice._searchNodesForDupes(children[i], tracker);
    }

}


/*
 * Copyright 1998-2008 Learning & Scholarly Technologies, University of Washington
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

