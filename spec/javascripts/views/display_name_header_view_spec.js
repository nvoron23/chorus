describe("chorus.views.DisplayNameHeader", function() {
    beforeEach(function() {
        this.model = backboneFixtures.user({
            tags: [
                {name: "alpha"}
            ]
        });
        this.view = new chorus.views.DisplayNameHeader({ model : this.model });
    });

    describe("#render", function() {
        context("when the model is not loaded", function() {
            beforeEach(function() {
                this.model.loaded = undefined;
                this.view.render();
            });

            it("does not display anything", function() {
                expect(this.view.$("h1").text().trim()).toBe("");
            });
        });

        context("when the model is loaded", function() {
            beforeEach(function() {
                this.model.loaded = true;
                this.view.render();
            });

            it("shows the display name", function() {
                expect(this.view.$("h1").text().trim()).toBe(this.model.displayName());
            });

            describe("tag box", function() {
                context("when showTagBox option is set to true", function() {
                    beforeEach(function() {
                        this.view = new chorus.views.DisplayNameHeader({ model : this.model, showTagBox: true });
                        this.view.render();
                    });

                    it("shows a tag box below the name", function() {
                        expect(this.view.$('.tag_box')).toExist();
                        expect(this.view.$('.text-tags')).toContainText("alpha");
                    });
                });

                context("when showTagBox option is not set", function() {
                    it("does not show a tag box below the name", function() {
                        expect(this.view.$('.tag_box')).not.toExist();
                    });
                });
            });
        });
    });
});
