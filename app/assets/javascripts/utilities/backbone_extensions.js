function consoleIterateValues (obj) {
    var keys = Object.keys(obj);

    for (var i = 0; i < keys.length; i++) {
        var val = obj[keys[i]];
        console.log ( i + "->" + val);
    }
}

var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'delete': 'DELETE',
    'read'  : 'GET'
};

// override for default backbone.sync routine
Backbone.sync = function(method, model, options) {
    var originalOptions = _.clone(options || {});
    method = (options && options.method) || method;

    console.log ("BExtensions | originalOptions ->" + originalOptions);
    consoleIterateValues(originalOptions);
    console.log ("end originalOptions ---"); 
    console.log ("BExtensions | originalOptions ->" + options.method);   
    console.log ("BExtensions | method ->" + method);
    
    var type = methodMap[method];

    console.log ("BExtensions | type1 ->" + type);
    
    // Default options, unless specified
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });

    // Default JSON-request options
    var params = {type: type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
        // urlError is in scope in the actual backbone file
        /*global urlError:true */
        var urlOptions = _.extend(originalOptions, { method: method });
        params.url = model.url(urlOptions) || urlError();
        /*global urlError:false */
    }

    // Ensure that we have the appropriate request data
    var json;
    if (!options.data && model && (method === 'create' || method === 'update' || method === 'patch')) {
        params.contentType = 'application/json';

        // Let the model specify its own params
        var string = JSON.stringify(model.toJSON());
        json = $.parseJSON(string);
        _.each(json, function(property, key) {
            if (property === null) delete json[key];
        });
        params.data = JSON.stringify(json);
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form
    if (options.emulateJSON) {
        params.contentType = 'application/x-www-form-urlencoded';
        params.data = params.data ? {model: params.data} : {};
        
        console.log ("BExtensions | in options.emulateHTTP data ->" + params.data);
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {

        params.type = 'POST';
        console.log ("BExtensions | in options.emulateHTTP post ->" + params.type);
                
        if (options.emulateJSON) params.data._method = type;
        var beforeSend = options.beforeSend;
        options.beforeSend = function(xhr) {
            xhr.setRequestHeader('X-HTTP-Method-Override', type);
            if (beforeSend) return beforeSend.apply(this, arguments);
        };
    }

    // Don't process data on a non-GET request
    if (params.type !== 'GET' && !options.emulateJSON) {
        params.processData = false;
    }

    console.log ("BExtensions | (2)");
        
    // Make the request, allowing the user to override any Ajax options
    if (this.uploadObj && method === "create") {
        console.log ("B.Extensions | it is create");
        
        var uploadOptions = $(this.uploadObj.form).find("input[type=file]").data("fileupload").options;
        _.each(['success', 'error', 'url', 'type', 'dataType'], function(fieldName) {
            uploadOptions[fieldName] = params[fieldName];
        });
        uploadOptions.formData = json;
        console.log ("BExtensions | uploadOptions.formData ->" + uploadOptions.formData);
        return this.uploadObj.submit();
    } else {
        console.log ("BExtensions | else");
        var xhr = Backbone.ajax(_.extend(params, options));
        console.log ("B.Extensions | else 2");
        model.trigger('request', model, xhr, options);
          
        console.log ("BExtensions | xhr->");
        consoleIterateValues(xhr);        
        console.log ("end xhr ---");      

        console.log ("BExtensions | options ->");
        consoleIterateValues(options);
        console.log ("end options ---");
        console.log ("   ");
        
//       console.log ("BExtensions | model->");
//       consoleIterateValues(model);        
//        console.log ("end model ---");
//        console.log ("   ");

        return xhr;
    }
};

// This function overrides loadUrl from Backbone to strip off a trailing slash
//
// http://localhost/users/ => http://localhost/users
// http://localhost/users/1/ => http://localhost/users/1
//
Backbone.History.prototype.loadUrl = function(fragmentOverride) {
    var fragment = this.fragment = this.getFragment(fragmentOverride);
    if (fragment[fragment.length - 1] === '/') {
        fragment = fragment.substr(0,fragment.length-1);
    }
    return _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
            handler.callback(fragment);
            return true;
        }
    });
};

// Backbone 1.0 introduced automatic attachment of url to a model from options.
// It was promptly removed in 1.1.0, but 1.1.x introduces several more breaking changes
// (no attachment of options to Views and Collection#add,set,reset,remove
// return the changed model or list of models instead of the collection itself).
// The below is the 1.0 implementation of Backbone.Model with 'url' removed from modelOptions
Backbone.Model = (function(Model) {
    var modelOptions = ['urlRoot', 'collection'];

    return Model.extend({
        constructor: function(attributes, options) {
            var defaults; // jshint ignore:line
            var attrs = attributes || {};
            options || (options = {});
            this.cid = _.uniqueId('c');
            this.attributes = {};
            _.extend(this, _.pick(options, modelOptions));
            if (options.parse) attrs = this.parse(attrs, options) || {};
            /* jshint ignore:start */
            if (defaults = _.result(this, 'defaults')) {
                attrs = _.defaults({}, attrs, defaults);
            }
            /* jshint ignore:end */
            this.set(attrs, options);
            this.changed = {};
            this.initialize.apply(this, arguments);
        }
    });
})(Backbone.Model);

// super function, taken from here:
// -- https://gist.github.com/1542120
;(function (Backbone) {

    // Find the next object up the prototype chain that has a
    // different implementation of the method
    function findSuper(attributeName, childObject) {
        var object = childObject;
        while(object && (object[attributeName] === childObject[attributeName])) {
            object = object.constructor.__super__;
        }
        return object;
    }

    // The super method takes two parameters: a method name
    // and an array of arguments to pass to the overridden method
    // This is to optimize for the common case of passing 'arguments'
    function _super(methodName, args) {

        // Keep track of how far up the prototype chain we have traversed,
        // in order to handle nested calls to _super.
        this._superCallObjects || (this._superCallObjects = {});
        var currentObject = this._superCallObjects[methodName] || this,
            parentObject = findSuper(methodName, currentObject);
        this._superCallObjects[methodName] = parentObject;

        var result;
        if(_.isFunction(parentObject[methodName])) {
            result = parentObject[methodName].apply(this, args || []);
        } else {
            result = parentObject[methodName];
        }
        delete this._superCallObjects[methodName];
        return result;
    }

    function include(/* *modules */) {
        var modules = _.toArray(arguments);
        var mergedModules = _.extend.apply(_, [
            {}
        ].concat(modules));
        return this.extend(mergedModules);
    }

    _.each(["Model", "Collection", "View", "Router"], function(klass) {
        Backbone[klass].prototype._super = _super;
        Backbone[klass].include = include;
    });

})(Backbone);
