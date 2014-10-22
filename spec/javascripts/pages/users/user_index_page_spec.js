describe("chorus.pages.UserIndexPage", function() {
    beforeEach(function() {
        chorus.user = new chorus.models.User({
            "firstName": "Daniel",
            "lastName": "Burkes",
            "fullName": "Daniel Francis Burkes"
        });
        this.page = new chorus.pages.UserIndexPage();
        this.page.render();
    });


    describe("#initialize", function() {
        it("defaults to first name sorting ascending", function() {
            expect(this.page.collection.order).toBe("firstName");
        });

        it("has a helpId", function() {
            expect(this.page.helpId).toBe("users");
        });
    });

    describe("before the users have loaded", function() {
        it("has the right header title", function() {
            expect(this.page.$(".content_header h1").text()).toMatchTranslation("header.users_list");
        });

        it("defaults to first name sorting", function() {
            expect(this.page.$("li[data-type=lastName] .check")).toHaveClass("hidden");
            expect(this.page.$("li[data-type=firstName] .check")).not.toHaveClass("hidden");
        });

        it("shows the loading element", function() {
            expect(this.page.$(".loading_section")).toExist();
        });

        it("has a header", function() {
            expect(this.page.$("h1")).toExist();
        });

        describe("when the authenticated user is an admin", function() {
            beforeEach(function() {
                setLoggedInUser({ admin: true});
                this.page = new chorus.pages.UserIndexPage();
                this.page.render();
            });

            itBehavesLike.aPageWithPrimaryActions([{name: 'add_user', target: '#/users/new'}]);
        });

        describe("when the authenticated user is not an admin", function() {
            beforeEach(function() {
                chorus.user.set({ admin: false });
                this.page = new chorus.pages.UserIndexPage();
                this.page.render();
            });

            itBehavesLike.aPageWithPrimaryActions([]);
        });
    });

    describe("menus", function() {
        describe("sorting", function() {
            beforeEach(function() {
                this.page.collection.order = undefined;
                spyOn(this.page.collection, "fetch");
            });

            it("has options for sorting", function() {
                expect(this.page.$("ul[data-event=sort] li[data-type=firstName]")).toExist();
                expect(this.page.$("ul[data-event=sort] li[data-type=lastName]")).toExist();
            });

            it("can sort the list by first name ascending", function() {
                this.page.$("li[data-type=firstName] a").click();
                expect(this.page.collection.order).toBe("firstName");
                expect(this.page.collection.fetch).toHaveBeenCalled();
            });

            it("can sort the list by last name ascending", function() {
                this.page.$("li[data-type=lastName] a").click();
                expect(this.page.collection.order).toBe("lastName");
            });
        });
    });

    describe("setting the model on a page event", function() {
        beforeEach(function() {
            this.user = backboneFixtures.user({ firstName: "Super", lastName: "Man" });
        });

        it("sets the model to user on a user:selected event", function() {
            expect(this.page.model).toBeUndefined();
            chorus.PageEvents.trigger("user:selected", this.user);
            expect(this.page.model).toBe(this.user);
        });
    });

    describe("multiple selection", function() {
        beforeEach(function() {
            this.users = backboneFixtures.userSet();
            this.users.sortAsc("firstName");
            this.server.completeFetchFor(this.users);
        });

        itBehavesLike.aPageWithMultiSelect();
    });
});
