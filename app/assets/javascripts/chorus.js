window.Chorus = function chorus$Global() {
    var self = this;
    self.models = {};
    self.views = {};
    self.views.visualizations = {};
    self.views.LocationPicker = {};
    self.pages = {};
    self.presenters = {};
    self.Mixins = {};
    self.dialogs = {};
    self.alerts = {};
    self.templates = {};
    self.features = {};
    self.utilities = {};
    self.handlebarsHelpers = {};
    self.locale = 'en';
    self.cleanupFunctions = [];
    self.viewsToTearDown = [];

    self.initialize = function() {
        // Check and prompt for Chrome Frame install if applicable
//         if (!window.jasmine && BrowserDetect.browser === "Explorer" && BrowserDetect.version <= "8") {
//             CFInstall.check({
//                 mode: "overlay"
//             });
//         }
        self.PageEvents = _.extend({}, Backbone.Events);
        self.session = new chorus.models.Session();
        self.router = new chorus.Router(self);
        self.detectFeatures();

        //bind global state events here
        self.router.bind("leaving", self._navigated);
        self.session.bind("needsLogin", self.requireLogin);
        self.bindGlobalCallbacks();
        self.bindModalLaunchingClicks();

        self.debug = self.pageParams().debug;

        self.startHistory();
        self.updateCachebuster();

        //set qtip to appear above dialogs
        $.fn.qtip.zindex = 17000;
    };

    // to enable development mode, run `rake enable_dev_mode`
    self.isDevMode = function() {
        return !!window.CHORUS_DEV_MODE;
    };

    self.bindGlobalCallbacks = function() {
        $(window).resize(_.debounce(function() {
            self.page && self.page.trigger && self.page.trigger("resized", $(window).width(), $(window).height());
        }, 100));
    };

    self.bindModalLaunchingClicks = function() {
        var firstArg = arguments[0];
        var target = arguments.length ? firstArg.el : document;
        $(target).
            on("click.chorus_modal", "[data-dialog]", null,
            function(e) { (firstArg || self.page).createDialog(e); }).
            on("click.chorus_modal", "[data-alert]", null,
            function(e) { (firstArg || self.page).createAlert(e); });

        if (window.jasmine) {
            var spec = window.jasmine.getEnv().currentSpec;
            if (spec) {
                window.afterSpecFunctions.push(function() {$(target).off("click.chorus_modal"); });
            }
        }
    };

    self.startHistory = function() {
        Backbone.history.start();
    };

    self.requireLogin = function requireLogin() {
        delete self.session._user;

        self.session.rememberPathBeforeLoggedOut();

        self.router.navigate("/login");
    };

    self.fileDownload = function(route, options) {
        var optsWithToken = _.extend({data: {}}, options);
        optsWithToken.data.authenticity_token = $('meta[name="csrf-token"]').attr('content');
        $.fileDownload(route, optsWithToken);
    };

    self.detectFeatures = function() {
        self.features.fileProgress = !$.browser.msie;
    };

    self.toast = function(message, options) {
        options = options || {};
        var toastText = options.skipTranslation ? message : t(message, options);
        var toastOpts = _.extend({message: toastText}, options.toastOpts);
        Messenger().post(toastOpts);
    };

    self.afterNavigate = function(func) {
        self.cleanupFunctions.push(func);
    };

    self._navigated = function() {
        self.PageEvents.off();

        while (!_.isEmpty(self.viewsToTearDown)) {
            var view = self.viewsToTearDown.pop();
            view.teardown();
        }

        // remove hotkey bindings and bindings to dom elements not managed by a view
        _.each(self.cleanupFunctions, function(func) {
            func();
        });
        self.cleanupFunctions = [];
    };

    self.unregisterView = function(view) {
        var index = self.viewsToTearDown.indexOf(view);
        if(index > -1) self.viewsToTearDown.splice(index, 1);
    };

    self.styleSelect = function(element, options) {
        var $element = $(element);
        if ($element.data('selectmenu')) {$element.selectmenu("destroy");}

        var changeFunction = function() {
            $(element).trigger('change');
        };
        var newOptions = _.extend({}, options, {change: changeFunction, position: {offset: "0 -1"}, open: function(event) {
            var selectElement = $(event.target);
            var selectMenu = selectElement.data('selectmenu');
            _.each(selectElement.find("option"), function(option, i) {
                selectMenu.menu.find("li").eq(i).prop("title", $(option).attr("title"));
            });
        }});
        $element.selectmenu(newOptions);

        var $linkToMenu = $element.next("span").find("a.ui-button");
        $linkToMenu.attr("title", $element.find("option:selected").attr("title") || $linkToMenu.text());
        $element.change(function() {
            $linkToMenu.attr("title", $element.find("option:selected").attr("title"));
        });
    };

    self.datePicker = function(selectors, options) {
        var formElementParams = {};

        _.each(selectors, function(el, format) {
            var uniqueId = _.uniqueId("date-picker");
            el.attr("id", uniqueId);
            formElementParams[uniqueId] = format;
        });

        _.defer(function() {
            datePickerController.createDatePicker({
                formElements: formElementParams,
                dragDisabled: true,
                callbackFunctions: {
                    "datereturned": [], // documented but never fires, so we do the following _.defer instead
                    "dateset": [
                        function() {
                            _.defer(function() {
                                for (var formElement in formElementParams) {
                                    $("#" + formElement).trigger("paste");
                                }
                            });
                        }
                    ]
                }
            });

            options && options.disableBeforeToday && _.each(formElementParams, function(v, k) {
                datePickerController.setDisabledDates(k, {
                    "00000101" : new Date($.now() - (1000  * 60 * 60 * 24)).toString("yyyyMMdd")
                });
            });
        });
    };

    self.placeholder = function(element) {
        $(element).placeholder();
    };

    function onTextChange(options, e) {
        var list = options.list,
            selector = options.selector,
            onFilter = options.onFilter,
            afterFilter = options.afterFilter,
            eventName = options.eventName,
            changedInput = $(e.target);

        var compare = changedInput.val().toLowerCase();
        list.find("li").each(function() {
            var elToMatch = selector ? $(this).find(selector) : $(this);
            var matches = (elToMatch.text().toLowerCase().indexOf(compare) >= 0);

            if (matches) {
                $(this).removeClass("hidden");
            } else {
                if (onFilter && !$(this).hasClass("hidden")) onFilter($(this));
                $(this).addClass("hidden");
            }
        });

        if (afterFilter) afterFilter();
        if (eventName) {
            chorus.PageEvents.trigger(eventName);
        }
    }

    self.search = function(options) {
        var input = options.input;
        var textChangeFunction = options.onTextChange || _.bind(onTextChange, this, options);

        input.unbind("textchange.filter").bind("textchange.filter", textChangeFunction);
        input.addClass("chorus_search");
        input.each(function(i, el) {
            self.addClearButton(el);
        });
    };

    self.addClearButton = function(input) {
        if ($(input).parent().is(".chorus_search_container")) return;

        var $input = $(input);
        var clearLink = $("<a href='#'/>")
            .append("<i class='oi search_clear' data-glyph='x'></i>")
            .addClass("chorus_search_clear hidden")
            .bind('click', function(e) {
                e.preventDefault();
                $input.val("").trigger('textchange').blur();
            });

        $input.unbind("textchange.clear_link").bind("textchange.clear_link", function() {
            clearLink.toggleClass("hidden", $input.val().length === 0);
        });
        var container = $("<div class='chorus_search_container'></div>");
        container.css({ display: $input.css("display") });
        container.insertAfter($input);
        container.append($input).append(clearLink);
    };

    self.hotKeyMeta = BrowserDetect.OS === "Mac" ? "ctrl" : "alt";

    self.hotKeyEvent = function(keyChar) {
        var ev = $.Event("keydown", { which: keyChar.toUpperCase().charCodeAt(0)});
        if (chorus.hotKeyMeta === "ctrl") {
            ev.ctrlKey = true;
        } else if (chorus.hotKeyMeta === "alt") {
            ev.altKey = true;
        }

        return ev;
    };

    self.triggerHotKey = function(keyChar) {
        $(document).trigger(chorus.hotKeyEvent(keyChar));
    };

    self.namedConstructor = function(ctor, name) {
        /*jshint evil: true */
        var result = eval("(function " + name + "() { " +
            "return ctor.apply(this, arguments); " +
        "})");
        /*jshint evil: false */
        return result;
    };

    self.classExtend = function(protoProps, classProps) {
        if (self.isDevMode()) {
            var constructorName = protoProps.constructorName || this.prototype.constructorName;
            if (constructorName) {
                _.extend(protoProps, { constructor: self.namedConstructor(this, "chorus$" + constructorName) });
            }
        }

        var subclass = Backbone.Model.extend.call(this, protoProps, classProps);
        if (this.extended) { this.extended(subclass); }

        return subclass;
    };

    self.log = function() {
        var grossHack = window["con"+"sole"];
        if (grossHack) {
            if (grossHack.groupCollapsed && grossHack.groupEnd) {
                grossHack.groupCollapsed.apply(grossHack, ["Chorus Log: "].concat(_.toArray(arguments)));
            }

            grossHack.log && grossHack.log.apply(grossHack, _.toArray(arguments));
            grossHack.trace && grossHack.trace();

            if (grossHack.groupCollapsed && grossHack.groupEnd) {
                grossHack.groupEnd();
            }
        }
    };

    self.cachebuster = function() {
        return self._cachebuster;
    };

    self.updateCachebuster = function() {
        self._cachebuster = $.now();
    };

    self.scrollToTop = function() {
        window.scroll(0, 0);
    };

    self.pageParams = function () {
        if (window.location.hash.search("\\?") === -1) { return {}; }

        var path = window.location.hash.substring(window.location.hash.search("\\?")+1);
        var decoded = decodeURI(path).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"');

        return JSON.parse('{"' + decoded + '"}');
    };
};

window.chorus = window.chorus || new window.Chorus();
