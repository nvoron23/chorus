chorus.views.HdfsEntrySidebar = chorus.views.Sidebar.extend({
    constructorName: "HdfsEntrySidebar",
    templateName: "hdfs_entry_sidebar",

    subviews: {
        '.tab_control': 'tabs'
    },

    events : {
        'click .external_table': 'createExternalTable',
        'click .directory_external_table': "openDirectoryExternalTable",
        "click .edit_tags": "startEditingTags",
        "click .add_note": "launchNotesNewDialog",
        "click .associate_with_workspace": "launchAssociateWithWorkspaceDialog"
    },

    setup: function() {
        this.subscribePageEvent("hdfs_entry:checked", this.setEntry);
        this.subscribePageEvent("csv_import:started", this.refreshActivities);
        this.tabs = new chorus.views.TabControl(["activity", "statistics"]);
    },

    refreshActivities: function() {
        this.tabs.activity && this.tabs.activity.collection.fetch();
    },

    postRender: function() {
        this._super("postRender");
        if (this.resource && this.resource.get("isDir")) {
            this.$(".tab_control").addClass("hidden");
            this.$(".tabbed_content_area").addClass("hidden");
        } else {
            this.$(".tab_control").removeClass("hidden");
            this.$(".tabbed_content_area").removeClass("hidden");
        }
    },

    setEntry: function(collection) {
        var entry = collection.first();
        if (!entry) { return false; }

        this.resource && this.stopListening(this.resource, "unprocessableEntity");
        this.resource = entry;
        if (entry) {
            if (!entry.get("isDir")) {
                this.createActivitiesTab(entry);
                this.createStatisticsTab(entry);
            }
        } else {
            delete this.tabs.activity;
            delete this.tabs.statistics;
        }

        this.listenTo(this.resource, "unprocessableEntity", function() {
            var record = this.resource.serverErrors.record;
            chorus.toast("record_error." + record, {toastOpts: {type: 'error'}});
        });

        this.render();
    },

    createStatisticsTab: function (entry) {
        this.tabs.statistics = new chorus.views.HdfsEntryStatistics({model: entry});
    },

    createActivitiesTab: function (entry) {
        entry.entityId = this.resource.id;

        if (this.tabs.activity ) {
            delete this.tabs.activity ;
        }

        if (!entry.get("isDir")) {
            var activities = entry.activities();
            activities.fetch();

            this.listenTo(activities, "changed", this.render);
            this.listenTo(activities, "reset", this.render);

            this.tabs.activity = new chorus.views.ActivityList({
                collection: activities,
                additionalClass: "sidebar",
                type: t("hdfs." + (entry.get("isDir") ? "directory" : "file"))
            });
        }
    },

    additionalContext: function() {
        return new chorus.presenters.HdfsEntrySidebar(this.resource, this.options);
    },

    createExternalTable: function(e) {
        e && e.preventDefault();

        this.resource.fetch().success(_.bind(this.launchCreateExternTableDialog, this));
    },

    launchCreateExternTableDialog: function() {
        var externalTable = new chorus.models.HdfsExternalTable({
            path: this.resource.get('path'),
            hdfsDataSourceId: this.resource.get('hdfsDataSource').id,
            hdfs_entry_id: this.resource.get('id')
        });

        var dialog = new chorus.dialogs.CreateExternalTableFromHdfs({
            model: externalTable,
            csvOptions: {
                tableName: this.resource.name(),
                contents: this.resource.get('contents')
            }
        });
        dialog.launchModal();
    },

    launchNotesNewDialog: function(e) {
        e && e.preventDefault();
        var dialogOptions = {
            pageModel: this.resource,
            entityId: this.resource.id,
            entityType: "hdfs_file",
            allowWorkspaceAttachments: false,
            displayEntityType: t("hdfs.file_lower")
        };

        var dialog = new chorus.dialogs.NotesNew(dialogOptions);
        dialog.launchModal();
    },

    openDirectoryExternalTable: function(e) {
        e.preventDefault();
        new chorus.dialogs.HdfsDataSourceWorkspacePicker({model: this.resource, activeOnly: true}).launchModal();
    },

    startEditingTags: function(e) {
        e.preventDefault();
        new chorus.dialogs.EditTags({collection: new chorus.collections.Base([this.resource])}).launchModal();
    },

    launchAssociateWithWorkspaceDialog: function(e) {
        e && e.preventDefault();
        var dialog = new chorus.dialogs.AssociateHdfsDatasetFromEntry({pageModel: this.resource});

        dialog.launchModal();
    }
});
