chorus.views.WorkspaceDatasetIndexPageButtons = chorus.views.Base.extend({

    constructorName: "WorkspaceDatasetIndexPageButtonsView",

    templateName: "workspace_dataset_index_page_buttons",

    createActions: [
        {className: 'import_file', text: t("actions.import_file")},
        {className: 'create_hdfs_dataset', text: t("actions.create_hdfs_dataset")}
    ],

    menuEvents: {
        "a.import_file": function(e) {
            e && e.preventDefault();
            new chorus.dialogs.FileImport({ workspace: this.model }).launchModal();
        },
        "a.create_hdfs_dataset": function(e) {
            e && e.preventDefault();
            new chorus.dialogs.CreateHdfsDataset({ workspace: this.model }).launchModal();
        }
    },

    setup: function() {
        this.model.fetchIfNotLoaded();
    },

    postRender: function() {
        this.menu(this.$('.add_data'), {
            content: this.$(".add_data_menu"),
            orientation: "right",
            contentEvents: this.menuEvents
        });
        if (!this.model.sandbox() || !this.canUpdate()) {
          this.$(".import_file").closest("li").addClass("hidden");
        }
    },

    additionalContext: function() {
        return {
            canUpdate: this.canUpdate(),
            createActions: this.createActions
        };
    },

    canUpdate: function() {
        return this.model.loaded && this.model.canUpdate() && this.model.isActive();
    }
});