chorus.Modal = chorus.views.Base.extend({
    constructorName: "Modal",
    verticalPadding: 30,
    focusSelector: 'input:eq(0)',

    launchModal: function() {
        if (chorus.modal && this !== chorus.modal) {
            chorus.modal.launchSubModal(this);
        } else {
            this.launchNewModal();
        }
    },

    launchNewModal:function () {
        this.render();
        $(document).one('reveal.facebox', _.bind(this.beginReveal, this));
        $.facebox(this.el);
        this.previousModal = chorus.modal;
        this.restore();
        this.showErrors();
    },

    launchSubModal: function(subModal) {
        this.ignoreFacebox();
        this.background();

        $.facebox.settings.inited = false;
        subModal.launchNewModal();
    },

    resize: function(windowWidth, windowHeight) {
        var $popup = $("#facebox .popup");
        var $facebox = $('#facebox');
        var $window = $(window);

        if (!windowHeight) windowHeight = $window.height();

        $facebox.css('top', this.verticalPadding + 'px');
        var popupHeight = windowHeight - this.verticalPadding*2;
        $popup.css("max-height", popupHeight + "px");
    },

    preRender: function() {
        var result = this._super('preRender', arguments);

        $(window).resize(this.resize);

        this.preventScrollingBody();

        return result;
    },

    centerHorizontally: function () {
        $('#facebox').css('left', $(window).width() / 2 - ($('#facebox .popup').width() / 2));
    },

    postRender: function() {
        this._super("postRender");
        this.centerHorizontally();
    },

    makeModel:function (options) {
        if (options && options.pageModel) {
            this.pageModel = options.pageModel;
            this.model = this.model || this.pageModel;
        }
    },

    closeModal:function (success) {
        $(document).trigger("close.facebox");
        if (success === true) {
            $(document).trigger("close.faceboxsuccess");
        }
    },

    keydownHandler:function (e) {
        if (e.keyCode === 27) {
            this.escapePressed();
        }
    },

    escapePressed:function () {
        this.closeModal();
    },

    modalClosed:function () {
        if (this === chorus.modal) {
            this.close();
            $("#facebox").remove();
            $.facebox.settings.inited = false;
            chorus.PageEvents.trigger("modal:closed", this);

            delete chorus.modal;
            this.ignoreFacebox();

            if (this.previousModal) {
                this.previousModal.restore();
            } else {
                this.restoreScrollingBody();
            }
        }
        this.teardown();
    },

    restore: function () {
        chorus.modal = this;
        this.foreground();
        this.listenToFacebox();
        this.recalculateScrolling();
        _.defer(this.resize);
    },

    foreground: function () {
        $("#facebox-" + this.faceboxCacheId).attr("id", "facebox").removeClass("hidden");
        $("#facebox_overlay-" + this.faceboxCacheId).attr("id", "facebox_overlay");
        this.resize();
    },

    background: function () {
        this.faceboxCacheId = Math.floor((Math.random()*1e8)+1).toString();
        $("#facebox").attr("id", "facebox-" + this.faceboxCacheId).addClass("hidden");
        $("#facebox_overlay").attr("id", "facebox_overlay-" + this.faceboxCacheId);
    },

    listenToFacebox: function() {
        this.boundModalClosed = _.bind(this.modalClosed, this);
        this.boundKeyDownHandler = _.bind(this.keydownHandler, this);
        $(document).one("close.facebox", this.boundModalClosed);
        $(document).bind("keydown.facebox", this.boundKeyDownHandler);
    },

    ignoreFacebox: function() {
        $(document).unbind("close.facebox", this.boundModalClosed);
        $(document).unbind("keydown.facebox", this.boundKeyDownHandler);
        delete this.boundModalClosed;
        delete this.boundKeyDownHandler;
    },

    preventScrollingBody: function() {
        $("body").css("overflow", "hidden");
    },

    restoreScrollingBody: function() {
        $("body").css("overflow", "visible");
    },

    close:$.noop,
    revealed: $.noop,

    beginReveal: function() {
        this.revealed();
        if (this.focusSelector) {
            this.$(this.focusSelector).focus();
        }
    },

    saveFailed: function(model) {
        this.$("button.submit").stopLoading();
        this.$("button.cancel").prop("disabled", false);
        if(model) {
            this.showErrors(model);
        } else {
            this.showErrors();
        }
    }
});

if (window.jasmine) {
    chorus.Modal.prototype.preventScrollingBody = $.noop;
    chorus.Modal.prototype.restoreScrollingBody = $.noop;
}
