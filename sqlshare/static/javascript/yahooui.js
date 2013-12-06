
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
Solstice.YahooUI.popin_zindex = 999;

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

/** PopIns, aka Panels and Dialogs **/

Solstice.YahooUI.PopIn = function(){};
Solstice.YahooUI.PopIn.initialized = false;
Solstice.YahooUI.PopIn.registry = {};
Solstice.YahooUI.PopIn.manager = new YAHOO.widget.OverlayManager();

Solstice.YahooUI.PopIn.init = function(name, is_modal) {
    if (!Solstice.YahooUI.PopIn.initialized) {
        Solstice.YahooUI.PopIn.initialized = true;
    }

    // Create a new popin only if this name hasn't been registered.
    // IE seems to prefer that the modal config attribute be set in
    // the constructor, so we need to explicitly reset it for existing
    // popins.
    var popin = Solstice.YahooUI.PopIn.get(name);
    if (popin) {
        popin.cfg.setProperty('modal', (is_modal) ? true : false);
        popin.cfg.setProperty('fixedcenter', (is_modal) ? true : false);
        popin.cfg.setProperty('draggable', (is_modal) ? false : true);
    } else {
        popin = new YAHOO.widget.Panel(name, {
            modal               : (is_modal) ? true : false,
            fixedcenter         : (is_modal) ? true : false,
            draggable           : (is_modal) ? false : true,
            visible             : false,
            close               : true,
            icon                : YAHOO.widget.SimpleDialog.ICON_HELP,
            constraintoviewport : true,
            iframe              : true,
            width               : '300',
            underlay            : 'shadow'
        });
        Solstice.YahooUI.PopIn.registry[name] = popin;
        Solstice.YahooUI.PopIn.manager.register(popin);
        // Clear error messages automatically on hide
        popin.hideEvent.subscribe(Solstice.Message.clear);

        // ESC key listener for hiding popins
        var esc = new YAHOO.util.KeyListener(document, { keys:27 }, {
            fn   : popin.hide,
            scope: popin,
            correctScope: true
        } );
        popin.cfg.queueProperty('keylisteners', esc);
    }

    // Add temporary content and render
    popin.setHeader('&nbsp;');
    popin.setBody('Loading... <img src="static/images/processing.gif" alt="" style="vertical-align: middle;">');
    popin.render('solstice_app_form');

    return popin;
}

Solstice.YahooUI.PopIn.get = function(name) {
    if (!name) name = Solstice.YahooUI.getDefaultName(); 
    return Solstice.YahooUI.PopIn.registry[name];
}
    
Solstice.YahooUI.PopIn.getConfig = function(name) {
    if (popin = Solstice.YahooUI.PopIn.get(name)) {
        return popin.cfg;
    }
}

Solstice.YahooUI.PopIn.setTitle = function(name, content) {
    //if we only have 1 argument, assume it is the content
    if(arguments.length == 1){
        content = name;
        name = Solstice.YahooUI.getDefaultName();
    }

    if (popin = Solstice.YahooUI.PopIn.get(name)) {
        popin.setHeader(content);
    }
}

Solstice.YahooUI.PopIn.setContent = function(name, content) {
    //if we only have 1 argument, assume it is the content
    if(arguments.length == 1){
        content = name;
        name = Solstice.YahooUI.getDefaultName();
    }

    if (popin = Solstice.YahooUI.PopIn.get(name)) {
        popin.setBody(content);
        // Run any inline javascript (ie register client actions, etc)
        var regEx = /<script type="text\/javascript">(.+?)<\/script>/g;
        content = content.replace(/[\r\n]/g, '');
        var result;
        while((result = regEx.exec(content)) != null){
            try {
                eval(result[1]);
            }catch(exception){}
        }

        popin.render();
        if (popin.cfg.getProperty('fixedcenter')) {
            popin.center();
        }
        if(popin.cfg.getProperty('constraintoviewport')){
            popin.align();
        }
    }
}

Solstice.YahooUI.PopIn.raise = function(name, context, is_modal, is_draggable, width, hide_close) {
    if (!name) name = Solstice.YahooUI.getDefaultName();

    // Ensure that a popin with this name is not currently raised
    Solstice.YahooUI.PopIn.lower(name);

    var popin = Solstice.YahooUI.PopIn.get(name);

    //make sure we have a popin (unnamed popins always get reinitialized)
    if(!popin || name == Solstice.YahooUI.getDefaultName()){
        popin = Solstice.YahooUI.PopIn.create(name, context, is_modal, is_draggable, width, hide_close);
    }else if(context) { // It might be a button name(this mirrors how create already does things)
        Solstice.Button.set(context);
        Solstice.Button.performClientAction();
    }

    popin.show();
    Solstice.YahooUI.PopIn.manager.focus(popin);

    return false;
}

Solstice.YahooUI.PopIn.create = function(name, context, is_modal, is_draggable, width, hide_close) {
    var popin = Solstice.YahooUI.PopIn.init(name, is_modal);
    if(hide_close){
        popin.cfg.setProperty('close', false);
    }

    // Width needs to be set before other properties below
    if (width) popin.cfg.setProperty('width', width);
    popin.cfg.setProperty('draggable', (is_draggable) ? true : false);

    if (context && !is_modal) {
        if (target = document.getElementsByName(context)[0]) {
            popin.cfg.setProperty('context', [target, 'tl', 'tl']);
        }
    }

    if (context) { // It might be a button name
        Solstice.Button.set(context);
        Solstice.Button.performClientAction();
    }
    popin.cfg.setProperty('zindex', Solstice.YahooUI.popin_zindex);

    return popin;
}

Solstice.YahooUI.PopIn.lower = function(name) {
    if (!name) name = Solstice.YahooUI.getDefaultName();
    if (popin = Solstice.YahooUI.PopIn.get(name)) {
        popin.hide();
    }
    return false;
}

Solstice.YahooUI.getDefaultName = function() {
    return 'solstice_default_popin';
}

// BEGIN: Deprecated functions; these support single 'no-name' popins
Solstice.YahooUI.raisePopIn = function(button_name, is_modal, is_draggable, width) {
    return Solstice.YahooUI.PopIn.raise(null, button_name, is_modal, is_draggable, width);    
}
Solstice.YahooUI.lowerPopIn = function() {
    return Solstice.YahooUI.PopIn.lower();
}
Solstice.YahooUI.setPopInContent = function(content) {
    return Solstice.YahooUI.PopIn.setContent(null, content);
}
Solstice.YahooUI.setPopInTitle = function(title) {
    return Solstice.YahooUI.PopIn.setTitle(null, title);
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


