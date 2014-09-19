chorus.views.DashboardRecentWorkfiles = chorus.views.DashboardModule.extend({
    constructorName: "DashboardRecentWorkfiles",
    templateName:"dashboard/recent_workfiles",

    setup: function() {
        this.model = new chorus.models.DashboardData({});
        this.model.urlParams = { entityType: 'recent_workfiles' };
        this.model.fetch({
            success: _.bind(this.fetchComplete, this)
        });
    },

    fetchComplete: function() {
        var workfiles = _.map(this.model.get("data"), function(openEvent) {
            openEvent.workfile.lastOpened = openEvent.lastOpened;
            return openEvent.workfile;
        }, this);
        this.resource = this.collection = new chorus.collections.WorkfileSet(workfiles);
        this.render();
    },

    collectionModelContext: function(model) {
        return {
            iconUrl: model.iconUrl(),
            showUrl: model.showUrl(),
            workspaceShowUrl: model.workspace().showUrl(),
            workspaceIconUrl: model.workspace().defaultIconUrl("small")
        };
    }
});
