describe("chorus.views.WorkspaceListSidebar", function() {
    beforeEach(function() {
        this.modalSpy = stubModals();
        this.view = new chorus.views.WorkspaceListSidebar();
    });

    context("no workspaces exist", function() {
        it("does not have actions to add a note and to add an insight", function() {
            expect(this.view.$(".actions a.new_note")).not.toExist();
            expect(this.view.$(".actions a.new_insight")).not.toExist();
        });
    });

    context("a workspace exists", function() {
        beforeEach(function() {
            this.workspace = backboneFixtures.workspace();

            chorus.PageEvents.trigger("workspace:selected", this.workspace);
        });

        context("the workspace has an image", function() {
            beforeEach(function() {
                spyOn(this.view.model, 'hasImage').andReturn(true);
                spyOn(this.view.model, 'fetchImageUrl').andReturn("/user/456/image");
                this.view.render();
            });

            it("renders the workspace image", function() {
                expect(this.view.$("img.workspace_image").attr("src")).toContain("/user/456/image");
            });
        });

        context("the workspace does not have an image", function() {
            beforeEach(function() {
                spyOn(this.view.model, 'hasImage').andReturn(false);
                spyOn(this.view.model, 'fetchImageUrl').andReturn("/party.gif");
                this.view.render();
            });

            it("does not render the workspace image", function() {
                expect(this.view.$("img.workspace_image")).not.toExist();
            });
        });

        it("has the workspace member list", function() {
            expect(this.view.$(".workspace_member_list")[0]).toBe(this.view.workspaceMemberList.el);
        });

        describe("when the activity fetch completes", function() {
            beforeEach(function() {
                this.server.completeFetchFor(this.workspace.activities());
            });

            it("renders an activity list inside the tabbed area", function() {
                expect(this.view.tabs.activity).toBeA(chorus.views.ActivityList);
                expect(this.view.tabs.activity.el).toBe(this.view.$(".tabbed_content_area .activity_list")[0]);
            });
        });

        it("has actions to add a note and to add an insight", function() {
            expect(this.view.$(".actions a.new_note")).toContainTranslation("actions.add_note");
            expect(this.view.$(".actions a.new_insight")).toContainTranslation("actions.add_insight");
        });

        itBehavesLike.aDialogLauncher("a.new_note", chorus.dialogs.NotesNew);
        itBehavesLike.aDialogLauncher("a.new_insight", chorus.dialogs.InsightsNew);
        itBehavesLike.aDialogLauncher("a.edit_tags", chorus.dialogs.EditTags);
    });
});
