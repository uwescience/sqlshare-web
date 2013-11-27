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
    if(Solstice.hasDevelopmentMode()){
        if(window.console){
            if(! document.getElementById('sol_js_warning_flasher')){
                var flasher = document.createElement('div');
                flasher.setAttribute('class', 'soldevjslog');
                flasher.innerHTML = 'There is JS error content in your console.log!';
                flasher.setAttribute('id', 'sol_js_warning_flasher');
                document.body.appendChild(flasher);
                new Solstice.Element(flasher).fadeToBlock();
                setTimeout('new Solstice.Element("sol_js_warning_flasher").fadeOutAndDestroy()', 5*1000);
            }

            if (window.console.trace) {
                window.console.trace(message);
            }
            else {
                window.console.trace(message);
            }

        }else{
            alert(message);
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

Solstice.ToolTipCounter = -1;
Solstice.InitializedToolTipCounter = -1;
Solstice.ToolTipData = new Array();
Solstice.ToolTipLookup = new Array();

Solstice.addToolTip = function(id, tooltip, initialize) {
    Solstice.ToolTipCounter++;
    Solstice.ToolTipData.push({ id:id, tooltip:tooltip });
    if (initialize) {
        Solstice._initializeToolTip(Solstice.ToolTipCounter);
    }
}

Solstice.removeToolTip = function(id) {
    var tip = Solstice.ToolTipLookup[id];
    if (tip) {
        tip.cfg.setProperty('disabled', true);
    }
}

Solstice.initializeToolTips = function() {
    if (Solstice.ToolTipCounter > Solstice.InitializedToolTipCounter) {
        Solstice._initializeToolTip(Solstice.InitializedToolTipCounter + 1);
    }
}

Solstice._initializeToolTip = function(position) {
    var id = Solstice.ToolTipData[position].id;
    var tooltip = Solstice.ToolTipData[position].tooltip;
    Solstice.InitializedToolTipCounter = position;

    var element = document.getElementById(id);

    // If someone paints a button, but it isn't visible, the element won't be defined
    if (element && tooltip) {
        var tip = Solstice.YahooUI.tooltip("solstice_tooltip_"+position, { context:element, text:tooltip });

        // Without the try/catch block, ie7 sometimes has an error when leaving the page before tooltips are
        // loaded, when it can't read the property that was just set.
        try {
            tip.cfg.setProperty('text', tooltip); 
            if (element.title) element.title = tip.cfg.getProperty('text');
        }
        catch (e) {

        }
        Solstice.ToolTipLookup[id] = tip;
    }

    if (position < Solstice.ToolTipCounter) {
        var function_def = "Solstice._initializeToolTip("+(position + 1)+")";
        setTimeout(function_def, 1);
    }
}

Solstice.fixDate = function (date_id){
    var date_input = document.getElementById(date_id);
    var date_parts = date_input.value.split(/\//);
    if(date_parts.length == 3){
        var year = date_parts[2];
        var fixed;
        if(year.length == 0){
            fixed = new Date().getFullYear();

        }else if(year.length == 2){
            fixed = '20' + year;

        }else if(year.length == 1){
            fixed = '200' + year;
        }

        if(fixed){
            date_parts[2] = fixed;
            date_input.value = date_parts.join('/');
        }
    }
}

Solstice.setOnBadBackMessage = function (message) {
    Solstice.on_bad_back_message = message;
}

Solstice.messageOnBadBack = function () {
    if(Solstice.on_bad_back_message && Solstice.Cookie.read('bad_back_'+solstice_subsession_chain)){
        Solstice.Message.setInfo(Solstice.on_bad_back_message);
        Solstice.Cookie.remove('bad_back_'+solstice_subsession_chain);
    }
}

Solstice.checkBadBack = function () {
    var chain = parseInt(Solstice.Cookie.read(solstice_subsession_chain));
    var seq = parseInt(solstice_subsession_seq);
    
    if(seq < chain){
        Solstice.Cookie.set('bad_back_'+solstice_subsession_chain,'1',60);
        var step = chain - seq;
        history.go(step);
    }
}

Solstice.setWidePage = function() {
    if (!Solstice._widePageActions) {
        return;
    }
    for (var i = 0; i < Solstice._widePageActions.length; i++) {
        Solstice._widePageActions[i].call();
    }
}

Solstice.setOverflowPage = function() {
    if (!Solstice._overflowPageActions) {
        return;
    }
    for (var i = 0; i < Solstice._overflowPageActions.length; i++) {
        Solstice._overflowPageActions[i].call();
    }
}

Solstice.addWidePageAction = function(action) {
    if (!Solstice._widePageActions) {
        Solstice._widePageActions = [];
    }
    Solstice._widePageActions.push(action);
}

Solstice.addOverflowPageAction = function(action) {
    if (!Solstice._overflowPageActions) {
        Solstice._overflowPageActions = [];
    }
    Solstice._overflowPageActions.push(action);
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
 * This is designed as an event handler that intercepts the use of the
 * backspace key to prevent accidental back navigations.  It is attached to 
 * 'onkeypress' and 'onkeydown' automatically
 * @param  {event} e The event to inspect and potentially prevent
 * @returns {boolean} whether or not the event is a back event
 * @private
 */
Solstice.BackButton.stopBackSpace = function (e) {
    if (window.event) {
        if (Solstice.BackButton.isBackAction(window.event)) {
            return Solstice.Event.stopEvent(window.event);
        }
    }
    else {
        if (Solstice.BackButton.isBackAction(e)) {
            return false;
        }
    }
}
window.onkeypress = Solstice.BackButton.stopBackSpace;
document.onkeydown = Solstice.BackButton.stopBackSpace;

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



/*********************
 * @class Event handling methods.
 * @constructor
 */
Solstice.Event = function(){};

/**
 * Adds the given function as an event handler on the given dom element.
 * See http://www.w3.org/TR/DOM-Level-3-Events/events.html#Events-EventTarget-addEventListener for more info on the "useCapture" arg
 * @param {htmlElement} obj the dom element to attach the event to
 * @param {string} evtType the event to attach to (eg, Click, MouseOver)
 * @param {function} fn a function reference
 * @param {object} An arbitrary object that will be passed as a parameter to the handler 
 * @param {boolean} If true, the obj passed in becomes the execution scope of the listener. If an object, this object becomes the execution scope. 
 * @type void
 */
Solstice.Event.add = function (obj, evtType, fn, param, override) {
    // Just pass off to Yahoo UI.
    if (!Solstice.Event.exists(obj, evtType, fn)) {
        return YAHOO.util.Event.addListener(obj, evtType, fn, param, override);
    }
}

/**
 * Removes the given function as an event handler on the given dom element.
 * @param {htmlElement} obj the dom element to attach the event to
 * @param {string} evtType the event to attach to (eg, Click, MouseOver)
 * @param {function} fn a function reference
 * @param {boolean} useCapture some proprietary boolean about how events are propagated through these handlers.
 * @type void
 */
Solstice.Event.remove = function (obj, evtType, fn, useCapture) {
    return YAHOO.util.Event.removeListener(obj, evtType, fn);
}

/**
 * Checks whether the given dom element has the function on the given event.
 * @param {htmlElement} obj the dom element to query
 * @param {string} evtType the event to query for (eg, Click, MouseOver)
 * @param {function} fn a function reference
 * @type boolean
 */
Solstice.Event.exists = function (obj, evtType, fn) {
    // Just pass off to Yahoo UI.
    var listeners = YAHOO.util.Event.getListeners(obj);
    if (listeners) {
        for (var i=0; i < listeners.length; i++) {
            var listener = listeners[i];
            if (listener.type == evtType && listener.fn == fn) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Returns the event's target element.
 * @param {Event} the event
 * @type {htmlElement} the event's target
 */
Solstice.Event.getTarget = function (ev) {
    if (!ev) {
        try {
            ev = YAHOO.util.Event.getEvent();
        } catch(ex) { return; }
    }
    return (ev) ? YAHOO.util.Event.getTarget(ev) : null;
}

/**
 * Stops the passed event 
 * @param {Event} the event
 */
Solstice.Event.stopEvent = function (ev) {
    return YAHOO.util.Event.stopEvent(ev);
}

/****************
 * @class Methods used by Solstice to manage Button-based navigation
 * @constructor
 */

Solstice.Button = function(){};


/**
 * A registry of actions that are attached to each Button
 * @private
 * @type array
 */
Solstice.Button.ClientActions = new Array();

/**
 * The currently selected button name
 * @private
 * @type string
 */
Solstice.Button.currentButton = "";

/**
 * The default button name
 * @private
 * @type string
 */
Solstice.Button.defaultButton = "";

/**
 * The upload button name
 * @private
 * @type string
 */
Solstice.Button.uploadButton  = "";


/***********
 * Used by pseudo buttons to simulate keyboard 'clicking'
 */
Solstice.Button.pseudoClick = function (event){
    if(event.keyCode == 13 || event.keyCode == 0){
        if(event.target){
            return event.target.onclick();
        }

        if (event.srcElement){
            return event.srcElement.onclick();
        }
    } 
}



/**
 * This makes it so a link can submit a form.  The first argument
 * is the name of the 'button' that was/should be clicked.
 * @param {string} button_name the name of the button that was clicked
 * @return {unknown} the return value of the form's onsubmit method
 */
Solstice.Button.submit = function (button_name) {
    Solstice.Button.set(button_name);

    var form = document.getElementById(Solstice.getAppFormID());
    var retval = form.onsubmit();

    if (retval){
        Solstice.Button._disableButton(button_name);
        //IE throws an exception on the submit function if
        //onbeforeunload is called as a consequence of a submit button
        //being called on the form (instead of a click on something 
        //that automatically does a submit or navigation)
        try { form.submit(); } catch(e) {}
    }
    return false;
}


/**
 * This is used to submit the form with a button, but to a non-default
 * url.  This is for switching applications, for example, while still 
 * running a submit.
 * @param {string} form_action the new url to post to
 * @param {string} button_name the name of the button to click/run client_actions on
 * @return {unknown} the return value of the forms onsubmit method
 */
Solstice.Button.alternateSubmit = function(form_action, button_name) {
    Solstice.Button.set(button_name);

    var form = document.getElementById(Solstice.getAppFormID());
    if (form_action.match(/^mailto:/)) {
        var retval = form.onsubmit();
        if (retval) {
            document.location.href = form_action;
        }
        return;
    }

    var action_temp = form.action;
    form.action = form_action;  
    
    var retval = form.onsubmit();
    if (retval) {
        Solstice.Button._disableButton(button_name);
        //IE throws an exception on the submit function if
        //onbeforeunload is called as a consequence of a submit button
        //being called on the form (instead of a click on something 
        //that automatically does a submit or navigation)
        try { form.submit(); } catch(e) {}
    }
    form.action = action_temp;
    return retval;
}

Solstice.Button.keyPressSubmit = function (e, name, url) {
    if (!e) var e = window.event;
    if (e.keyCode) code = e.keyCode;
    else if (e.which) code = e.which;
    if(code == 13){
        if (url != null){
            Solstice.Button.alternateSubmit(url, name);
        }else {
            Solstice.Button.submit(name);
        }
       
        Solstice.Event.stopEvent(e);
    }
}


/**
 * Submits the form to a new window, creating a popup while still running the 
 * solstice form post.
 * @param {string} button_name the name of the button to click/run client_actions on
 * @param {string} window_url the url to open/post to in the new window
 * @param {string} window_attributes your standard window.open popup window attributes
 * @param {string} window_name the name of the new window
 * @returns {unknown} the return value of the form's onSubmit method
 */
Solstice.Button.newWindowSubmit = function(button_name, window_url, window_attributes, window_name) {
    Solstice.Button.set(button_name);
    
    var form = document.getElementById(Solstice.getAppFormID());
    form.target = window_name;
   
    var action_temp = form.action
    if (window_url) {
        form.action = window_url;
    }

    var retval = form.onsubmit();
    if (retval) {
        Solstice.Button._disableButton(button_name);
        var new_window;
        if (window_attributes) {
            new_window = window.open('about:blank', window_name, window_attributes);
        }
        if(new_window && window_name == '_blank'){
            var currentDate = new Date();
            new_window.name = 'solstice_window_name_'+ currentDate.getTime();
            form.target = new_window.name;
        } else if(new_window) {
            new_window.focus();
        }

        form.submit();
    }
    form.target = '';
    form.action = action_temp;
    
    return retval;
}

/**
 * Submits the form to a new window, creating a popup 
 * @param {string} window_url the url to open/post to in the new window
 * @param {string} window_attributes your standard window.open popup window attributes
 * @param {string} window_name the name of the new window
 * @returns {unknown} the return value of the form's onSubmit method
 */
Solstice.Button.newStaticWindowSubmit = function(window_url, window_attributes, window_name) {
    new_window = window.open(window_url, window_name, window_attributes);
    return false;
}
/**
 * This is used to prevent frivolous file uploads.  It clears all form entries befores submitting
 * unless the given button is the one that causes the submit.
 * @param {string} button_name the name of the upload button.
 * @type void
 */
Solstice.Button.clearOnAllExcept = function (button_name) {
    Solstice.Button.uploadButton = button_name;
}

/*
 * Prevents a button that submits the form being clicked rapidly, by temporarily disabling it
 * @param {string} button_name
 */
Solstice.Button._disableButton = function (button_name) {
    var element = (window.event && Solstice.Event.getTarget()) || document.getElementById(button_name);

    if (element) {
        var original_onclick = element.getAttribute('onclick');
        var original_href = element.getAttribute('href');
        
        if (original_onclick) {
            element.setAttribute('onclick', '');
        }
        if (original_href) {
            element.setAttribute('href', 'javascript:void(0)');
        }
        window.setTimeout(function() {
            if (original_onclick) {
                element.setAttribute('onclick', original_onclick);
            }
            if (original_href) {
                element.setAttribute('href', original_href);
            }
        }, 4444);
    }
}

/**
 * This will enable the hidden form widget that holds information about the selected button.
 *
 * @param {string} button_name the name of the button to enable
 * @type void
 * @private
 */
Solstice.Button._enableAttributes = function(button_name) {
    var input = document.getElementById('sol_button_data_'+button_name);
    if (input) {
        input.disabled = false;
    }
}

/**
 * Used to clear the form.
 * @type void
 * @private
 */
Solstice.Button._clearUploadForm = function() {
    var sol_form = document.getElementById(Solstice.getAppFormID());
    sol_form.reset();

    Solstice.Button.setSelected(Solstice.Button.currentButton);
}

/**
 * Updates the html form's enctype to an upload type, so we only use multipart/form-data
 * when we really need to.
 * @type void
 */
Solstice.Button.setFormToFileUpload = function() {
    document.getElementById(Solstice.getAppFormID()).enctype  = 'multipart/form-data';
    document.getElementById(Solstice.getAppFormID()).encoding = 'multipart/form-data';
}

/**
 * Sets the button that is currently being operated on after a click.
 * @param {string} button the button name that is being worked on.
 * @type void
 */
Solstice.Button.set = function (button) {
        Solstice.Button._enableAttributes(button);
        Solstice.Button.currentButton = button;
}    

/**
 * Sets the default button
 * @param {sting} button the button name that should be default.
 * @type void
 */
Solstice.Button.setDefault = function(button) {
    Solstice.Button.defaultButton = button;
}

/**
 * Sets the selected button
 * @param {string} button the name of the button that is selected
 * @type void
 */
Solstice.Button.setSelected = function(button) {
    // Hidden field holds the selected button name
    var selected_button = document.getElementById('solstice_selected_button');
    if (selected_button) selected_button.value = button;
}

/**
 * Registers a client action on a button, to be executed if the button is clicked
 * @param {string} button the name of the button to attach the action to
 * @param {function} action the function to be run
 * @type void
 */
Solstice.Button.registerClientAction = function (button, action) {
    if (action) Solstice.Button.ClientActions[button] = action;
}

/**
 * Runs the client action registered on the current/default button
 * @returns {unknown} The return value of the button's client action
 */
Solstice.Button.performClientAction = function() {
    if (Solstice.Button.currentButton == '') {
        Solstice.Button.set(Solstice.Button.defaultButton);

        // Prevent form submissions with no selected button
        if (Solstice.Button.currentButton == '') return false;
    }
        
    var retval = true;
    var action = Solstice.Button.ClientActions[Solstice.Button.currentButton];
    if (typeof(action) != 'undefined' && action != '') {
        // Client action was registered...call it
        retval = eval(action);
    }
    
    if (retval == true) {
        Solstice.Button.setSelected(Solstice.Button.currentButton);

        // Special case for forms with file upload fields
        if (Solstice.Button.uploadButton != '' && Solstice.Button.uploadButton != Solstice.Button.currentButton) {
            Solstice.Button._clearUploadForm();
        }

        // Special handling for RTE
        Solstice.YahooUI.Editor.saveAll();
    }
    Solstice.Button.set('');

    return retval;
}

/**
 * Used to prevent a form submission unless the given element has been filled out.
 * Usually used as a client_action, it focuses the given element if it has no content.
 * @param {string} id the html id of the element that must have content
 * @returns {boolean} whether the element has content
 */
Solstice.Button.stopClickUnlessContent = function (id) {
    var search = document.getElementById(id);
    if (search.value == "" || search.value.match(/^\s+$/)) {
        search.value = "";
        search.focus();
        return false;
    }
    return true;
}


/**
 * Uses a backgrouned/hidden button to navigate the user.
 * @param {string} button_name name of the button to click.
 * @private
 * @type void
 */
Solstice.Button.bounceForward = function(button_name) {
    if(document.getElementById(Solstice.getAppFormID())){
        Solstice.Button.submit(button_name);
    }else{
        setTimeout("Solstice.Button.bounceForward('"+button_name+"')", 10);
    }
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

/**
 * @function Solstice.Message.readCookie
 * @description Reads the message cookie
 * @returns {Object} Object containing message data
 */
Solstice.Message.readCookie = function() {
    var msgs = [];
    var cookie_value = Solstice.Cookie.read('message_service');
    if (cookie_value) {
        var contents = cookie_value.split('_TYPE_');
        var type     = contents.shift();
        var messages = contents.shift().split('_MSG_');
        for (i = 0; i < messages.length; i++) {
            msgs.push({'type': type, 'msg': unescape(messages[i])});
        }
        Solstice.Cookie.remove('message_service');
    }
    return msgs;
}

Solstice.Message.clear = function() {
    return Solstice.YahooUI.Message.clear();
}
Solstice.Message.setError = function(message){
    return Solstice.YahooUI.Message.set('error', message);
}
Solstice.Message.setInfo = function(message){
    return Solstice.YahooUI.Message.set('information', message);
}
Solstice.Message.setWarning = function(message){
    return Solstice.YahooUI.Message.set('warning', message);
}
Solstice.Message.setSuccess = function(message){
    return Solstice.YahooUI.Message.set('success', message);
}
Solstice.Message.addError = function(message){
    return Solstice.YahooUI.Message.set('error', message, true);
}
Solstice.Message.addInfo = function(message){
    return Solstice.YahooUI.Message.set('information', message, true);
}
Solstice.Message.addWarning = function(message){
    return Solstice.YahooUI.Message.set('warning', message, true); 
}
Solstice.Message.addSuccess = function(message){
    return Solstice.YahooUI.Message.set('success', message, true);
}

Solstice.logSurveyOpen = function(namespace, key) {
    Solstice.Remote.run('Solstice', 'new_feature_log', {data : [namespace, key, 'show_survey']});
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
                YAHOO.util.Dom.setStyle(nodes[j], "border", "2px dashed red");
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

