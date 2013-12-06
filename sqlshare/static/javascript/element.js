
/*****************************
 * @constructor
 * @class Element showing/hiding/selecting methods.
 */
Solstice.Element = function(source){
    this.element = Solstice.Element._inputToElement(source);
}

Solstice.Element._inputToElement = function(source){
    if (typeof source == 'string') {
        return document.getElementById(source);
    }else{
        return source;
    }
}

/**
 * Clones the element, scrubs it's id and returns a new Solstice.Element.
 * @type Solstice.Element
 */
Solstice.Element.prototype.clone = function(){
    if(this.element){
        var source = this.element;
        var element = source.cloneNode(true);
        element.removeAttribute('id');
        return new Solstice.Element(element);
    }
}


/**
 * Replaces the given id with itself
 * @type void
 */
Solstice.Element.prototype.replace = function(target){
    target = Solstice.Element._inputToElement(target);
    target.parentNode.replaceChild(this.element, target);
}

/**
 * Appends the element to a target.
 * @type void
 */

Solstice.Element.prototype.appendTo = function(target){
    target = Solstice.Element._inputToElement(target);
    target.appendChild(this.element);
}

/**
 * returns the first descendant element by classname
 * @type element
 */
Solstice.Element.prototype.getChildByClass = function(classname){
    return this.getChildrenByClass(classname).shift();
}

/**
 * returns all descendants that match the classname
 * @type array of elements
 */
Solstice.Element.prototype.getChildrenByClass = function(classname){
    return YAHOO.util.Dom.getElementsByClassName(classname, null, this.element);
}

/**
 * Hides an element
 * @param {string|object} ID of the element, or the element, to be hidden
 * @type void
 */
Solstice.Element.hide= function(el) { return new Solstice.Element(el).hide() }
Solstice.Element.prototype.hide = function () {
    if (this.element) this.element.style.display = 'none';
}



/**
 * Sets the display of the passed element to block
 * @param {string|object} ID of the element, or the element, to be shown
 * @type void
 */
Solstice.Element.showBlock = function(el) { return new Solstice.Element(el).showBlock() }
Solstice.Element.show = function(el) { return new Solstice.Element(el).showBlock() }
Solstice.Element.prototype.showBlock = function () {
    if (this.element) this.element.style.display = 'block';
}


/**
 * Sets the display of the passed element to inline
 * @param {string|object} ID of the element, or the element, to be shown
 * @type void
 */
Solstice.Element.showInline = function(el) { return new Solstice.Element(el).showInline() }
Solstice.Element.prototype.showInline = function () {
    if (this.element) this.element.style.display = 'inline';
}

Solstice.Element._setClear = function(el) { return new Solstice.Element(el)._setClear() }
Solstice.Element.prototype._setClear = function () {
    if(this.element){
        var element = this.element;
        element.style.opacity = 0;
        element.style['-moz-opacity'] = 0;
        element.style['-khtml-opacity'] = 0;
        element.style.filter = 'alpha(opacity=0)';

        if (!element.currentStyle || !element.currentStyle.hasLayout) {
            element.style.zoom = 1; // when no layout or cant tell
        }
    }
}

/**
 * Toggles the display of the passed element to block or none
 * @param {string|object} ID of the element, or the element, to be shown/hidden
 * @type void
 */
Solstice.Element.toggleBlock = function(el) { return new Solstice.Element(el).toggleBlock() }
Solstice.Element.prototype.toggleBlock = function () {
    if (this.element) {
        var element = this.element;
        element.style.display = (element.style.display == 'none') ? 'block' : 'none';
    }
}


/**
 * selects an element, like a checkbox or multiselect widget.
 * @param {string} element_id id of the element to be selected
 * @type void
 */
Solstice.Element.select = function(el) { return new Solstice.Element(el).select() }
Solstice.Element.prototype.select = function () {
    this.element.checked = "checked";
}


/**
 * Sets the browsers focus to a particular element
 * @param {string} id id of the element to be focused
 * @type void
 */
Solstice.Element.focus = function(el) { return new Solstice.Element(el).focus() }
Solstice.Element.prototype.focus = function () {
    var input = this.element;
    if (input && input.type != "hidden") input.focus();
}

/**
 * Scrolls the browser viewport to the given element.
 * @param {string} id the ID of the element to scroll to
 * @type void
 */
Solstice.Element.scrollTo = function(el) { return new Solstice.Element(el).scrollTo() }
Solstice.Element.prototype.scrollTo = function () {
    if (this.element) {
        var input = this.element;
        var pos = Solstice.Geometry.getOffsetTop(input) - 40;
        if (pos < 0) pos = 0;
        window.scrollTo(0, pos);
    }
    return false;
}


