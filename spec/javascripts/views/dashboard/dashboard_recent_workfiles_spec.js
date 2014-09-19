describe("chorus.views.DashboardRecentWorkfiles", function() {
    beforeEach(function() {
        this.view = new chorus.views.DashboardRecentWorkfiles();
        this.recentWorkfilesAttrs = backboneFixtures.dashboard.recentWorkfiles().attributes;
    });

    describe("setup", function() {
        it("fetches the recent workfiles data", function() {
            expect(this.server.lastFetch().url).toBe('/dashboards?entity_type=recent_workfiles');
        });

        context("when the fetch completes", function() {
            beforeEach(function() {
                this.server.lastFetch().respondJson(200, this.recentWorkfilesAttrs);
            });

            it("has a title", function() {
                expect(this.view.$('.title')).toContainTranslation("dashboard.recent_workfiles.name");
            });

            it("displays the recent workfiles data", function() {
                expect(this.view.$('li').length).toBe(5);
                _.each(this.recentWorkfilesAttrs.data, function(element) {
                    var workfile = new chorus.models.Workfile(element.workfile);
                    expect(this.view.$("#workfile_" + element.workfile.id + " .image img").attr("src")).toBe(workfile.iconUrl());
                    expect(this.view.$("#workfile_" + element.workfile.id + " .workfile_link").attr("href")).toBe(workfile.showUrl());
                    expect(this.view.$("#workfile_" + element.workfile.id + " .workfile_link")).toContainText(element.workfile.fileName);
                    expect(this.view.$("#workfile_" + element.workfile.id + " .workspace_image").attr("src")).toBe(workfile.workspace().defaultIconUrl("small"));
                    expect(this.view.$("#workfile_" + element.workfile.id + " .workspace_link")).toContainText(element.workfile.workspace.name);
                    expect(this.view.$("#workfile_" + element.workfile.id + " .workspace_link").attr("href")).toBe(workfile.workspace().showUrl());
                    expect(this.view.$("#workfile_" + element.workfile.id + " .time_edited")).toContainText(Handlebars.helpers.relativeTimestamp(element.lastOpened));
                }, this);
            });
        });
    });
});
