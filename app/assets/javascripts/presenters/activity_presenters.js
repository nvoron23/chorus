(function() {
    var presenterHelpers, headerDefinitions;
    chorus.presenters.Activity = chorus.presenters.Base.extend({

        headerHtml: function() {
            var string = t(presenterHelpers.headerTranslationKey(this, this.isNotification()), presenterHelpers.headerParams(this));
            return new Handlebars.SafeString(string);
        },

        timestamp: function() {
            return Handlebars.helpers.relativeTimestamp(this.model.get("timestamp"));
        },

        iconSrc: function() {
            if (this.isFailure()) {
                return "/images/message_error_med.png";
            } else if (this.model.isSuccessfulImport()) {
                return "/images/import_icon.png";
            } else {
                return this.model.author().fetchImageUrl({ size: "icon" });
            }
        },

        iconHref: function() {
            if (this.isFailure()) {
                return null;
            } else if (this.model.isSuccessfulImport()) {
                if (this.model.isHdfsImport()) {
                    return this.model.hdfsEntry().showUrl();
                } else {
                    return this.model.dataset().showUrl();
                }
            } else {
                return this.model.author().showUrl();
            }
        },

        imageSrc: function() {
            if (this.model.get("workfile").versionInfo) {
                return this.model.get("workfile").versionInfo.iconUrl;
            }
            else {
                return null;
            }
        },

        canBePromotedToInsight: function() {
            return this.model.canBePromotedToInsight();
        },

        currentUserCanDemoteFromInsight: function() {
            var user = chorus.session.user();
            return this.model.canBeDemotedBy(user);
        },

        isInsight: function() {
            return this.model.isInsight();
        },

        isUserGenerated: function() {
            return this.model.isUserGenerated();
        },

        hasCommitMessage: function() {
            return this.model.hasCommitMessage();
        },

        isWorkfileImage: function() {
            if(this.model.workfile()) {
                return this.model.workfile().get("fileType") === "image";
            }
            else {
                return false;
            }
        },

        isPublished: function() {
            return this.model.isPublished();
        },

        attachments: function() {
            return this.model.attachments().map(function (attachment) { return new chorus.presenters.Attachment(attachment); });
        },

        canEdit: function() {
            return this.model.isOwner();
        },

        isNote: function() {
            return this.model.get("action") === "NOTE";
        },

        canDelete: function() {
            return this.model.isOwner() || chorus.session.user().isAdmin();
        },

        canPublish: function() {
            return this.canDelete();
        },

        iconClass: function() {
            if (this.isFailure()) {
                return "error";
            } else if (this.model.isSuccessfulImport()) {
                return "icon";
            } else {
                return "profile";
            }
        },

        isNotification: function() {
            return this.options.isNotification || false;
        },

        isReadOnly: function() {
            return this.options.isReadOnly || false;
        },

        isFailure: function() {
            return this.model.isFailure();
        },

        hasError: function() {
            return this.model.has('errorObjects') || this.model.has('errorMessage');
        },

        id: function() {
            return this.model.id;
        },

        promotionDetails: function() {
            return Handlebars.helpers.unsafeT("insight.promoted_by", {
                promoterLink: this.model.promoterLink(),
                relativeTimestamp: this.model.promotionTimestamp()
            });
        },

        dialogEvents: function () {
            var events = {};
            var model = this.model;

            var action = model.get("action");
            var options = headerDefinitions[action];
            _.each(options.dialogs, function (dialog) {
                var associatedModel = model[dialog.name]();

                events["click a." + associatedModel.constructorName] = function (e) {
                    e && e.preventDefault();
                    (new dialog.dialogClass({model: associatedModel})).launchModal();
                };
            });

            return events;
        }
    });

    function chorusViewSourceModel(self) {
        var object = self.model.get("sourceObject");
        var model;
        if (object.fileName) {
            model = new chorus.models.Workfile(object);
        } else {
            model = new chorus.models.WorkspaceDataset(object);
            var workspace = self.model.workspace();
            model.set({workspace: workspace});
        }
        return model;
    }

    function chorusViewModel(self) {
        var object = self.model.get("sourceDataset");
        var model;

        model = new chorus.models.WorkspaceDataset(object);
        var workspace = self.model.workspace();
        model.set({workspace: workspace});
        return model;
    }

    headerDefinitions =  {
        CredentialsInvalid: {
            links: [ "dataSource" ],
            computed: [ "updateCredentialsLink" ]
        },
        DataSourceChangedName: {
            links: [ "actor", "dataSource" ],
            attrs: [ "newName", "oldName" ]
        },

        HdfsDataSourceChangedName: {
            links: [ "actor", "hdfsDataSource" ],
            attrs: [ "newName", "oldName" ]
        },

        DataSourceCreated: {
            links: [ "actor", "dataSource" ]
        },

        DataSourceDeleted: {
            links: [ "actor", "dataSource" ]
        },

        GnipDataSourceCreated: {
            links: [ "actor", "gnipDataSource" ]
        },

        HdfsDataSourceCreated: {
            links: [ "actor", "hdfsDataSource" ]
        },

        DataSourceChangedOwner: {
            links: [ "actor", "dataSource", "newOwner" ]
        },

        PublicWorkspaceCreated: {
            links: [ "actor", "workspace" ]
        },

        PrivateWorkspaceCreated: {
            links: [ "actor", "workspace" ]
        },

        WorkspaceMakePublic: {
            links: [ "actor", "workspace" ]
        },

        WorkspaceToShowSandboxDatasets: {
            links: [ "actor", "workspace" ]
        },

        WorkspaceToNoLongerShowSandboxDatasets: {
            links: [ "actor", "workspace" ]
        },

        WorkspaceMakePrivate: {
            links: [ "actor", "workspace" ]
        },

        WorkspaceArchived: {
            links: [ "actor", "workspace" ]
        },

        WorkspaceDeleted: {
            links: [ "actor", "workspace" ]
        },

        WorkspaceUnarchived: {
            links: [ "actor", "workspace" ]
        },

        WorkfileCreated: {
            links: [ "actor", "workfile", "workspace" ]
        },

        WorkspaceAddSandbox: {
            links: [ "actor", "workspace" ]
        },

        SourceTableCreated: {
            links: [ "actor", "dataset", "workspace" ],
            computed: [ "datasetType" ]
        },

        UserAdded: {
            links: [ "newUser"]
        },

        HdfsFileExtTableCreated: {
            links: [ "actor", "hdfsEntry", "workspace", "dataset"]
        },

        HdfsDirectoryExtTableCreated: {
            links: [ "actor", "hdfsEntry", "workspace", "dataset"]
        },

        HdfsPatternExtTableCreated: {
            links: [ "actor", "hdfsEntry", "workspace", "dataset"],
            attrs: ['filePattern']
        },

        HdfsDatasetExtTableCreated: {
            links: [ "actor", "hdfsDataset", "dataset"]
        },

        NOTE: {
            links: [ "actor", "noteObject", "workspace" ],
            computed: [ "noteObjectType" ]
        },

        FileImportCreated: {
            links: ["actor", "workspace", "dataset"],
            attrs: ["importType"],
            computed: ["importSourceLink", "datasetType", "destObjectOrName"]
        },

        FileImportSuccess: {
            links: ["workspace", "dataset"],
            attrs: ["importType"],
            computed: ["importSourceLink", "datasetType", "destObjectOrName"]
        },

        FileImportFailed: {
            links: ["workspace"],
            attrs: ["importType", "destinationTable"],
            computed: ["importSourceLink", "datasetType", "destObjectOrName"]
        },

        MembersAdded: {
            links: ["actor", "workspace", "member"],
            computed: ["countExcludingNamed"]
        },

        WorkspaceImportCreated: {
            links: ["actor", "workspace", "dataset"],
            attrs: ["sourceTable"],
            computed: ["importSourceDatasetLink", "datasetType", "destObjectOrName"]
        },

        ImportScheduleUpdated: {
            links: ["actor", "workspace", "dataset"],
            attrs: ["sourceTable"],
            computed: ["importSourceDatasetLink", "datasetType", "destObjectOrName"]
        },

        ImportScheduleDeleted: {
            links: ["actor", "workspace", "dataset"],
            attrs: ["sourceTable"],
            computed: ["importSourceDatasetLink", "datasetType", "destObjectOrName"]
        },

        WorkspaceImportSuccess: {
            links: ["workspace", "dataset"],
            attrs: ["sourceTable"],
            computed: ["importSourceDatasetLink", "datasetType"]
        },

        WorkspaceImportFailed: {
            links: ["workspace"],
            attrs: ["sourceDataset"],
            computed: ["importSourceDatasetLink", "datasetType", "destObjectOrName"]
        },

        SchemaImportSuccess: {
            computed: ["destinationDatasetInSchemaLink", "sourceDatasetInSchemaLink", 'destinationSchemaLink']
        },

        SchemaImportFailed: {
            computed: ["sourceDatasetInSchemaLink", 'destinationSchemaLink', 'destObjectOrNameInSchema']
        },

        SchemaImportCreated: {
            links: ["actor", "schema"],
            computed: ["sourceDatasetInSchemaLink", "datasetType", "destObjectOrNameInSchema"]
        },

        GnipStreamImportCreated: {
            links: ["actor", "gnipDataSource", "dataset"],
            attrs: ["destinationTable"],
            computed: ["destObjectOrName"]
        },

        GnipStreamImportSuccess: {
            links: ["workspace", "gnipDataSource", "dataset"]
        },

        GnipStreamImportFailed: {
            links: ["workspace", "gnipDataSource"],
            attrs: ["destinationTable"]
        },

        WorkfileUpgradedVersion: {
            links: [ "actor", "workfile", "workspace" ],
            computed: ["versionLink"]
        },

        WorkfileVersionDeleted: {
            links: [ "actor", "workfile", "workspace" ],
            attrs: ["versionNum"]
        },

        WorkFlowUpgradedVersion: {
            links: [ "actor", "workfile"]
        },

        ChorusViewCreated: {
            links: [ "actor", "workspace", "dataset"],
            computed: [ "chorusViewSourceLink", "chorusViewSourceType" ]
        },

        ChorusViewChanged: {
            links: ["actor", "workspace", "dataset"]
        },

        ViewCreated: {
            links: [ "actor", "workspace", "dataset"],
            computed: [ "chorusViewLink" ]
        },

        WorkspaceChangeName: {
            links: ["actor", "workspace"],
            attrs: ["workspaceOldName"]
        },

        ProjectStatusChanged: {
            links: ["actor", "workspace"],
            attrs: ["reason"],
            computed: ["status"]
        },

        TableauWorkbookPublished: {
            links: ["actor", "dataset"],
            computed: ["datasetType", "tableauWorkbookLink", "tableauProjectLink"]
        },

        TableauWorkfileCreated: {
            links: ["actor", "workspace", "dataset", "workfile"],
            computed: ["datasetType"]
        },

        SUB_COMMENT: {
            links: ["author"]
        },

        HdfsDatasetCreated: {
            links: ["actor", "workspace", "dataset"]
        },

        HdfsDatasetUpdated: {
            links: ["actor", "workspace", "dataset"]
        },

        HdfsImportSuccess: {
            links: ["actor", "hdfsEntry", "hdfsDataSource"]
        },

        HdfsImportFailed: {
            links: ["actor", "hdfsDataSource"],
            computed: ["fileName"]
        },

        JobSucceeded: {
            links: ["actor", "job", "workspace"],
            dialogs: [{name: "jobResult", dialogClass: chorus.dialogs.JobResultDetail, linkTranslation: 'job.show_details'}]
        },

        JobFailed: {
            links: ["actor", "job", "workspace"],
            dialogs: [{name: "jobResult", dialogClass: chorus.dialogs.JobResultDetail, linkTranslation: 'job.show_errors'}]
        },

        JobDisabled: {
            links: ["actor", "job", "workspace"]
        },

        WorkfileResult: {
            links: ["workfile"]
        }
    };

    presenterHelpers = {
        headerParams: function(self) {
            var model = self.model;
            var action = model.get("action");

            var params = {};
            var options = headerDefinitions[action];

            _.each(options.links, function(name) {
                var associatedModel = model[name]();
                params[name + "Link"] = presenterHelpers.modelLink(associatedModel);
            });

            _.each(options.attrs, function(name) {
                params[name] = model.get(name);
            });

            _.each(options.computed, function(name) {
                params[name] = presenterHelpers[name](self);
            });

            _.each(options.dialogs, function (dialog) {
                var associatedModel = model[dialog.name]();
                params[dialog.name + "Dialog"] = presenterHelpers.dialogLink(associatedModel, dialog.linkTranslation);
            });

            return params;
        },

        defaultStyle: function(self, isNotification) {
            if (self.get("action") === "MembersAdded") {
                if (isNotification === true) return "notification.default";

                switch(self.get("numAdded")) {
                case 1:
                    return 'one.default';
                case 2:
                    return 'two.default';
                default:
                    return 'many.default';
                }
            } else if (self.workspace().id && self.get("actionType") !== "NoteOnWorkspace") {
                return 'default';
            } else {
                return 'without_workspace';
            }
        },

        displayStyle: function(self, style, isNotification) {
            if (self.get("action") === "MembersAdded") {
                if (isNotification === true) return ("notification." + style);

                switch(self.get("numAdded")) {
                case 1:
                    return ('one.' + style);
                case 2:
                    return ('two.' + style);
                default:
                    return ('many.' + style);
                }
            } else if (self.get("action").lastIndexOf("FileImport", 0) === 0 ||
                       self.get("action").lastIndexOf("WorkspaceImport", 0) === 0) {
                return "";
            } else {
                return style;
            }
        },

        headerTranslationKey: function(self, isNotification) {
            var mainKey = ["activity.header", self.model.get("action")].join(".");
            var possibleStyles = _.compact(_.flatten([presenterHelpers.displayStyle(self.model, self.options.displayStyle, isNotification), presenterHelpers.defaultStyle(self.model, isNotification), 'default']));
            var key, n = possibleStyles.length;

            if (isNotification) {
                mainKey += ".notification";
            }
            for(var i = 0; i < n; i++) {
                key = [mainKey, possibleStyles[i]].join(".");
                if(I18n.lookup(key)) return key;
            }
        },

        datasetType: function(self) {
            var type = self.model.dataset().metaType();
            return t("dataset.entitySubtypes." + type);
        },

        tableauWorkbookLink: function(self) {
            var workbookName = self.model.get("workbookName");
            var workbookUrl = self.model.get("workbookUrl");
            return "<a href='" + workbookUrl  + "' target='_blank'>" + workbookName + "</a>";
        },

        tableauProjectLink: function(self) {
            var projectName = self.model.get("projectName");
            var projectUrl = self.model.get("projectUrl");
            return "<a href='" + projectUrl  + "' target='_blank'>" + projectName + "</a>";
        },

        countExcludingNamed: function(self)    {
            return self.model.get("numAdded") - 1;
        },

        noteObjectType: function(self) {
            var actionType = self.model.get("actionType");
            switch (actionType) {
            case "NoteOnDataSource":
            case "NoteOnHdfsDataSource":
            case "NoteOnGnipDataSource":
                return "data source";
            case "NoteOnHdfsFile":
                return "file";
            case "NoteOnWorkspace":
                return "workspace";
            case "NoteOnWorkfile":
                return "workfile";
            case "NoteOnDataset":
            case "NoteOnWorkspaceDataset":
                return presenterHelpers.datasetType(self);
            default:
                return "";
            }
        },

        importSourceLink: function(self) {
            return self.model.get("fileName");
        },

        importSourceDatasetLink: function(self) {
            var workspace = self.model.get("workspace");
            var dataset = self.model.get("sourceDataset");
            dataset.workspace = workspace;
            var dataset_model = new chorus.models.WorkspaceDataset(dataset);
            return dataset_model.showLink();
        },

        chorusViewSourceLink: function(self) {
            return chorusViewSourceModel(self).showLink();
        },

        chorusViewLink: function(self) {
            return chorusViewModel(self).showLink();
        },

        chorusViewSourceType: function(self) {
            var model = chorusViewSourceModel(self);
            return model.get("fileName") ? "workfile" : t("dataset.entitySubtypes." + chorusViewSourceModel(self).metaType());
        },

        updateCredentialsLink: function(self) {
            if(self.model.get("dataSource").isDeleted) {
                return t('dataset.credentials.missing.linkText');
            }
            return Handlebars.helpers.linkTo('#', t('dataset.credentials.missing.linkText'), {'class': 'update_credentials'});
        },

        versionLink: function(self) {
            var versionNum          = self.model.get("versionNum");
            var versionId           = self.model.get("versionId");
            var versionIsDeleted    = self.model.get("versionIsDeleted");
            var workfile            = self.model.get("workfile");
            var isDeleted           = workfile.isDeleted || versionIsDeleted;

            var workfile_version = new chorus.models.Workfile({
                versionInfo: { id : versionId },
                id : workfile.id,
                workspace: workfile.workspace,
                isDeleted: isDeleted
            });

            return workfile_version.showLink(t("workfile.version_title", { versionNum: versionNum }));
        },

        destinationSchemaLink: function(self) {
            var schema = self.model.dataset().schema();
            if (!schema) {
                schema = new chorus.models.Schema(self.model.get('schema'));
            }
            return schema.showLink();
        },

        destinationDatasetInSchemaLink: function(self){
            return (new chorus.models.DynamicDataset(self.model.dataset().attributes)).showLink();
        },

        sourceDatasetInSchemaLink: function(self){
            return (new chorus.models.DynamicDataset(self.model.importSource().attributes)).showLink();
        },

        datasetLink: function(self) {
            return self.model.get("destinationTable");
        },

        // this is the one that returns a WorkspaceDataset
        destObjectOrName: function(self) {
            var dataset = self.model["dataset"]();
            if (dataset.get("id")) {
                return presenterHelpers.modelLink(dataset);
            }
            return self.model.get("destinationTable");
        },

        // this is the one that returns a Dataset
        destObjectOrNameInSchema: function(self) {
            var dataset = self.model["dataset"]();
            if (dataset.get("id")){
                return (new chorus.models.DynamicDataset(dataset.attributes)).showLink();
            }
            return self.model.get("destinationTable");
        },

        modelLink: function(model) {
            return Handlebars.helpers.linkTo(model.showUrl(), model.name());
        },

        dialogLink: function (model, linkTranslation) {
            return Handlebars.helpers.linkTo('#', t(linkTranslation), { 'class': model.constructorName });
        },

        status: function(self) {
            return t('workspace.project.status.' + self.model.get("status"));
        },

        fileName: function (self) {
            return self.model.get("fileName");
        }
    };
})();
