//= require views/layout/page_item_list_view

chorus.views.DatasetList = chorus.views.PageItemList.extend({
    eventName: "dataset",
    constructorName: "DatasetListView",
    useLoadingSection: true,

    setup: function() {
        this.options.entityType = "dataset";
        this.options.entityViewType = chorus.views.DatasetItem;
        this.options.listItemOptions = {
            hasActiveWorkspace: this.options.hasActiveWorkspace
        };

        this._super("setup", arguments);
    },

    postRender: function() {
        var $list = this.$el;
        if(this.collection.length === 0 && this.collection.loaded) {
            var linkText = Handlebars.helpers.linkTo("#/data_sources", t("dataset.browse.linkText"));
            var noDatasetEl = $("<div class='browse_more'></div>");

            var hintText;
            if (this.collection.hasFilter && this.collection.hasFilter()) {
                hintText = t("dataset.filtered_empty");
            } else if (this.collection.attributes.workspaceId) {
                hintText = t("dataset.browse_more_workspace", {linkText: linkText});
            } else {
                hintText = t("dataset.browse_more_data_source", {linkText: linkText});
            }

            noDatasetEl.append(hintText);
            $list.append(noDatasetEl);
        }

        this._super("postRender", arguments);
    }
});
