"use strict";
String.prototype.encodeHTML = function() {
    if (this == null) {
        return '';
    } else {
        return this.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
}


/****************
* @class Methods used by Solstice to handle common string functions 
* @constructor
*/
Solstice.String = function(){};

/********
* Encode HTML entities in the string
* @param {string} The string to encode
**/
Solstice.String.encodeHTML = function(input) {
    if (input == null) {
        return '';
    } else {
        return input.encodeHTML();
    }
}

/******
* Decode HTML entites in the string
* @param {string} the string to decode
*/
Solstice.String.decodeHTML = function(input) {
   if (input === null) {
       return '';
   } else {
       return input.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&')
           .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
   }
};

Solstice.String.trimWhiteSpace = function(input) {
   if (input === null) {
       return '';
   } else {
       return input.replace(/^\s*/, '').replace(/\s*$/, '');
   }
};

Solstice.String.newlinesToBreaks = function(input) {
   if (input === null) {
       return '';
   } else {
       return input.replace(/(\r\n|\n|\r)/g, "<br/>$1");
   }
}

Solstice.String.fixLineWidth = function(input, interval){
   if (input === null) {
       return '';
   }

   var marker = "&#8203;";
   if(interval === null || interval == 0){
       interval = 20;
   }
   var regex =  new RegExp("(\\S{"+interval+"})", "g");
   return input.replace(regex, "$1"+marker);
}

/**
* Return a string, after truncating to a specified length.
* @param {string} the string to truncate
* @param {integer} the length to truncate
* @param {string} a string to append, if the string was truncated
* @returns {string} the truncated string 
*/
Solstice.String.truncate = function(str, len, marker) {
    if (str == null) {
        return '';
    }

    if (!len) len = 30;
    if (!marker) marker = '...';

    if (marker.length > len) return str;
    if (0 > len) return str;

    if (str.length > len) {
        str = str.substring(0, (len - marker.length));
        str += marker;
    }
    return str;
}

