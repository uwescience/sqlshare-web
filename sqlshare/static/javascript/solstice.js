"use strict";
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
var Solstice = function (){};


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

/**
 * Supports other back-button related functions by determining
 * whether an element is an input type (so backspace works in form fields, for example)
 * @param {string} tagname the string name of the html element, (eg DIV or INPUT)
 * @param {string} type the type field of the form element (eg password, input, or hidden)
 * @return {boolean} whether the element described is an input
 * @private
 */

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

