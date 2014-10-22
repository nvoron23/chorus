describe("chorus.pages.AboutPage", function() {
    beforeEach(function () {
        this.page = new chorus.pages.AboutPage();
    });

    describe("when the fetch for the license completes", function() {
        beforeEach(function () {
            this.license = backboneFixtures.license();
            this.server.completeFetchFor(this.page.model, this.license);
        });

        it("has the styles for a logged in page", function () {
            expect(this.page.$el).toHaveClass("logged_in_layout");
        });

        it("includes the application name", function () {
            expect(this.page.$(".title")).toContainTranslation("about." + this.license.applicationKey());
        });

        describe("when the version string is returned", function () {
            beforeEach(function () {
                this.version = "0123456789ABCDEF012";
                _.find(this.server.fetches(), function(req) {
                    return req.url === "/VERSION";
                }, this).respond(200, {}, this.version);
            });

            it("displays the version info", function () {
                expect(this.page.$(".version")).toContainText(this.version);
            });
        });
    });

    describe("when the license vendor is alpine", function () {
        beforeEach(function () {
            this.license = backboneFixtures.license({vendor: "alpine"});
            this.server.completeFetchFor(this.page.model, this.license);
        });

        it("renders the license info", function () {
            _.each(["collaborators", "admins", "developers", "expires"], function(item) {
                expectItemExists(this.page, this.license, item);
            }, this);
        });
    });

    describe("when the license vendor is openchorus", function () {
        beforeEach(function () {
            this.license = backboneFixtures.license({vendor: "openchorus"});
            this.server.completeFetchFor(this.page.model, this.license);
        });

        it("displays only the version info", function () {
            _.each(["collaborators", "admins", "developers", "expires"], function(item) {
                expectItemDoesNotExist(this.page, this.license, item);
            }, this);
        });
    });

    describe("when the license vendor is pivotal", function () {
        beforeEach(function () {
            this.license = backboneFixtures.license({vendor: "pivotal"});
            this.server.completeFetchFor(this.page.model, this.license);
        });

        it("displays only the version info", function () {
            _.each(["collaborators", "admins", "developers"], function(item) {
                expectItemDoesNotExist(this.page, this.license, item);
            }, this);
            expectItemExists(this.page, this.license, "expires");
        });
    });

    function expectItemExists(page, license, item) {
        expect(page.$(".items ." + item)).toContainText(t("about." + item) + ": " + license.get(item));
    }

    function expectItemDoesNotExist(page, license, item) {
        expect(page.$(".items ." + item)).not.toContainText(t("about." + item) + ": " + license.get(item));
    }
});
