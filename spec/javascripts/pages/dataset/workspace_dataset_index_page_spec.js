describe("chorus.pages.WorkspaceDatasetIndexPage", function() {
    beforeEach(function() {
        spyOn(_, "debounce").andCallThrough();
        this.modalSpy = stubModals();
        this.workspace = backboneFixtures.workspace({
            id: 9999,
            permission: [
                "update"
            ]
        });
        chorus.page = this.page = new chorus.pages.WorkspaceDatasetIndexPage(this.workspace.get("id"));
        chorus.bindModalLaunchingClicks(this.page);
    });

    it("has a helpId", function() {
        expect(this.page.helpId).toBe("datasets");
    });

    describe("#setup", function() {
        it("fetches the workspace", function() {
            expect(this.workspace).toHaveBeenFetched();
        });

        it("fetches the workspace members", function () {
            expect(this.workspace.members()).toHaveBeenFetched();
        });

        it("sets the workspace id, for prioritizing search", function() {
            expect(this.page.header.workspaceId).toBe(9999);
        });

        it("fetches the collection", function() {
            expect(this.server.lastFetchFor(this.page.collection)).toBeDefined();
        });

        it("#render shows a loading message", function() {
            this.page.render();
            expect(this.page.$(".loading_section")).toExist();
        });
    });

    describe("when a fetch fails", function() {
        beforeEach(function() {
            spyOn(Backbone.history, "loadUrl");
        });

        it("navigates to the 404 page when the workspace fetch fails", function() {
            this.page.workspace.trigger('resourceNotFound', this.page.workspace);
            expect(Backbone.history.loadUrl).toHaveBeenCalledWith("/invalidRoute");
        });

        it("navigates to the 404 page when the collection fetch fails", function() {
            this.page.collection.trigger('resourceNotFound', this.page.collection);
            expect(Backbone.history.loadUrl).toHaveBeenCalledWith("/invalidRoute");
        });

        context("when a single dataset fetch fails", function() {
            beforeEach(function() {
                var dataset = backboneFixtures.dataset();
                this.page.collection.reset([dataset]);
            });
            it("does NOT navigate away", function() {
                this.page.collection.at(0).trigger('unprocessableEntity', null);
                expect(Backbone.history.loadUrl).not.toHaveBeenCalled();
            });
        });
    });

    context("when it does not have a sandbox", function() {
        function itHandlesTheWorkspaceResponse(helpText) {
            it("fetches the dataset collection", function() {
                expect(this.workspace.sandbox()).toBeUndefined();
                expect(this.server.lastFetchFor(this.page.collection)).toBeDefined();
            });

            describe("when the fetch returns no items", function() {
                beforeEach(function() {
                    this.datasets = [];
                    this.server.lastFetchFor(this.page.collection).succeed(this.datasets);
                });

                it("has no items", function() {
                    expect(this.page.collection.length).toBe(0);
                });

                it("has a 'no results' message", function() {
                    expect(this.page.$(".browse_more")).toContainTranslation("dataset.browse_more_workspace", {linkText: t("dataset.browse.linkText") });
                });
            });

            describe("when the fetch returns two items", function() {
                beforeEach(function() {
                    this.datasets = [
                        backboneFixtures.workspaceDataset.datasetTable(),
                        backboneFixtures.workspaceDataset.datasetTable()
                    ];
                    this.server.lastFetchFor(this.page.collection).succeed(this.datasets);
                });

                it("has two items", function() {
                    expect(this.page.collection.length).toBe(2);
                });
            });
        }

        beforeEach(function() {
            this.workspace.attributes.sandboxInfo = null;
        });

        context("and the user is an admin", function() {
            beforeEach(function() {
                this.workspace.set({permission: ['admin']});
                setLoggedInUser({ id: 11, admin: true});
                this.server.completeFetchFor(this.workspace);
            });

            itHandlesTheWorkspaceResponse(t("dataset.import.need_sandbox", {
                hereLink: '<a class="dialog" href="#" data-dialog="SandboxNew" data-workspace-id="9999">' + t("actions.click_here") + '</a>'
            }));
        });

        context("and the user is the workspace owner", function() {
            beforeEach(function() {
                setLoggedInUser({ id: this.workspace.get("owner").id, admin: false});
                this.server.completeFetchFor(this.workspace);
            });

            itHandlesTheWorkspaceResponse(t("dataset.import.need_sandbox", {
                hereLink: '<a class="dialog" href="#" data-dialog="SandboxNew" data-workspace-id="9999">' + t("actions.click_here") + '</a>'
            }));
        });

        context("and the user is neither an admin nor the workspace owner", function() {
            beforeEach(function() {
                setLoggedInUser({ id: "888", admin: false});
                this.server.completeFetchFor(this.workspace);
                this.workspace.loaded = true;
            });

            itBehavesLike.aPageWithPrimaryActions([
                {name: 'create_hdfs_dataset', target: chorus.dialogs.CreateHdfsDataset},
                {name: 'browse_data_sources', target: "/data_sources"}
            ]);

            itHandlesTheWorkspaceResponse(t("dataset.import.need_sandbox_no_permissions"));
        });
    });

    context("after the workspace and collection have loaded", function() {
        beforeEach(function() {
            this.sandboxTable = backboneFixtures.workspaceDataset.datasetTable();
            this.gpdbTable = backboneFixtures.workspaceDataset.sourceTable();
            this.datasets = [
                this.sandboxTable,
                this.gpdbTable
            ];
            this.server.lastFetchFor(this.page.collection).succeed(this.datasets);
            this.account = this.workspace.sandbox().dataSource().accountForCurrentUser();
        });

        context("and the user has update permission on the workspace", function() {
            beforeEach(function() {
                this.server.completeFetchFor(this.workspace);
            });

            it("creates the sidebar", function() {
                expect(this.page.sidebar).toBeDefined();
                expect(this.page.sidebar.options.workspace.id).toEqual(this.workspace.id);
            });

            it("creates the multi select sidebar", function() {
                expect(this.page.multiSelectSidebarMenu).toBeDefined();
                expect(this.page.multiSelectSidebarMenu).toBeA(chorus.views.MultipleSelectionSidebarMenu);
                expect(this.page.multiSelectSidebarMenu.options.selectEvent).toEqual("dataset:checked");
            });

            it("creates the main content", function() {
                expect(this.page.mainContent).toBeDefined();
                expect(this.page.mainContent.model).toBeA(chorus.models.Workspace);
                expect(this.page.mainContent.model.get("id")).toBe(this.workspace.get("id"));
                expect(this.page.mainContent.options.contentDetailsOptions.multiSelect).toEqual(true);
                expect(this.page.$("#main_content")).toExist();
                expect(this.page.$("#main_content")).not.toBeEmpty();
            });

            it("creates the header", function() {
                expect(this.page.$("#header")).toExist();
            });

            it("shows the page title", function() {
                expect(this.page.$('.content_header h1').text().trim()).toEqual(t('dataset.title'));
            });

            it("has a search bar in the content header", function() {
                expect(this.page.$("input.search").attr("placeholder")).toMatchTranslation("workspace.search");
            });

            it("fetches the collection when csv_import:started is triggered", function() {
                spyOn(this.page.collection, 'fetch').andCallThrough();
                chorus.PageEvents.trigger("csv_import:started");
                expect(this.page.collection.fetch).toHaveBeenCalled();
            });

            describe("multiple selection", function() {
                context("when a row has been checked", function() {
                    beforeEach(function() {
                        chorus.PageEvents.trigger("dataset:checked", this.page.collection.clone());
                    });

                    it("displays the multiple selection section", function() {
                        expect(this.page.$(".multiple_selection .actions")).not.toHaveClass("hidden");
                    });

                    it("has an action to edit tags", function() {
                        expect(this.page.$(".multiple_selection a.edit_tags")).toContainTranslation("actions.edit_tags");
                    });

                    context("when work flow is configured", function () {
                        beforeEach(function () {
                            spyOn(chorus.models.Config.instance().license(), "workflowEnabled").andReturn(true);
                            spyOn(chorus.models.Workspace.prototype, 'currentUserCanCreateWorkFlows').andReturn(true);
                            this.page = new chorus.pages.WorkspaceDatasetIndexPage(this.workspace.get("id"));
                            this.page.render();
                            chorus.PageEvents.trigger("dataset:checked", this.page.collection.clone());
                        });

                        it("has an action to create a new workFlow", function () {
                            expect(this.page.$(".multiple_selection a.new_work_flow")).toContainTranslation("actions.new_work_flow");
                        });

                        itBehavesLike.aDialogLauncher(".multiple_selection a.new_work_flow", chorus.dialogs.WorkFlowNewForDatasetList);

                        context("when the current user can not create work flows", function () {
                            beforeEach(function () {
                                chorus.models.Workspace.prototype.currentUserCanCreateWorkFlows.andReturn(false);
                                this.page = new chorus.pages.WorkspaceDatasetIndexPage(this.workspace.get("id"));
                                this.page.render();
                            });

                            it("does not have an action to create a new workFlow", function () {
                                expect(this.page.$(".multiple_selection a.new_work_flow")).not.toExist();
                            });
                        });
                    });

                    it("does not have an action to create a new workFlow", function () {
                        expect(this.page.$(".multiple_selection a.new_work_flow")).not.toExist();
                    });

                    itBehavesLike.aDialogLauncher(".multiple_selection a.edit_tags", chorus.dialogs.EditTags);
                });

                context("when only source table are selected", function() {
                    beforeEach(function() {
                        var selections = this.page.collection.clone();
                        selections.reset([this.gpdbTable]);
                        chorus.PageEvents.trigger("dataset:checked", selections);
                    });

                    it("displays the disassociate workspace link", function () {
                        expect(this.page.$(".multiple_selection a.disassociate_dataset")).toContainTranslation("actions.disassociate_dataset");
                    });

                    context("when the disassociate link is clicked", function () {
                        itBehavesLike.aDialogLauncher(".multiple_selection a.disassociate_dataset", chorus.alerts.DatasetDisassociateMultiple);
                    });
                });

                context("a when source tables and sandbox tables are selected", function() {
                    beforeEach(function() {
                        this.selections = this.page.collection.clone();
                        chorus.PageEvents.trigger("dataset:checked", this.selections);
                        this.selections.reset([this.gpdbTable, this.sandboxTable]);
                    });

                    it("hides the disassociate workspace link", function () {
                        chorus.PageEvents.trigger("dataset:checked", this.selections);
                        expect(this.page.$(".multiple_selection a.disassociate_dataset")).not.toExist();
                    });

                });
            });
        });

        context("when it has a sandbox", function() {
            beforeEach(function() {
                this.server.completeFetchFor(this.workspace);
            });

            context("and the workspace is active & can update", function () {
                beforeEach(function () {
                    this.workspace.loaded = true;
                    spyOn(this.workspace, 'canUpdate').andReturn(true);
                    spyOn(this.workspace, 'isActive').andReturn(true);

                });

                itBehavesLike.aPageWithPrimaryActions([
                    {name: 'create_hdfs_dataset', target: chorus.dialogs.CreateHdfsDataset},
                    {name: 'browse_data_sources', target: "/data_sources"},
                    {name: 'import_file',         target: chorus.dialogs.WorkspaceFileImport}
                ]);
            });

            it("fetches the account for the current user", function() {
                expect(this.server.lastFetchFor(this.account)).not.toBeUndefined();
            });

            it("displays the sandbox location in the header", function () {
                expect(this.page.mainContent.contentHeader.$(".found_in a").eq(0).text()).toBe(this.workspace.sandbox().dataSource().name());
                expect(this.page.mainContent.contentHeader.$(".found_in a").eq(1).text()).toBe(this.workspace.sandbox().database().name());
                expect(this.page.mainContent.contentHeader.$(".found_in a").eq(2).text()).toBe(this.workspace.sandbox().schema().name());
            });

            context("when the account loads and is empty and the data source account maps are individual", function() {
                beforeEach(function() {
                    spyOnEvent(this.page.collection, 'reset');
                    this.server.completeFetchFor(this.account, backboneFixtures.dataSourceAccount({"id":null}));
                    expect(this.page.dataSource.isShared()).toBeFalsy();
                });

                it("pops up a WorkspaceDataSourceAccount dialog", function() {
                    expect(this.modalSpy).toHaveModal(chorus.dialogs.WorkspaceDataSourceAccount);
                    expect(this.page.dialog.model).toBe(this.page.account);
                    expect(this.page.dialog.pageModel).toBe(this.page.workspace);
                });

                context("after the account has been created", function() {
                    beforeEach(function() {
                        spyOn(this.page.collection, 'fetch').andCallThrough();
                        this.page.account.trigger('saved');
                    });

                    it("fetches the datasets", function() {
                        expect(this.page.collection.fetch).toHaveBeenCalled();
                    });
                });

                context('navigating to the page a second time', function() {
                    beforeEach(function() {
                        this.modalSpy.reset();
                        this.server.reset();
                        this.page = new chorus.pages.WorkspaceDatasetIndexPage(this.workspace.get("id"));
                        this.server.completeFetchFor(this.workspace);
                        this.server.completeFetchFor(this.page.account, backboneFixtures.dataSourceAccount({"id":null}));
                    });

                    it("should not pop up the WorkspaceDataSourceAccountDialog", function() {
                        expect(this.modalSpy).not.toHaveModal(chorus.dialogs.WorkspaceDataSourceAccount);
                    });
                });
            });

            context('when the account loads and is empty and the data source is shared', function() {
                beforeEach(function() {
                    spyOnEvent(this.page.collection, 'reset');
                    this.page.dataSource.set({"shared": true});
                    expect(this.page.dataSource.isShared()).toBeTruthy();
                    this.server.completeFetchFor(this.page.account, backboneFixtures.dataSourceAccount({"id":null}));
                });

                it("does not pop up a WorkspaceDataSourceAccount dialog", function() {
                    expect(this.modalSpy).not.toHaveModal(chorus.dialogs.WorkspaceDataSourceAccount);
                });
            });

            context("when the account loads and is valid", function() {
                beforeEach(function() {
                    this.server.completeFetchFor(this.account, backboneFixtures.dataSourceAccount());
                });

                it("does not pop up the WorkspaceDataSourceAccountDialog", function() {
                    expect(this.modalSpy).not.toHaveModal(chorus.dialogs.WorkspaceDataSourceAccount);
                });

                describe("filtering", function() {
                    beforeEach(function() {
                        this.page.render();
                        this.page.collection.type = undefined;
                        spyOn(this.page.collection, 'fetch').andCallThrough();
                    });

                    it("has options for filtering", function() {
                        expect(this.page.$("ul[data-event=filter] li[data-type=]")).toExist();
                        expect(this.page.$("ul[data-event=filter] li[data-type=SOURCE_TABLE]")).toExist();
                        expect(this.page.$("ul[data-event=filter] li[data-type=CHORUS_VIEW]")).toExist();
                        expect(this.page.$("ul[data-event=filter] li[data-type=SANDBOX_DATASET]")).toExist();
                    });

                    it("can filter the list by 'all'", function() {
                        this.page.$("li[data-type=] a").click();
                        expect(this.page.collection.attributes.type).toBe("");
                        expect(this.page.collection.fetch).toHaveBeenCalled();
                    });

                    it("has can filter the list by 'SOURCE_TABLE'", function() {
                        this.page.$("li[data-type=SOURCE_TABLE] a").click();
                        expect(this.page.collection.attributes.type).toBe("SOURCE_TABLE");
                        expect(this.page.collection.fetch).toHaveBeenCalled();
                        expect(this.server.lastFetch().url).toContain("/workspaces/" + this.workspace.get("id") + "/datasets?entity_subtype=SOURCE_TABLE");
                    });

                    it("has can filter the list by 'SANBOX_TABLE'", function() {
                        this.page.$("li[data-type=SANDBOX_DATASET] a").click();
                        expect(this.page.collection.attributes.type).toBe("SANDBOX_DATASET");
                        expect(this.page.collection.fetch).toHaveBeenCalled();
                        expect(this.server.lastFetch().url).toContain("/workspaces/" + this.workspace.get("id") + "/datasets?entity_subtype=SANDBOX_DATASET");
                    });

                    it("has can filter the list by 'CHORUS_VIEW'", function() {
                        this.page.$("li[data-type=CHORUS_VIEW] a").click();
                        expect(this.page.collection.attributes.type).toBe("CHORUS_VIEW");
                        expect(this.page.collection.fetch).toHaveBeenCalled();
                        expect(this.server.lastFetch().url).toContain("/workspaces/" + this.workspace.get("id") + "/datasets?entity_subtype=CHORUS_VIEW");
                    });
                });

                describe("search", function() {
                    beforeEach(function() {
                        this.page.$("input.search").val("foo").trigger("keyup");
                    });

                    it("shows the Loading text in the count span", function() {
                        expect($(this.page.$(".count"))).toContainTranslation("loading");
                    });

                    it("throttles the number of search requests", function() {
                        expect(_.debounce).toHaveBeenCalled();
                    });

                    it("re-fetches the collection with the search parameters", function() {
                        expect(this.server.lastFetch().url).toContainQueryParams({namePattern: "foo"});
                    });

                    context("when the fetch completes", function() {
                        beforeEach(function() {
                            spyOn(this.page.mainContent, "render").andCallThrough();
                            spyOn(this.page.mainContent.content, "render").andCallThrough();
                            spyOn(this.page.mainContent.contentFooter, "render").andCallThrough();
                            spyOn(this.page.mainContent.contentDetails, "render").andCallThrough();
                            spyOn(this.page.mainContent.contentDetails, "updatePagination").andCallThrough();
                            this.server.completeFetchFor(this.page.collection);
                        });

                        it("updates the header, footer, and body", function() {
                            expect(this.page.mainContent.content.render).toHaveBeenCalled();
                            expect(this.page.mainContent.contentFooter.render).toHaveBeenCalled();
                            expect(this.page.mainContent.contentDetails.updatePagination).toHaveBeenCalled();
                        });

                        it("does not re-render the page or body", function() {
                            expect(this.page.mainContent.render).not.toHaveBeenCalled();
                            expect(this.page.mainContent.contentDetails.render).not.toHaveBeenCalled();
                        });
                        it("shows the Loading text in the count span", function() {
                            expect($(this.page.$(".count"))).not.toMatchTranslation("loading");
                        });
                    });
                });
            });
        });

        context("and the user does not have update permission on the workspace", function() {
            beforeEach(function() {
                this.workspace.set({ permission: ["read"]});
                this.server.completeFetchFor(this.workspace);
            });

            it("removes the import button", function() {
                expect(this.page.mainContent.contentDetails.$("button")).not.toExist();
            });

            it("still fetches the account for the current user", function() {
                expect(this.server.lastFetchFor(this.account)).not.toBeUndefined();
            });
        });

        context("and the workspace is archived", function() {
            beforeEach(function() {
                this.workspace.set({ archivedAt: "2012-05-08 21:40:14"});
                this.server.completeFetchFor(this.workspace);
            });

            it("has no buttons", function() {
                expect(this.page.$("button")).not.toExist();
            });
        });
    });

    it("gets a titlebar", function() {
        this.server.completeFetchFor(this.workspace);
        expect(this.page.$(".page_sub_header")).toContainText(this.workspace.name());
    });

    describe("when the workfile:selected event is triggered on the list view", function() {
        beforeEach(function() {
            this.server.completeFetchFor(this.workspace);
            this.page.render();

            this.dataset = backboneFixtures.workspaceDataset.datasetTable();
            chorus.PageEvents.trigger("dataset:selected", this.dataset);
        });

        it("sets the selected dataset as its own model", function() {
            expect(this.page.model).toBe(this.dataset);
        });
    });
});
