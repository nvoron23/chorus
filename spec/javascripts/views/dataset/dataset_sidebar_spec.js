describe("chorus.views.DatasetSidebar", function() {
    beforeEach(function() {
        this.modalSpy = stubModals();
        this.view = new chorus.views.DatasetSidebar();
        this.view.render();
    });

    function itDoesNotShowDatabaseDependentActions() {
        describe("actions", function() {
            it("does not show preview data even when on a list page", function() {
                this.view.options.listMode = true;
                this.view.render();
                expect(this.view.$('.actions .dataset_preview')).not.toExist();
            });

            it("does not have 'Import Now' even if there's a workspace", function() {
                this.view.resource._workspace = backboneFixtures.workspace();
                this.view.render();
                expect(this.view.$(".actions .import_now")).not.toExist();
            });

            it("does not show analyze table", function() {
                expect(this.view.$(".actions a.analyze")).not.toExist();
            });

            it("does not show create database view", function() {
                expect(this.view.$(".actions a.create_database_view")).not.toExist();
            });

            it("does not show duplicate chorus view", function() {
                expect(this.view.$(".actions a.duplicate")).not.toExist();
            });
        });
    }

    context("when disabled", function() {
        beforeEach(function() {
            this.view.disabled = true;
            spyOn(this.view, 'template');
            this.view.render();
        });

        it("does not render", function() {
            expect(this.view.template).not.toHaveBeenCalled();
        });
    });

    context("when no dataset is selected", function() {
        it("does not render the info section", function() {
            expect(this.view.$(".info")).not.toExist();
        });
    });

    context("when a dataset is selected", function() {
        beforeEach(function() {
            this.server.reset();
            this.dataset = backboneFixtures.workspaceDataset.sourceTable();
            chorus.PageEvents.trigger("dataset:selected", this.dataset);
            chorus.page = this.view;
            $("#jasmine_content").append(this.view.$el);
        });

        describe("statistics", function() {
            context("when the dataset is stale", function () {
                beforeEach(function () {
                    this.dataset.set('stale', true);
                    this.server.reset();
                });

                it("do not fetch", function () {
                    chorus.PageEvents.trigger("dataset:selected", this.dataset);
                    expect(this.dataset.statistics()).not.toHaveBeenFetched();
                });
            });

            context("when the statistics fail with invalid credentials", function() {
                beforeEach(function() {
                    spyOn(this.view, 'postRender');
                    var errors = backboneFixtures.invalidCredentialsErrorJson();
                    this.server.lastFetchFor(this.view.resource.statistics()).failForbidden(errors);
                });

                it("rerenders the sidebar and shows the error message", function() {
                    expect(this.view.postRender).toHaveBeenCalled();

                    expect(this.view.$('.invalid_credentials')).toContainTranslation("dataset.credentials.invalid.body", {
                        dataSourceName: this.dataset.dataSource().name()
                    });
                });
            });
        });

        describe("activities", function() {
            it("fetches the activities for the dataset", function() {
                expect(this.dataset.activities()).toHaveBeenFetched();
            });

            it("prefers only the without_workspace type for the activity list", function() {
                expect(this.view.tabs.activity.options.displayStyle).toEqual(['without_workspace']);
            });

            context("when the activity fetch completes", function() {
                beforeEach(function() {
                    this.server.completeFetchFor(this.dataset.activities());
                });

                it("renders an activity list inside the tabbed area", function() {
                    expect(this.view.tabs.activity).toBeA(chorus.views.ActivityList);
                    expect(this.view.tabs.activity.el).toBe(this.view.$(".tabbed_content_area .activity_list")[0]);
                });
            });
        });

        describe("analyze table", function() {
            it("displays the analyze table action", function() {
                expect(this.view.$(".actions a.analyze")).toContainTranslation("dataset.actions.analyze");
            });

            it("does not display for a view", function() {
                this.dataset = backboneFixtures.workspaceDataset.datasetView();
                chorus.PageEvents.trigger("dataset:selected", this.dataset);
                expect(this.view.$(".actions a.analyze")).not.toExist();
            });

            itBehavesLike.aDialogLauncher(".actions a.analyze", chorus.alerts.Analyze);

            context("when the analyze:running event is trigger", function() {
                it("re-fetches the dataset statistics", function() {
                    this.server.reset();
                    chorus.PageEvents.trigger("analyze:running");
                    expect(this.server.lastFetchFor(this.view.resource.statistics())).toBeDefined();
                });
                context("and the dataset is stale", function () {
                    beforeEach(function () {
                        this.dataset.set('stale', true);
                    });
                    it("does not refetch statistics", function () {
                        this.server.reset();
                        chorus.PageEvents.trigger("analyze:running");
                        expect(this.dataset.statistics()).not.toHaveBeenFetched();
                    });
                });
            });
        });

        context("when the user has valid credentials", function() {
            it("does not display the invalid credentials message", function() {
                expect(this.view.$('.invalid_credentials')).not.toExist();
            });
        });

        context("for a source dataset", function() {
            context("when the user has invalid credentials", function() {
                beforeEach(function() {
                    this.user = chorus.session.user();
                    var errors = backboneFixtures.invalidCredentialsErrorJson();
                    this.server.lastFetchFor(this.view.resource.statistics()).failForbidden(errors);
                });

                it("displays a message explaining that the credentials are invalid", function() {
                    this.view.render();
                    expect(this.view.$('.invalid_credentials')).toContainTranslation("dataset.credentials.invalid.body", {
                        dataSourceName: this.dataset.dataSource().name()
                    });
                });

                itDoesNotShowDatabaseDependentActions();

                function itDisplaysALinkToUpdateCredentials() {
                    it("shows the link to update credentials", function() {
                        this.view.render();

                        expect(this.view.$('.invalid_credentials')).toContainTranslation("dataset.credentials.invalid.updateCredentials", {
                            linkText: t("dataset.credentials.invalid.linkText")
                        });
                    });

                    describe("clicking the link to update credentials", function() {
                        beforeEach(function() {
                            this.view.render();
                            expect(this.view.$('.invalid_credentials a.update_credentials')).toExist();
                            this.view.$('.invalid_credentials a.update_credentials').click();
                        });

                        it("launches the DataSourceAccount dialog", function() {
                            expect(chorus.modal).toBeA(chorus.dialogs.DataSourceAccount);
                        });

                        describe("saving the credentials", function() {
                            beforeEach(function() {
                                spyOn(chorus.router, "reload");
                                chorus.modal.$('input').val('stuff');
                                chorus.modal.$('form').submit();
                                this.server.completeCreateFor(chorus.modal.model);
                            });

                            it("reloads the current page", function() {
                                expect(chorus.router.reload).toHaveBeenCalled();
                            });
                        });
                    });
                }

                context("when the data source account is shared", function() {
                    beforeEach(function() {
                        this.dataset.dataSource().set('shared', true);
                    });

                    context("and the user is an admin", function() {
                        beforeEach(function() {
                            this.user.set('admin', true);
                        });
                        itDisplaysALinkToUpdateCredentials();
                    });

                    context("and the user is the owner of the data source", function() {
                        beforeEach(function() {
                            this.dataset.dataSource().set('ownerId', this.user.get('id'));
                        });

                        itDisplaysALinkToUpdateCredentials();
                    });

                    context("when the user is neither an admin nor the owner of the instance", function() {
                        it("does not show the link to update credentials", function() {
                            this.view.render();
                            expect(this.view.$('.invalid_credentials')).not.toContainTranslation("dataset.credentials.invalid.updateCredentials", {
                                linkText: t("dataset.credentials.invalid.linkText")
                            });
                        });
                    });
                });

                context("when the data source account is not shared", function() {
                    beforeEach(function() {
                        spyOn(this.dataset.dataSource(), 'isShared').andReturn(false);
                    });

                    itDisplaysALinkToUpdateCredentials();
                });
            });

            context("when user does not have credentials", function() {
                beforeEach(function() {
                    this.dataset.set({hasCredentials: false});
                    delete this.dataset.dataSource()._accountForCurrentUser;
                    this.view.render();
                });

                itDoesNotShowDatabaseDependentActions();

                it("shows a no-permissions message", function() {
                    this.view.render();
                    expect(this.view.$('.no_credentials')).toContainTranslation("dataset.credentials.missing.body", {
                        linkText: t("dataset.credentials.missing.linkText"),
                        dataSourceName: this.dataset.dataSource().name()
                    });
                });

                context("clicking the link to add credentials", function() {
                    beforeEach(function() {
                        this.view.render();
                        this.view.$('.no_credentials a.add_credentials').click();
                    });

                    it("launches the DataSourceAccount dialog", function() {
                        expect(chorus.modal).toBeA(chorus.dialogs.DataSourceAccount);
                    });

                    context("saving the credentials", function() {
                        beforeEach(function() {
                            spyOn(chorus.router, "reload");
                            chorus.modal.$('input').val('stuff');
                            chorus.modal.$('form').submit();
                            this.server.completeCreateFor(chorus.modal.model);
                        });

                        it("reloads the current page", function() {
                            expect(chorus.router.reload).toHaveBeenCalled();
                        });
                    });
                });
            });
        });

        it("displays a download link", function() {
            expect(this.view.$("a.download")).toHaveData("dataset", this.dataset);
            expect(this.view.$("a.download").text()).toMatchTranslation("actions.download");
        });

        itBehavesLike.aDialogLauncher("a.download", chorus.dialogs.DatasetDownload);

        context("when in list mode", function() {
            beforeEach(function() {
                this.view.options.listMode = true;
                this.view.render();
            });

            it("displays the 'Preview Data' link", function() {
                expect(this.view.$('.actions .dataset_preview')).toContainTranslation('actions.dataset_preview');
            });

            itBehavesLike.aDialogLauncher("a.dataset_preview", chorus.dialogs.DatasetPreview);

            context("for a hdfs dataset", function() {
                beforeEach(function () {
                    this.dataset = backboneFixtures.workspaceDataset.hdfsDataset();
                    chorus.PageEvents.trigger("dataset:selected", this.dataset);
                });

                describe("creating an external table", function () {
                    it("fetches the dataset's contents before popping up the dialog", function () {
                        this.view.$('a.create_external_table').click();

                        expect(this.modalSpy).not.toHaveModal(chorus.dialogs.CreateExternalTableFromHdfs);
                        this.server.completeFetchFor(this.view.resource);
                        expect(this.modalSpy).toHaveModal(chorus.dialogs.CreateExternalTableFromHdfs);

                        expect(chorus.modal.options.csvOptions.tableName).toBe(this.view.resource.name());
                    });

                    it("provides the dialog with an external table model", function () {
                        this.view.$('a.create_external_table').click();
                        this.server.completeFetchFor(this.view.resource);

                        expect(chorus.modal.model.get('hdfsDatasetId')).toEqual(this.view.resource.get('id'));
                        expect(chorus.modal.model.get('hdfsDataSourceId')).toEqual(this.view.resource.dataSource().get('id'));
                    });

                });

                itBehavesLike.aDialogLauncher("a.edit_hdfs_dataset", chorus.dialogs.EditHdfsDataset);

                itBehavesLike.aDialogLauncher("a.delete_dataset", chorus.alerts.DatasetDelete);

                it("does not display the 'Preview Data' link", function() {
                    expect(this.view.$('.actions .dataset_preview')).not.toExist();
                });

                it("does not display the 'Download' link", function() {
                    expect(this.view.$(".actions a.download")).not.toExist();
                });

                it("does not display the import links", function () {
                    expect(this.view.$(".actions a.import_now")).not.toExist();
                });

                it("does not display the associate links", function () {
                    expect(this.view.$(".actions a.associate")).not.toExist();
                });

                context("when the workspace is archived", function () {
                    beforeEach(function () {
                        spyOn(this.dataset, 'workspaceArchived').andReturn(true);
                        this.view.render();
                    });

                    it("only shows the tags link", function () {
                        expect(this.view.$(".actions a").length).toEqual(1);
                        expect(this.view.$(".actions a.edit_tags")).toExist();
                    });
                });
            });
        });

        context("when not in list mode", function() {
            it("does not display the 'Preview Data' link", function() {
                expect(this.view.$('.actions .dataset_preview')).not.toExist();
            });
        });

        context("when there is an archived workspace", function() {
            beforeEach(function() {
                this.view.resource._workspace = backboneFixtures.workspace({ archivedAt: "2012-05-08T21:40:14Z", permission: ["update", "admin"] });
                this.view.options.listMode = true;
                this.view.render();
                this.dataset = backboneFixtures.workspaceDataset.datasetTable();
                this.dataset._workspace = this.view.resource._workspace;
                chorus.PageEvents.trigger("dataset:selected", this.dataset);
                this.server.completeFetchFor(this.view.imports, []);
            });

            it("has no action links except for 'Preview Data', 'Download', and 'Tags'", function() {
                expect(this.view.$(".actions a").length).toBe(3);
                expect(this.view.$(".actions a.dataset_preview")).toExist();
                expect(this.view.$(".actions a.download")).toExist();
                expect(this.view.$(".actions a.edit_tags")).toExist();
            });
        });

        context("by a workspace data tab", function() {
            beforeEach(function() {
                this.view = new chorus.views.DatasetSidebar({workspace: this.dataset.workspace(), listMode: true});
                this.view.render();
                chorus.page = this.view;
                chorus.PageEvents.trigger("dataset:selected", this.dataset);
                $("#jasmine_content").append(this.view.$el);
            });

            function itDoesNotHaveACreateDatabaseViewLink() {
                it("does not have a create database view link", function() {
                    expect(this.view.$("a.create_database_view")).not.toExist();
                });
            }

            function itShowsTheAppropriateDeleteLink(shouldBePresent, type) {
                if(shouldBePresent) {
                    var textKey;

                    if(type === "chorus view") {
                        textKey = "actions.delete";
                    } else if(type === "view") {
                        textKey = "actions.delete_association";
                    } else {
                        textKey = "actions.delete_association";
                    }

                    context("and the logged-in user has update permission on the workspace", function() {
                        beforeEach(function() {
                            this.view.resource._workspace = backboneFixtures.workspace({ id: 6004, permission: ["update"] });
                            this.view.render();
                        });

                        it("displays a delete link", function() {
                            var el = this.view.$("a.delete_dataset");
                            expect(el).toExist();
                            expect(el).toHaveText(t(textKey));
                        });

                        itBehavesLike.aDialogLauncher("a.delete_dataset", chorus.alerts.DatasetDelete);
                    });

                    context("and the logged-in user does not have update permission on the workspace", function() {
                        beforeEach(function() {
                            this.view.resource._workspace = backboneFixtures.workspace({ id: 6005, permission: ["read"] });
                            this.view.render();
                        });

                        it("does not display a delete link", function() {
                            expect(this.view.$("a.delete_dataset")).not.toExist();
                        });
                    });
                } else {
                    it("does not display a delete link", function() {
                        this.view.render();
                        expect(this.view.$("a.alert[data-alert=DatasetDelete]")).not.toExist();
                    });
                }
            }

            function itDoesNotShowTheDuplicateChorusViewLink() {
                it("does not show the 'duplicate' link", function() {
                    expect(this.view.$("a.duplicate")).not.toExist();
                });
            }

            context("and no dataset is selected", function() {
                beforeEach(function() {
                    chorus.PageEvents.trigger("dataset:selected");
                });

                itShowsTheAppropriateDeleteLink(false);
                itDoesNotHaveACreateDatabaseViewLink();
            });

            it("does not display a new workflow link by default", function () {
                expect(this.view.$("a.new_work_flow")).not.toExist();
            });

            context("and the selected dataset is a sandbox table or view", function() {
                beforeEach(function() {
                    this.dataset = backboneFixtures.workspaceDataset.datasetTable();
                    this.view.resource._workspace = backboneFixtures.workspace({ id: 6007, permission: ["update"] });
                    chorus.PageEvents.trigger("dataset:selected", this.dataset);
                });

                itDoesNotShowTheDuplicateChorusViewLink();
                itShowsTheAppropriateDeleteLink(false);
                itDoesNotHaveACreateDatabaseViewLink();

                context("and the dataset has not received an import", function() {
                    beforeEach(function() {
                        this.server.completeFetchFor(this.view.imports, []);
                    });

                    it("doesn't display a 'import now' link", function() {
                        expect(this.view.$(".import_now")).not.toExist();
                    });
                });

                context("when the dataset has a last import (as a destination dataset)", function() {
                    beforeEach(function() {
                        this.imports = backboneFixtures.workspaceImportSet();
                        this.lastImport = this.imports.last();
                        this.lastImport.set({
                            startedStamp: "2012-02-29T14:23:58Z",
                            completedStamp: "2012-02-29T14:23:59Z",
                            success: true,
                            toTable: this.dataset.name(),
                            destinationDataset: {id: this.dataset.id},
                            sourceDataset: { id: this.dataset.id + 1, objectName: "sourcey"}
                        });
                        this.server.completeFetchFor(this.view.imports, [this.lastImport]);
                    });

                    it("has an 'imported xx ago' description", function() {
                        var sourceTable = this.lastImport.source();
                        expect(this.view.$(".last_import")).toContainTranslation("import.last_imported_into", {timeAgo: Handlebars.helpers.relativeTimestamp(this.lastImport.get('completedStamp')), tableLink: "sourcey"});
                        expect(this.view.$(".last_import a")).toHaveHref(sourceTable.showUrl());
                    });

                    it("doesn't display a 'import now' link", function() {
                        expect(this.view.$(".import_now")).not.toExist();
                    });
                });

                context("and the dataset has received an import from a file", function() {
                    beforeEach(function() {
                        this.csvImport = backboneFixtures.csvImportSet().first();
                        this.csvImport.set({
                            startedStamp: "2012-02-29T13:35:38Z",
                            completedStamp: "2012-02-29T14:35:38Z",
                            success: true,
                            fileName: "some_source_file.csv"
                        });
                        this.server.completeFetchFor(this.dataset.getImports(), [this.csvImport]);
                    });

                    it("has an 'imported xx ago' description", function() {
                        expect(this.view.$(".last_import")).toContainTranslation("import.last_imported_into", {
                            timeAgo: Handlebars.helpers.relativeTimestamp("2012-02-29T14:35:38Z"),
                            tableLink: "some_source_..."
                        });
                    });

                    it("renders the filename as a span with a title", function() {
                        expect(this.view.$(".last_import a")).not.toExist();
                        expect(this.view.$(".last_import .source_file")).toBe("span");
                        expect(this.view.$(".last_import .source_file")).toHaveText("some_source_...");
                        expect(this.view.$(".last_import .source_file")).toHaveAttr("title", "some_source_file.csv");
                    });

                    it("doesn't display a 'import now' link", function() {
                        expect(this.view.$(".import_now")).not.toExist();
                    });
                });
            });

            context("and the selected dataset can be the source of an import", function() {
                function itHasActionLinks(linkClasses) {
                    var possibleLinkClasses = ["import_now"];

                    context("when the user has permission to update in the workspace", function() {
                        beforeEach(function() {
                            this.view.resource._workspace = backboneFixtures.workspace({ id: 6002, permission: ["update"] });
                            this.view.render();
                        });

                        _.each(linkClasses, function(linkClass) {
                            it("has a '" + linkClass + "' link", function() {
                                var link = this.view.$("a." + linkClass);
                                expect(link).toExist();
                                expect(link.text()).toMatchTranslation("actions." + linkClass);
                            });

                            it("attaches the dataset to the '" + linkClass + "' link", function() {
                                var link = this.view.$("a." + linkClass);
                                expect(link.data("dataset")).toBe(this.dataset);
                            });
                        });

                        _.each(_.difference(possibleLinkClasses, linkClasses), function(linkClass) {
                            it("does not have a '" + linkClass + "' link", function() {
                                expect(this.view.$("a." + linkClass)).not.toExist();
                            });
                        });
                    });

                    context("when the user does not have permission to update things in the workspace", function() {
                        beforeEach(function() {
                            this.view.resource._workspace = backboneFixtures.workspace({ id: 6003, permission: ["read"] });
                            this.view.render();
                        });

                        _.each(possibleLinkClasses, function(linkClass) {
                            it("does not have a '" + linkClass + "' link", function() {
                                expect(this.view.$("a." + linkClass)).not.toExist();
                            });
                        });
                    });
                }

                beforeEach(function() {
                    chorus.PageEvents.trigger("dataset:selected", this.dataset);
                });

                itShowsTheAppropriateDeleteLink(true, "table");
                itDoesNotHaveACreateDatabaseViewLink();

                it("fetches the imports for the dataset", function() {
                    expect(this.dataset.getImports()).toHaveBeenFetched();
                });

                context("when the dataset has no import information", function() {
                    beforeEach(function() {
                        this.server.completeFetchFor(this.view.resource.getImports(), []);
                    });

                    context("and the current user has update permissions on the workspace", function() {
                        beforeEach(function() {
                            this.view.resource._workspace = backboneFixtures.workspace({ id: 6008, permission: ["update"] });
                            this.view.render();
                        });

                        context("and the workspace has a sandbox", function() {
                            it("shows the 'import now' link", function() {
                                expect(this.view.$("a.import_now")).toExist();
                            });

                            itBehavesLike.aDialogLauncher("a.import_now", chorus.dialogs.ImportNow);
                        });

                        context("and the workspace does not have a sandbox", function() {
                            beforeEach(function() {
                                delete this.view.resource.workspace()._sandbox;
                                this.view.resource.workspace().set({
                                    "sandboxInfo": null
                                });
                                this.view.render();
                            });

                            it("disables the 'import now' link", function() {
                                expect(this.view.$("a.import_now")).not.toExist();
                                expect(this.view.$("span.import_now")).toHaveClass('disabled');
                            });
                        });
                    });

                    context("and the current user does not have update permissions on the workspace", function() {
                        beforeEach(function() {
                            this.view.resource._workspace = backboneFixtures.workspace({ id: 6009, permission: ["read"] });
                            this.view.render();
                        });

                        it("does not have an 'import now' link", function() {
                            expect(this.view.$("a.import_now.dialog")).not.toExist();
                        });
                    });
                });

                context("when the dataset has a last import", function() {
                    beforeEach(function() {
                        this.imports = backboneFixtures.workspaceImportSet();
                        this.lastImport = this.imports.last();
                        this.lastImport.set({
                            startedStamp: "2012-02-29T14:23:58Z",
                            completedStamp: "2012-02-29T14:23:59Z",
                            success: true,
                            toTable: 'our_destination',
                            destinationDataset: {id: 12345, objectName: 'our_destination'},
                            sourceDataset: {id: this.dataset.id}
                        });
                        this.server.completeFetchFor(this.view.imports, [this.lastImport]);
                    });

                    itHasActionLinks(["import_now"]);

                    it("has an 'imported xx ago' description", function() {
                        var lastImport = this.view.imports.last();
                        var destTable = lastImport.destination();
                        expect(this.view.$(".last_import")).toContainTranslation("import.last_imported", {timeAgo: Handlebars.helpers.relativeTimestamp(lastImport.get('completedStamp')), tableLink: "our_destinat..."});
                        expect(this.view.$(".last_import a")).toHaveHref(destTable.showUrl());
                    });
                });

            });

            context("when the dataset is a source view", function() {
                beforeEach(function() {
                    this.dataset = backboneFixtures.workspaceDataset.sourceView();
                    chorus.PageEvents.trigger("dataset:selected", this.dataset);
                });

                itDoesNotShowTheDuplicateChorusViewLink();
                itShowsTheAppropriateDeleteLink(true, "view");
                itDoesNotHaveACreateDatabaseViewLink();
            });

            itBehavesLike.aDialogLauncher("a.new_note", chorus.dialogs.NotesNew);

            context("when the dataset is a chorus view", function() {
                beforeEach(function() {
                    this.dataset = backboneFixtures.workspaceDataset.chorusView({ objectName: "annes_table", query: "select * from foos;" });
                    chorus.PageEvents.trigger("dataset:selected", this.dataset);
                });

                context("current user has credentials on the dataset", function() {
                    beforeEach(function() {
                        this.dataset.set("hasCredentials", true);
                        this.view.render();
                    });

                    it("shows the 'Create as a database view' link", function() {
                        expect(this.view.$("a.create_database_view")).toContainTranslation("actions.create_database_view");
                    });

                    it("does not have an associate with another workspace link", function() {
                        expect(this.view.$('.actions .associate')).not.toExist();
                    });

                    itShowsTheAppropriateDeleteLink(true, "chorus view");

                    it("shows the 'duplicate' link'", function() {
                        expect(this.view.$("a.duplicate").text()).toMatchTranslation("dataset.chorusview.duplicate");
                    });

                    describe("clicking the 'duplicate' link", function() {
                        beforeEach(function() {
                            this.modalSpy.reset();
                            this.view.$("a.duplicate").click();
                        });

                        itBehavesLike.aDialogLauncher("a.duplicate", chorus.dialogs.VerifyChorusView);

                        it("passes the dialog a duplicate of the chorus view", function() {
                            expect(this.modalSpy.lastModal().model.attributes).toEqual(this.dataset.createDuplicateChorusView().attributes);
                        });
                    });

                    itBehavesLike.aDialogLauncher("a.create_database_view", chorus.dialogs.CreateDatabaseView);
                });

                context("current user does not have credentials on the dataset", function() {
                    beforeEach(function() {
                        this.dataset.set("hasCredentials", false);
                        this.view.render();
                    });

                    itDoesNotShowDatabaseDependentActions();
                });

                context("when the user has invalid credentials", function() {
                    beforeEach(function() {
                        var errors = backboneFixtures.invalidCredentialsErrorJson();
                        this.server.lastFetchFor(this.view.resource.statistics()).failForbidden(errors);
                    });

                    itDoesNotShowDatabaseDependentActions();
                });

                it("does not have a new workflow link", function () {
                    expect(this.view.$("a.new_work_flow")).not.toExist();
                });
            });

            context("when the dataset is a source table", function() {
                _.each(["TABLE", "EXTERNAL_TABLE", "MASTER_TABLE", "HDFS_EXTERNAL_TABLE"], function(type) {
                    beforeEach(function() {
                        this.dataset = backboneFixtures.workspaceDataset.sourceTable({ objectType: type});
                        chorus.PageEvents.trigger("dataset:selected", this.dataset);
                    });

                    itShowsTheAppropriateDeleteLink(true, type);
                    itDoesNotHaveACreateDatabaseViewLink();
                    itDoesNotShowTheDuplicateChorusViewLink();

                    context("when the selected dataset is stale", function () {
                        beforeEach(function () {
                            spyOn(chorus.models.Config.instance().license(), "workflowEnabled").andReturn(true);
                            spyOn(this.dataset.workspace(), 'currentUserCanCreateWorkFlows').andReturn(true);
                            this.dataset.set('stale', true);
                            chorus.PageEvents.trigger("dataset:selected", this.dataset);
                        });

                        it("disables inappropriate action links", function () {
                            var badActions = ['dataset_preview', 'download', 'import_now', 'new_work_flow'];
                            var goodActions = ['delete_dataset', 'new_note', 'edit_tags', 'associate'];

                            if ( this.view.resource.canAnalyze() ) { badActions.push(['analyze']); }

                            _.each(badActions, function (actionName) {
                                expect(this.view.$('.actions a.' + actionName)).not.toExist();
                                expect(this.view.$('.actions span.' + actionName)).toExist();
                            }, this);

                            _.each(goodActions, function (actionName) {
                                expect(this.view.$('.actions span.' + actionName)).not.toExist();
                                expect(this.view.$('.actions a.' + actionName)).toExist();
                            }, this);
                        });
                    });

                    context("when the user does not have create workflow permissions", function() {
                        beforeEach(function() {
                            spyOn(chorus.models.Config.instance().license(), "workflowEnabled").andReturn(true);
                            spyOn(this.dataset.workspace(), 'currentUserCanCreateWorkFlows').andReturn(false);
                            chorus.PageEvents.trigger("dataset:selected", this.dataset);
                        });

                        it("does not show the workflow actions", function() {
                            expect(this.view.$('.actions a.new_work_flow')).not.toExist();
                            expect(this.view.$('.actions span.new_work_flow')).not.toExist();
                        });
                    });
                });
            });

            it("has an 'associate with another workspace' link", function() {
                expect(this.view.$('.actions .associate')).toContainTranslation("actions.associate");
            });

            itBehavesLike.aDialogLauncher(".actions a.associate", chorus.dialogs.AssociateWithWorkspace);

            context("when work_flows are enabled", function () {
                beforeEach(function () {
                    spyOn(chorus.models.Config.instance().license(), "workflowEnabled").andReturn(true);
                    this.view = new chorus.views.DatasetSidebar();
                    this.dataset = backboneFixtures.workspaceDataset.sourceTable();
                    chorus.PageEvents.trigger("dataset:selected", this.dataset);
                    this.workspace = this.view.resource.workspace();
                });

                context("when the current user is a member of the workspace", function () {
                    beforeEach(function () {
                        this.workspace.set({permission: ["create_workflow"]});
                        this.view.render();
                    });

                    it("displays a new workflow link", function () {
                        expect(this.view.$("a.new_work_flow")).toExist();
                    });

                    context("when the user's credentials -- for the dataset -- are invalid", function() {
                        beforeEach(function() {
                            this.user = chorus.session.user();
                            var errors = backboneFixtures.invalidCredentialsErrorJson();
                            this.server.lastFetchFor(this.view.resource.statistics()).failForbidden(errors);
                        });

                        it("does not display a new workflow link", function () {
                            expect(this.view.$("a.new_work_flow")).not.toExist();
                        });
                    });

                    itBehavesLike.aDialogLauncher("a.new_work_flow", chorus.dialogs.WorkFlowNewForDatasetList);
                });

                context("when the current user is not a member of the workspace", function () {
                    beforeEach(function () {
                        this.workspace.set({permission: []});
                        this.view.render();
                    });

                    it("does not display a new workflow link", function () {
                        expect(this.view.$("a.new_work_flow")).not.toExist();
                    });
                });
            });
        });

        context("when there is not a workspace", function() {
            beforeEach(function() {
                this.dataset = backboneFixtures.dataset({id: "XYZ"});
                chorus.PageEvents.trigger("dataset:selected", this.dataset);
                chorus.page = this.view;
                $("#jasmine_content").append(this.view.$el);
            });

            it("does not have the 'Import Now' action", function() {
                expect(this.view.$(".actions .import_now")).not.toExist();
            });

            context("when workflows are enabled", function () {
                beforeEach(function () {
                    spyOn(chorus.models.Config.instance().license(), "workflowEnabled").andReturn(true);
                    this.view = new chorus.views.DatasetSidebar();
                    this.view.render();
                    this.dataset = backboneFixtures.dataset({id: "XYZ"});
                    chorus.PageEvents.trigger("dataset:selected", this.dataset);
                });

                it("does not have a new workflow link", function () {
                    expect(this.view.$("a.new_work_flow")).not.toExist();
                });
            });

            it("does not display a delete link", function() {
                spyOn(this.view.resource, 'isDeleteable').andReturn(true);
                this.view.render();
                expect(this.view.$("a.alert[data-alert=DatasetDelete]")).not.toExist();
            });

            it("has a link to associate the dataset with a workspace", function() {
                expect(this.view.$('.actions .associate')).toContainTranslation('actions.associate');
            });

            itBehavesLike.aDialogLauncher("a.new_note", chorus.dialogs.NotesNew);
        });

        itBehavesLike.aDialogLauncher("a.edit_tags", chorus.dialogs.EditTags);
    });

    describe("column statistics", function() {
        beforeEach(function() {
            this.dataset = backboneFixtures.workspaceDataset.datasetTable();
            this.column = backboneFixtures.databaseColumnSet([{},{
                dataType: "int8",
                typeCategory: "WHOLE_NUMBER",
                statistics: {
                    commonValues: [46, 38],
                    distinctValue: 998710,
                    max: "1199961.0",
                    min: "200075.0",
                    nullFraction: 0.103678
                }
            }]).at(1);

            chorus.PageEvents.trigger("dataset:selected", this.dataset);
            this.view.resource.statistics().set({lastAnalyzedTime: "2012-01-24T12:25:11Z"});
            chorus.PageEvents.trigger("column:selected", this.column);
            this.view.render();
        });

        describe("statistics labels", function() {
            it("should display the column name", function() {
                expect(this.view.$(".column_title .title").text()).toContainTranslation("dataset.column_name");
                expect(this.view.$(".column_title .column_name").text()).toBe(this.column.get("name"));
            });

            it("should display the column labels in the correct order", function() {
                expect(this.view.$(".column_statistics .pair").eq(0).find(".key")).toContainTranslation("dataset.column_statistics.type_category");
                expect(this.view.$(".column_statistics .pair").eq(1).find(".key")).toContainTranslation("dataset.column_statistics.type");
                expect(this.view.$(".column_statistics .pair").eq(2).find(".key")).toContainTranslation("dataset.column_statistics.min");
                expect(this.view.$(".column_statistics .pair").eq(3).find(".key")).toContainTranslation("dataset.column_statistics.max");
                expect(this.view.$(".column_statistics .pair").eq(4).find(".key")).toContainTranslation("dataset.column_statistics.distinct");
                expect(this.view.$(".column_statistics .pair").eq(5).find(".key")).toContainTranslation("dataset.column_statistics.common");
                expect(this.view.$(".column_statistics .pair").eq(6).find(".key")).toContainTranslation("dataset.column_statistics.pctnull");
                expect(this.view.$(".column.description").find("h4")).toContainTranslation("dataset.column_statistics.description");
            });

            it("should display a comment for the column", function() {
                expect(this.view.$(".column.description p")).toContainText(this.column.get("description"));
            });
        });

        describe("statistics values", function() {
            context("when the dataset has never been analyzed", function() {
                beforeEach(function() {
                    this.view.resource.statistics().set({
                        lastAnalyzedTime: null
                    });
                    this.column.set({
                        typeCategory: "WHOLE_NUMBER",
                        dataType: "int8",
                        statistics: {
                            max: "1199961.0",
                            median: "725197.0",
                            min: "200075.0"
                        }
                    });
                    this.view.render();
                });

                it("should only display the typeCategory and type", function() {
                    expect(this.view.$(".column_statistics .pair").length).toBe(2);
                    expect(this.view.$(".column_statistics .type_category .value")).toExist();
                    expect(this.view.$(".column_statistics .type .value")).toExist();
                });
            });

            context("when statistics are available", function() {
                it("should display the statistics", function() {
                    expect(this.view.$(".column_statistics .type_category .value").text()).toBe(this.column.get("typeClass"));
                    expect(this.view.$(".column_statistics .type .value").text()).toBe("int8");
                    expect(this.view.$(".column_statistics .min .value").text()).toBe("200075");
                    expect(this.view.$(".column_statistics .max .value").text()).toBe("1199961");
                    expect(this.view.$(".column_statistics .distinct .value").text()).toBe("998710");
                    expect(this.view.$(".column_statistics .pctnull .value").text()).toBe("10.37%");

                    expect(this.view.$(".column_statistics .common .value").eq(0).text()).toBe("46");
                    expect(this.view.$(".column_statistics .common .value").eq(1).text()).toBe("38");
                });
            });

            context("when the min is not available", function() {
                it("should not display the min", function() {
                    this.column.set({statistics: {min: null}});
                    this.view.render();
                    expect(this.view.$(".column_statistics .min")).not.toExist();
                });
            });

            context("when the median is not available", function() {
                it("should not display the median", function() {
                    this.column.set({statistics: {median: null}});
                    this.view.render();
                    expect(this.view.$(".column_statistics .median")).not.toExist();
                });
            });

            context("when the avg is not available", function() {
                it("should not display the avg", function() {
                    this.column.set({statistics: {avg: null}});
                    this.view.render();
                    expect(this.view.$(".column_statistics .avg")).not.toExist();
                });
            });

            context("when the max is not available", function() {
                it("should not display the max", function() {
                    this.column.set({statistics: {max: null}});
                    this.view.render();
                    expect(this.view.$(".column_statistics .max")).not.toExist();
                });
            });

            context("when the stdDeviation is not available", function() {
                it("should not display the stdDeviation", function() {
                    this.column.set({statistics: {stdDeviation: null}});
                    this.view.render();
                    expect(this.view.$(".column_statistics .stdDeviation")).not.toExist();
                });
            });

            context("when the distinctValue is not available", function() {
                it("should not display the distinctValue", function() {
                    this.column.set({statistics: {distinctValue: null}});
                    this.view.render();
                    expect(this.view.$(".column_statistics .distinctValue")).not.toExist();
                });
            });

            context("when the commonValues is not available", function() {
                it("should not display the commonValues", function() {
                    this.column.set({statistics: {commonValues: []}});
                    this.view.render();
                    expect(this.view.$(".column_statistics .commonValues")).not.toExist();
                });
            });

            context("when the nullFraction is not available", function() {
                it("should not display the nullFraction", function() {
                    this.column.set({statistics: {nullFraction: null}});
                    this.view.render();
                    expect(this.view.$(".column_statistics .nullFraction")).not.toExist();
                });
            });
        });
    });

    describe("translations for all objectTypes", function() {
        _.each(["CHORUS_VIEW", "VIEW", "TABLE", "TABLE", "HDFS_EXTERNAL_TABLE", "EXTERNAL_TABLE"], function(type) {
            it("does not have any missing translations for" + type, function() {
                this.dataset = backboneFixtures.workspaceDataset.datasetTable({objectType: type});
                chorus.PageEvents.trigger("dataset:selected", this.dataset);
                expect(this.view.tabs.activity.options.type).not.toContain("missing");
            });
        }, this);
    });

    describe("event handing", function() {
        describe("start:visualization", function() {
            beforeEach(function() {
                expect($(this.view.el)).not.toHaveClass("visualizing");
                chorus.PageEvents.trigger("start:visualization");
            });

            it("adds the 'visualizing' class to sidebar_content", function() {
                expect($(this.view.el)).toHaveClass("visualizing");
            });
        });
        describe("cancel:visualization", function() {
            beforeEach(function() {
                chorus.PageEvents.trigger("start:visualization");
                expect($(this.view.el)).toHaveClass("visualizing");
                chorus.PageEvents.trigger("cancel:visualization");
            });

            it("removes the 'visualizing' class from sidebar_content", function() {
                expect($(this.view.el)).not.toHaveClass("visualizing");
            });
        });
    });
});
