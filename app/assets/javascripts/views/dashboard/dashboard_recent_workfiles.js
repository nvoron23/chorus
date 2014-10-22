chorus.views.DashboardRecentWorkfiles = chorus.views.DashboardModule.extend({
    constructorName: "DashboardRecentWorkfiles",
    templateName:"dashboard/recent_workfiles",

    events:{
        "click #recent_workfiles_main_content .configure": "showOptions",
        "click #recent_workfiles_main_content .clear_list": "clearList",
        "click #recent_workfiles_configuration .cancel": "hideOptions",
        "click #recent_workfiles_configuration .submit": "saveOptions"
    },

    setup: function() {
        this.model = new chorus.models.DashboardData({});
        this.model.urlParams = { entityType: 'recent_workfiles' };
        this.model.fetch({
            success: _.bind(this.fetchComplete, this)
        });
        this.recentWorkfileModel = new chorus.models.RecentWorkfiles();
    },

    fetchComplete: function() {
        var workfiles = _.map(this.model.get("data"), function(openEvent) {
            openEvent.workfile.lastOpened = openEvent.lastOpened;
            return openEvent.workfile;
        }, this);
        this.resource = this.collection = new chorus.collections.WorkfileSet(workfiles);
        this.render();
        if (this.$('#recent_workfiles_configuration').is(':visible')) {
            this.$('#recent_workfiles_configuration').fadeOut(140);
        }
    },

    additionalContext: function () {
        return {
            modelLoaded: this.model.get("data") !== undefined,
            hasModels: this.model.get("data") ? this.model.get("data").length > 0 : false
        };
    },

    collectionModelContext: function(model) {
        return {
            iconUrl: model.iconUrl(),
            showUrl: model.showUrl(),
            workspaceShowUrl: model.workspace().showUrl(),
            workspaceIconUrl: model.workspace().defaultIconUrl("small")
        };
    },

    showOptions: function(event) {
        event.preventDefault();
        this.$('#recent_workfiles_configuration').fadeIn("fast");
        _.defer(_.bind(function () {
            this.$('#recent_workfiles_configuration .mask').css('height', this.$('#recent_workfiles_main_content').height() + 20 + 'px');
            chorus.styleSelect(this.$(".recent_items_select"));
        }, this));
        this.$(".recent_items_select").val(this.$('#recent_workfiles_main_content li').length);
    },

    hideOptions: function(event) {
        event.preventDefault();
        this.$('#recent_workfiles_configuration').fadeOut(100);
    },

    saveOptions: function(event) {
        event.preventDefault();
        this.recentWorkfileModel.save({action: "updateOption", optionValue: this.$(".recent_items_select").val()}, {
            success: _.bind(this.setup, this)
        });
    },

    clearList: function(event) {
        event.preventDefault();
        this.recentWorkfileModel.save({action: "clearList"}, {
            success: _.bind(this.setup, this)
        });
    }
});