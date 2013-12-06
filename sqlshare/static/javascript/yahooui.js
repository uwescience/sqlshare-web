
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
};


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


