chorus.pages.DatasetShowPage = chorus.pages.Base.include(
    chorus.Mixins.DataSourceCredentials.page).extend({
        constructorName: "DatasetShowPage",
        helpId: "dataset",
        isDataSourceBrowser: true,
        additionalClass: 'dataset_show',
        sidebarOptions: {},
        contentDetailsOptions: {},

        failurePageOptions: function() {
            return {
                title: t("invalid_route.dataset.title"),
                text: t("invalid_route.dataset.content")
            };
        },

        title: function() {
            return this.dataset.get('objectName');
        },

        setup: function() {
            this.dataset.fetch();
            this.mainContent = new chorus.views.LoadingSection();
            this.handleFetchErrorsFor(this.dataset);

            this.listenTo(this.dataset, "loaded", this.datasetLoaded);

            this.workspaceId || this.breadcrumbs.requiredResources.add(this.dataset);
        },

        datasetLoaded: function() {
            this.columnSet = this.dataset.columns();
            this.fetchColumnSet();
        },

        setupMainContent: function() {
            this.customHeaderView = this.getHeaderView({
                model: this.dataset
            });

            if (this.mainContent) {
                this.mainContent.teardown(true);
            }
            this.mainContent = new chorus.views.MainContentList({
                modelClass: "DatabaseColumn",
                useCustomList: true,
                collection: this.columnSet,
                persistent: true,
                contentHeader: this.customHeaderView,
                contentDetails: new chorus.views.DatasetContentDetails(_.extend(
                    { dataset: this.dataset, collection: this.columnSet, isDataSourceBrowser: this.isDataSourceBrowser},
                    this.contentDetailsOptions))
            });
            this.setupSidebar();
        },

        crumbs: function() {
            if (!this.dataset.schema()) return [];
            return _.compact([
                {label: t("breadcrumbs.home"), url: "#/"},
                {label: t("breadcrumbs.data_sources"), url: '#/data_sources'},
                {label: this.dataset.dataSource().name(), url: this.dataset.dataSource().showUrl() },
                this.dataset.database() && {label: this.dataset.database().name(), url: this.dataset.database().showUrl() },
                {label: this.dataset.schema().name(), url: this.dataset.schema().showUrl()},
                {label: this.dataset.name()}
            ]);
        },

        makeModel: function(datasetId) {
            this.model = this.dataset = new chorus.models.DynamicDataset({
                id: datasetId
            });
        },

        fetchColumnSet: function() {
            if(!this.columnSet.loaded) {
                this.listenTo(this.columnSet, "loaded", this.drawColumns);
                this.columnSet.fetchAll();
            }
        },

        unprocessableEntity: function() {
            this.columnSet = this.dataset.columns();
            this.setupMainContent();
            this.render();
        },

        setupSidebar: function() {
            this.sidebar && this.sidebar.teardown();
            this.sidebar = new chorus.views.DatasetSidebar(this.sidebarOptions);
            this.sidebar.setDataset(this.dataset);

            this.listenTo(this.mainContent.contentDetails, "transform:sidebar", this.showSidebar);
        },

        drawColumns: function() {
            var serverErrors = this.columnSet.serverErrors;
            this.columnSet = new chorus.collections.DatabaseColumnSet(this.columnSet.models);
            this.columnSet.serverErrors = serverErrors;
            this.columnSet.loaded = true;

            this.setupMainContent();
            this.mainContent.contentDetails.options.$columnList = $(this.mainContent.content.el);

            this.render();
        },

        getHeaderView: function(options) {
            return new chorus.views.DatasetShowContentHeader(options);
        }
    }
);
