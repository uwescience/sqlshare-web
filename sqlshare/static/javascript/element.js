"use strict";

/*****************************
 * @constructor
 * @class Element showing/hiding/selecting methods.
 */
Solstice.Element = {};

/**
 * Hides an element
 * @param {string|object} ID of the element, or the element, to be hidden
 * @type void
 */
Solstice.Element.hide= function(el) {
    var element = document.getElementById(el);
    if (element) {
        element.style.display = 'none';
    }
}

/**
 * Sets the display of the passed element to block
 * @param {string|object} ID of the element, or the element, to be shown
 * @type void
 */
Solstice.Element.show = function(el) {
    var element = document.getElementById(el);
    if (element) {
        element.style.display = 'block';
    }
}
