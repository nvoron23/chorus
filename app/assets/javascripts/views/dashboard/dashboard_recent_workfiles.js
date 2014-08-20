chorus.views.DashboardRecentWorkfiles = chorus.views.DashboardModule.extend({
    constructorName: "DashboardRecentWorkfiles",
    setup: function() {
        this.model = new chorus.models.DashboardData({});
        this.requiredResources.add(this.model);
        this.model.urlParams = { entityType: 'recent_workfiles' };
        this.model.fetch();
    }
});