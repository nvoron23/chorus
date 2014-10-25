chorus.pages.SearchIndexPage = chorus.pages.Base.extend({
    crumbs: [
        { label: t("breadcrumbs.home"), url: "#/" },
        { label: t("breadcrumbs.search_results") }
    ],
    helpId: "search",

    parseSearchParams: function(searchParams) {
        var attrs = {
            query: (searchParams[2] || searchParams[0])
        };
        if(searchParams.length === 3) {
            attrs.searchIn = searchParams[0];
            attrs.entityType = searchParams[1];
        }
        return attrs;
    },

    makeModel: function() {
        var searchParams = _.toArray(arguments);
        this.model = this.search = new chorus.models.SearchResult(this.parseSearchParams(searchParams));
        this.listenTo(this.model, "loaded", this.resourcesLoaded);
        this.handleFetchErrorsFor(this.model);
        this.model.fetch();
    },

    unprocessableEntity: function(search) {
        chorus.pageOptions = {
            title: t("search.bad_entity_type.title"),
            text: t("search.bad_entity_type.text")
        };
        Backbone.history.loadUrl("/unprocessableEntity");
    },

    searchInMenuOptions: function() {
        return  [
            {data: "all", text: t("search.in.all")},
            {data: "my_workspaces", text: t("search.in.my_workspaces")}
        ];
    },

    typeOptions: function() {
        return [
            {data: "all", text: t("search.type.all")},
            {data: "workfile", text: t("search.type.workfile")},
            {data: "attachment", text: t("search.type.attachment")},
            {data: "hdfs_entry", text: t("search.type.hdfs_entry")},
            {data: "dataset", text: t("search.type.dataset")},
            {data: "data_source", text: t("search.type.data_source")},
            {data: "workspace", text: t("search.type.workspace")},
            {data: "user", text: t("search.type.user")}
        ];
    },

    title: function() {
        return t("search.index.title", {
            query: this.model.displayShortName()
        });
    },

    resourcesLoaded: function() {
        this.mainContent = new chorus.views.MainContentView({
            contentHeader: new chorus.views.ListHeaderView({
                title: this.title(),
                linkMenus: {
                    search_in: {
                        title: t("search.search_in"),
                        options: this.searchInMenuOptions(),
                        chosen: this.search.searchIn(),
                        event: "search_in"
                    },
                    type: {
                        title: t("search.show"),
                        chosen: this.search.entityType(),
                        options: this.typeOptions(),
                        event: "filter"
                    }
                }
            }),
            content: new chorus.views.SearchResults({ model: this.model })
        });
        if(this.search.isPaginated() && !this.search.workspace()) {
            this.mainContent.contentDetails = new chorus.views.ListContentDetails({ collection: this.search.getResults(), modelClass: "SearchResult", multiSelect: true});
            this.mainContent.contentFooter = new chorus.views.ListContentDetails({ collection: this.search.getResults(), modelClass: "SearchResult", hideCounts: true, hideIfNoPagination: true });
        }

        this.sidebars = {
            hdfs: new chorus.views.HdfsEntrySidebar(),
            user: new chorus.views.UserSidebar({listMode: true}),
            workspace: new chorus.views.WorkspaceListSidebar(),
            dataset: new chorus.views.DatasetSidebar({listMode: true, searchPage: true}),
            dataSource: new chorus.views.DataSourceListSidebar({searchPage: true}),
            attachment: new chorus.views.ArtifactListSidebar()
        };

        this.multiSelectSidebarMenu = new chorus.views.MultipleSelectionSidebarMenu({
            selectEvent: "checked",
            actionProvider: [{name: "edit_tags", target: chorus.dialogs.EditTags}]
        });

        // explicitly set up bindings after initializing sidebar collection
        this.subscribePageEvent("hdfs_entry:selected", this.hdfsSelected);
        this.subscribePageEvent("workspace:selected", this.workspaceSelected);
        this.subscribePageEvent("dataset:selected", this.datasetSelected);
        this.subscribePageEvent("workfile:selected", this.workfileSelected);
        this.subscribePageEvent("user:selected", this.userSelected);
        this.subscribePageEvent("data_source:selected", this.dataSourceSelected);
        this.subscribePageEvent("attachment:selected", this.attachmentSelected);

        this.subscribePageEvent("choice:search_in", this.scopeSearchResults);
        this.subscribePageEvent("choice:filter", this.filterSearchResults);

        this.render();
    },

    hdfsSelected: function() {
        this.renderSidebar(this.sidebars.hdfs);
    },

    workspaceSelected: function() {
        this.renderSidebar(this.sidebars.workspace);
    },

    datasetSelected: function() {
        this.renderSidebar(this.sidebars.dataset);
    },

    workfileSelected: function(workfile) {
        var sidebar = chorus.views.WorkfileSidebar.buildFor({model: workfile, showEditingLinks: false});
        this.renderSidebar(sidebar);
    },

    userSelected: function(user) {
        this.sidebars.user.setUser(user);
        this.renderSidebar(this.sidebars.user);
    },

    dataSourceSelected: function(dataSource) {
        this.sidebars.dataSource.setDataSource(dataSource);
        this.renderSidebar(this.sidebars.dataSource);
    },

    attachmentSelected: function(attachment) {
        this.sidebars.attachment.setArtifact(attachment);
        this.renderSidebar(this.sidebars.attachment);
    },

    renderSidebar: function(sidebar) {
        this.sidebar && $(this.sidebar.el).removeClass("attachment_list_sidebar workspace_list_sidebar dataset_list_sidebar user_list_sidebar hdfs_list_sidebar");
        this.teardownSidebar();
        this.sidebar = sidebar;
        this.renderSubview('sidebar');
        this.trigger('resized');
    },

    teardownSidebar: function() {
        if(this.sidebar instanceof chorus.views.WorkfileSidebar) {
            this.sidebar.teardown(true);
        }
    },

    scopeSearchResults: function(data) {
        this.search.set({ searchIn: data });
        chorus.router.navigate(this.search.showUrl());
    },

    filterSearchResults: function(entityType) {
        this.search.set({ entityType: entityType });
        chorus.router.navigate(this.search.showUrl());
    }
});
