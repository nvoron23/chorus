chorus.models.Attachment = chorus.models.Base.include(
    chorus.Mixins.Attachment
).extend({
    constructorName: "Attachment",
    entityType: "attachment",

    showUrl: function(){
        var workspaceUrl = this.workspace() && this.workspace().get('id') && this.workspace().showUrl();
        var datasetUrl = this.dataset() && this.dataset().showUrl();
        var workfileUrl = this.workfile() && this.workfile().showUrl();
        var hdfsFileUrl = this.hdfsFile() && this.hdfsFile().showUrl();
        var dataSource = this.dataSource() && this.dataSource().showUrl();
        var hdfsDataSourceUrl = this.hdfsDataSource() && this.hdfsDataSource().showUrl();

        return datasetUrl ||
            (workspaceUrl && workfileUrl) ||
            hdfsFileUrl ||
            workspaceUrl ||
            dataSource ||
            hdfsDataSourceUrl;
    },

    iconUrl: function(options) {
        if (this.get('iconUrl')) {
            return this.get('iconUrl');
        }
        return chorus.urlHelpers.fileIconUrl(this.get("type") || this.get("fileType"), options && options.size);
    },

    contentUrl: function() {
        if (this.get('contentUrl')) {
            return this.get('contentUrl');
        }
        else {
            return null;
        }
    },

    downloadUrl:function () {
        return "/attachments/" + this.get("id") + "/download/" ;
    },

    thumbnailUrl: function () {
        return "/file/" + (this.get("fileId") || this.get("id")) + "/thumbnail";
    },

    isImage: function() {
        return this.get("type") === "IMAGE" || this.get("fileType") === "IMAGE";
    },

    workspace: function() {
        if(!this._workspace) {
            if (this.workfile()) {
                this._workspace = this.workfile().workspace();
            } else {
                this._workspace = this.get('workspace')&& !_.isEmpty(this.get('workspace')) && new chorus.models.Workspace(this.get('workspace'));
            }
        }
        return this._workspace;
    },

    workfile: function() {
        if(!this._workfile) {
            this._workfile = this.get('workfile') && new chorus.models.Workfile(this.get('workfile'));
        }
        return this._workfile;
    },

    hdfsFile: function() {
        if(!this._hdfsFile) {
            this._hdfsFile = this.get('hdfsEntry') && new chorus.models.HdfsEntry(this.get('hdfsEntry'));
        }
        return this._hdfsFile;
    },

    dataSource: function() {
        if (!this._dataSource) {
            this._dataSource = this.get('dataSource') && new chorus.models.DynamicDataSource(this.get('dataSource'));
        }
        return this._dataSource;
    },

    hdfsDataSource: function() {
        if (!this._hdfsDataSource) {
            if (this.hdfsFile()) {
                this._hdfsDataSource = this.hdfsFile().getHdfsDataSource();
            } else {
                this._hdfsDataSource = this.get('hdfsDataSource') && new chorus.models.HdfsDataSource(this.get('hdfsDataSource'));
            }
        }
        return this._hdfsDataSource;
    },

    dataset: function() {
        if(!this._dataset) {
            var dataset = this.get("dataset");
            if(dataset) {
                if (dataset.entitySubtype === "CHORUS_VIEW") {
                    this._dataset = new chorus.models.ChorusView(dataset);
                } else if(_.isEmpty(this.get("workspace"))) {
                    this._dataset = new chorus.models.DynamicDataset(dataset);
                } else {
                    this._dataset = new chorus.models.WorkspaceDataset(dataset);
                    this._dataset.set({ workspace: this.get('workspace') });
                }
            }
        }
        return this._dataset;
    }
});