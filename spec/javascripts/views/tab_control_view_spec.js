describe("chorus.views.TabControl", function() {
    beforeEach(function() {
        this.tab1Spy = jasmine.createSpy('tab1Spy');
        this.tab2Spy = jasmine.createSpy('tab2Spy');
        this.tab3Spy = jasmine.createSpy('tab3Spy');
        this.selectedSpy = jasmine.createSpy('selectedSpy');

        this.tab1View = chorus.views.StaticTemplate("plain_text", { text: "tabText1" });
        this.tab2View = chorus.views.StaticTemplate("plain_text", { text: "tabText2" });
        this.tab3View = chorus.views.StaticTemplate("plain_text", { text: "tabText3" });

        this.tabSubviews = [this.tab1View,this.tab2View,this.tab3View];
        _(this.tabSubviews).each(function(view) {
            spyOn(view, "delegateEvents").andCallThrough();
        });

        this.view = new chorus.views.TabControl(["activity", "statistics", "configuration"]);

        this.view.activity = this.tab1View;
        this.view.statistics = this.tab2View;
        this.view.configuration = this.tab3View;

        this.view.bind('selected:activity', this.tab1Spy);
        this.view.bind('selected:statistics', this.tab2Spy);
        this.view.bind('selected:configuration', this.tab3Spy);
        this.view.bind('selected', this.selectedSpy);

        $('#jasmine_content').append(this.view.el);

        this.view.render();
    });

    it("renders a tab for each of the given tab names", function() {
        expect(this.view.$("ul.tabs li").length).toBe(3);

        expect(this.view.$("ul.tabs li").eq(0)).toHaveData("name", "activity");
        expect(this.view.$("ul.tabs li").eq(1)).toHaveData("name", "statistics");
        expect(this.view.$("ul.tabs li").eq(2)).toHaveData("name", "configuration");

        expect(this.view.$("ul.tabs li").eq(0)).toContainTranslation("tabs.activity");
        expect(this.view.$("ul.tabs li").eq(1)).toContainTranslation("tabs.statistics");
        expect(this.view.$("ul.tabs li").eq(2)).toContainTranslation("tabs.configuration");
    });

    it("renders each view inside of its 'tabbed area'", function() {
        expect(this.view.$(".tabbed_content_area div").length).toBe(3);
        expect(this.view.$(".tabbed_content_area div").eq(0)).toContainText("tabText1");
        expect(this.view.$(".tabbed_content_area div").eq(1)).toContainText("tabText2");
        expect(this.view.$(".tabbed_content_area div").eq(2)).toContainText("tabText3");
    });

    it("calls #delegateEvents on each view (bc otherwise the events of a subview don't propogate to its subviews)", function() {
        _(this.tabSubviews).each(function(view) {
            expect(view.delegateEvents).toHaveBeenCalled();
        });
    });

    it("renders the first tab as selected", function() {
        expect(this.view.$("ul.tabs li.selected").length).toBe(1);
        expect(this.view.$("ul.tabs li").eq(0)).toHaveClass("selected");
        expect(this.tab1Spy).toHaveBeenCalled();
    });

    it("makes the first tabbed area visible", function() {
        expect(this.view.$(".tabbed_content_area div").length).toBe(3);
        expect(this.view.$(".tabbed_content_area div:visible").length).toBe(1);
        expect(this.view.$('.tabbed_content_area div').eq(0)).toBeVisible();
    });

    context("clicking on a tab", function() {
        beforeEach(function() {
            chorus.page = new chorus.pages.Base();
            spyOnEvent(chorus.page, 'resized');
            this.tab1Spy.reset();
            this.view.$('li').eq(1).click();
        });

        it("triggers 'resized' on the page", function() {
            expect('resized').toHaveBeenTriggeredOn(chorus.page);
        });

        it("triggers the correct callbacks", function() {
            expect(this.tab2Spy).toHaveBeenCalled();
            expect(this.selectedSpy).toHaveBeenCalled();
            expect(this.tab1Spy).not.toHaveBeenCalled();
            expect(this.tab3Spy).not.toHaveBeenCalled();
        });

        it("updates the selected class", function() {
            expect(this.view.$('li[data-name=activity]')).not.toHaveClass('selected');
            expect(this.view.$('li[data-name=statistics]')).toHaveClass('selected');
            expect(this.view.$('li[data-name=configuration]')).not.toHaveClass('selected');
        });

        it("unhides the appropriate tabbed_content_area and hides the others", function() {
            expect(this.view.$(".tabbed_content_area div:visible").length).toBe(1);
            expect(this.view.$('.tabbed_content_area div').eq(1)).toBeVisible();
        });

        context("calling render a second time", function() {
            beforeEach(function() {
                this.tab1Spy.reset();
                this.tab2Spy.reset();
                this.selectedSpy.reset();
                this.view.render();
            });

            it("keeps the current tab selected", function() {
                expect(this.tab1Spy).not.toHaveBeenCalled();
                expect(this.tab2Spy).toHaveBeenCalled();
                expect(this.tab3Spy).not.toHaveBeenCalled();
                expect(this.selectedSpy).toHaveBeenCalled();

                expect(this.view.$("ul.tabs li.selected").length).toBe(1);
                expect(this.view.$('li[data-name=statistics]')).toHaveClass('selected');
            });

            it("keeps the correct tabbed_content_area visibilities", function() {
                expect(this.view.$(".tabbed_content_area div").length).toBe(3);
                expect(this.view.$(".tabbed_content_area div:visible").length).toBe(1);
                expect(this.view.$('.tabbed_content_area div').eq(1)).toBeVisible();
            });
        });
    });
});
