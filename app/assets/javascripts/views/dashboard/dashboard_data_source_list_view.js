chorus.views.DashboardDataSourceList = chorus.views.Base.extend({
    constructorName: "DashboardDataSourceListView",
    templateName:"dashboard/data_source_list",
    tagName:"ul",
    additionalClass:"list",
    useLoadingSection:true,

    collectionModelContext: function(model) {
        return {
            id: model.get("theDataSource").get("id"),
            name: model.get("theDataSource").get("name"),
            imageUrl: model.get("theDataSource").providerIconUrl(),
            showUrl: model.get("theDataSource").showUrl()
        };
    }
});
