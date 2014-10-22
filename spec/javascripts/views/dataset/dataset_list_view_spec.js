describe("chorus.views.DatasetList", function() {
    beforeEach(function() {
        this.collection = new chorus.collections.SchemaDatasetSet([
            backboneFixtures.workspaceDataset.chorusView({ hasCredentials: true, objectName: "foo" }),
            backboneFixtures.workspaceDataset.datasetTable({ hasCredentials: true, objectName: "bar" }),
            backboneFixtures.workspaceDataset.datasetTable({ objectName: "baz" })
        ], { dataSourceId: "1", databaseName: "two", schemaName: "three" });
        this.collection.loaded = true;

        this.view = new chorus.views.DatasetList({
            collection: this.collection,
            hasActiveWorkspace: true
        });
        this.view.render();
    });

    itBehavesLike.PageItemList();

    describe("when there are no datasets", function() {
        beforeEach(function() {
            this.view.collection = new chorus.collections.SchemaDatasetSet([], { dataSourceId: "1", databaseName: "two", schemaName: "three" });
            this.view.render();
        });

        it("should not display the browse more message", function() {
            expect(this.view.$(".browse_more")).not.toExist();
        });

        context("after the collection is loaded and there's a workspace'", function() {
            beforeEach(function() {
                this.view.collection.attributes.workspaceId = "1";
                this.view.collection.loaded = true;
                this.view.render();
            });

            it("renders the no datasets in this workspace message", function() {
                expect(this.view.$el).toContainTranslation("dataset.browse_more_workspace", {linkText: t("dataset.browse.linkText") });
                expect(this.view.$(".browse_more a")).toHaveHref("#/data_sources");
            });
        });

        context("when it is a DatasetSet and a name filter is applied", function() {
            beforeEach(function() {
                this.view.collection = new chorus.collections.WorkspaceDatasetSet();
                this.view.collection.loaded = true;
                this.view.collection.attributes.namePattern = "Liger";
                this.view.render();
            });

            it("renders the no datasets message if there are no datasets", function() {
                expect(this.view.$el).toContainTranslation("dataset.filtered_empty");
            });
        });

        context("when there is no workspace", function() {
            beforeEach(function() {
                this.view.collection = new chorus.collections.SchemaDatasetSet([], { dataSourceId: "1", databaseName: "two", schemaName: "three" });
                this.view.collection.loaded = true;
                this.view.render();
            });

            it('renders the no datasets in the this data source message', function() {
                expect($(this.view.el)).toContainTranslation("dataset.browse_more_data_source");
            });
        });
    });

    it("passes the 'hasActiveWorkspace' option to the dataset views, so that they render the links", function() {
        expect(this.view.$("li a.image").length).toBe(this.collection.length);
        expect(this.view.$("li a.name").length).toBe(this.collection.length);

        this.view = new chorus.views.DatasetList({ collection: this.collection, hasActiveWorkspace: false });
        this.view.render();

        expect(this.view.$("li a.image").length).toBe(0);
        expect(this.view.$("li a.name").length).toBe(0);
    });
});
