chorus.views.DashboardRecentWorkfiles = chorus.views.DashboardModule.extend({
    constructorName: "DashboardRecentWorkfiles",
    templateName:"dashboard/recent_workfiles",

    setup: function() {
        this.model = new chorus.models.DashboardData({});
        this.requiredResources.add(this.model);
        this.model.urlParams = { entityType: 'recent_workfiles' };
        this.model.fetch();
    },

    additionalContext: function () {
        return {
            workfileItems: _.map(this.model.get("data"), function(item) {
                item.relativeTimeStamp = Handlebars.helpers.relativeTimestamp(item.userModifiedAt);
                return item;
            })
        };
    }
});