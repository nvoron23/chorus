describe("chorus.views.DashboardWorkspaceActivity", function() {
    beforeEach(function() {
        this.view = new chorus.views.DashboardWorkspaceActivity();
        this.workspaceActivityAttrs = backboneFixtures.dashboard.workspaceActivity().attributes;
    });

    describe("setup", function() {
        it("fetches the activity data", function() {
            expect(this.server.lastFetch().url).toBe('/dashboards?entity_type=workspace_activity&date_group=day&date_parts=7');
        });

        context("when the fetch completes", function() {
            beforeEach(function() {
                spyOn(this.view, "postRender");
                this.server.lastFetch().respondJson(200, this.workspaceActivityAttrs);
            });

            it("has the title", function() {
                expect(this.view.$(".title")).toContainTranslation("dashboard.workspace_activity.name");
            });

            it("renders", function() {
                expect(this.view.postRender).toHaveBeenCalled();
            });
        });
    });

    describe("#render", function() {
        beforeEach(function() {
            this.qtip = stubQtip();
            window.addCompatibilityShimmedMatchers(chorus.svgHelpers.matchers);
            this.server.lastFetch().respondJson(200, this.workspaceActivityAttrs);
            this.view.render();
        });

        it("displays the chart", function() {
            expect(this.view.vis.entities.chart.domElement).not.toBe(null);

            var num_workspaces = this.workspaceActivityAttrs.data.workspaces.length;

            // Expect one area per workspace within the graph
            this.layers = this.view.$(".layer");
            expect(this.layers.length).toBe(num_workspaces);
        });

        it("displays hover card when mouse over an activity layer", function() {
            var layer = $(this.view.$(".layer")[0]);
            var layer_ws = this.workspaceActivityAttrs.data.workspaces[0];

            // Expect hovercard to be visible
            layer.mouseover();
            expect(this.qtip).toExist();

            // Expect workspace title and summary to be present.
            expect(this.qtip).toContainText(layer_ws.name);
            expect(this.qtip).toContainText(layer_ws.summary);

            // Expect workspace title to be a link to the workspace
            expect(this.qtip).toContainHtml('<a href="#workspaces/' + layer_ws.workspaceId + '>'  + layer_ws.name + '</a>');
        });
    });

    describe("when there is no activity", function() {
        beforeEach(function () {
            this.workspaceActivityAttrs.data = { workspaces: [], events: [] };
            this.server.lastFetch().respondJson(200, this.workspaceActivityAttrs);
            this.view.render();
        });

        it("displays no activity message and text tip", function () {
            expect(this.view.vis.entities.chart.domElement).toBe(null);
            expect(this.view.$(".no_activity")).toContainTranslation("dashboard.workspace_activity.no_activity.text");
            expect(this.view.$(".text_tip")).toContainTranslation("dashboard.workspace_activity.no_activity.text_tip.text");
            expect(this.view.$(".text_tip a")).toContainTranslation("dashboard.workspace_activity.no_activity.text_tip.link.text");
        });
    });
});
