describe("chorus.views.ProjectListHeader", function(){
    beforeEach(function () {
        this.collection = backboneFixtures.workspaceSet();
        this.view = new chorus.views.ProjectListHeader({collection: this.collection});
        this.view.render();
    });
    /*
    describe("menu links", function () {
        it("has links for both All and only the User's projects", function () {
            expect(this.view.$(".menus .members_only")).toContainTranslation('workspace.project.filter.members_only');
            expect(this.view.$(".menus .all")).toContainTranslation('workspace.project.filter.all');
        });

        it("defaults to my projects", function () {
            expect(this.view.$(".menus .members_only")).toHaveClass('active');
            expect(this.view.$(".menus .all")).not.toHaveClass('active');
        });

        describe("clicking on 'My Projects'", function() {
            beforeEach(function() {
                spyOn(this.collection, 'trigger');
                this.view.$(".menus .members_only").click();
            });

            it("sets the title to 'My Projects'", function () {
                expect(this.view.$(".title")).toContainTranslation('header.my_projects');
            });

            it("triggers filter on the collection", function() {
                expect(this.collection.trigger).toHaveBeenCalledWith('filter:members_only');
            });

            it("displays the 'My Projects' option as active", function() {
                expect(this.view.$(".menus .members_only")).toHaveClass("active");
                expect(this.view.$(".menus .all")).not.toHaveClass("active");
            });
        });

        describe("clicking on 'All Projects'", function() {
            beforeEach(function() {
                spyOn(this.collection, 'trigger');
                this.view.$(".menus .all").click();
            });

            it("sets the title to 'All Projects'", function () {
                expect(this.view.$(".title")).toContainTranslation('header.all_projects');
            });

            it("triggers fitler on the collection", function() {
                expect(this.collection.trigger).toHaveBeenCalledWith('filter:all');
            });

            it("displays the 'My Projects' option as active", function() {
                expect(this.view.$(".menus .members_only")).not.toHaveClass("active");
                expect(this.view.$(".menus .all")).toHaveClass("active");
            });
        });

    });
         */


});
