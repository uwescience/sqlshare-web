"use strict";
var HandlebarsUtils = (function() {
    "use strict";
    var compiled_templates = {};

    function load_template(name) {
        if (!compiled_templates[name]) {
            var source = document.getElementById(name).innerHTML;
            var compiled = Handlebars.compile(source);
            compiled_templates[name] = compiled;
        }

        return compiled_templates[name];
    }

    function to_string(template, params) {
        var handlebars_name = template;
        handlebars_name = handlebars_name.replace("/", "_");
        handlebars_name = handlebars_name.replace(".html", "");

        var compiled = load_template(handlebars_name);

        return compiled(params);
    }

    return {
        load_template: load_template,
        to_string: to_string
    };

})();

