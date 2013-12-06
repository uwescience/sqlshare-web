
Solstice.YahooUI = function(){};

/** Scrolling **/

Solstice.YahooUI.inTopScrollArea = false;
Solstice.YahooUI.inBottomScrollArea = false;
Solstice.YahooUI.scrollInterval = 15;
Solstice.YahooUI.scrollDistance = 8;


Solstice.YahooUI.tooltip_showdelay = 750;
Solstice.YahooUI.tooltip_hidedelay = 50;
Solstice.YahooUI.tooltip_autodismiss = 5000;
// This is to keep tooltips above flyout menus.  Hopefully no flyout menu is launched from an element at zindex of 998 or higher.  This could be improved.
Solstice.YahooUI.tooltip_zindex = 9999;

Solstice.YahooUI.tooltip = function(title, args) {

    var delayargs = {
        showdelay:Solstice.YahooUI.tooltip_showdelay, 
        hidedelay:Solstice.YahooUI.tooltip_hidedelay, 
        autodismissdelay:Solstice.YahooUI.tooltip_autodismiss,
        zindex: Solstice.YahooUI.tooltip_zindex
        };

    for (key in args) {
        delayargs[key] = args[key];
    }

    // jquery ui tooltips require a title attribute - so set one
    args["context"].attr("title", "");
    args["context"].tooltip({ content: delayargs["text"] });
}

/** Fades **/

/**
 * Applies a fade-in effect to the passed element 
 * @param {string|object} ID of the element, or the element reference
 * @param {float} duration of effect
 * @param {integer} target opacity
 * @type void
 */
Solstice.YahooUI.fadeIn = function (id, duration, to) {
    if(!to){
        to = 1;
    }
    //stupid hack - safari sometimes lets faded content disappear
    if(to == 1){
        to = 0.9999;
    }
    if(!duration){
        duration = 2;
    }
    var anim = new YAHOO.util.Anim(id, { opacity: { to: to } }, duration, YAHOO.util.Easing.easeBoth);
    anim.onComplete.subscribe(function(anim_status, data, input) {
                var element;
                if (typeof input == "string") {
                    element = document.getElementById(input);
                }
                else {
                    element = input;
                }
                element.style.opacity = '';
                element.style['-moz-opacity'] = '';
                element.style['-khtml-opacity'] = '';
                element.style.filter = '';
            }, id);
    anim.animate();
}

/**
 * Applies a fade-out effect to the passed element 
 * @param {string|object} ID of the element, or the element reference
 * @param {float} duration of effect
 * @param {integer} target opacity
 * @type void
 */
Solstice.YahooUI.fadeOut = function (id, duration, to) {
    if(!to){
        to = 0;
    }
    if(!duration){
        duration = 2;
    }
    var anim = new YAHOO.util.Anim(id, { opacity: { to: to} }, duration, YAHOO.util.Easing.easeBoth);
    anim.animate();
}

// END: Deprecated functions

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


