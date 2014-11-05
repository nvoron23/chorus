chorus.views.TabControl = chorus.views.Base.extend({
    constructorName: "TabControlView",
    templateName:'tab_control',

    events: { "click .tabs .tab": 'clickTab' },

    setup: function(tabNames) {
        this.tabNames = tabNames;
    },

    additionalContext:function () {
        return {
            tabKeys: _.map(this.tabNames, function(tabName) {
                return { name: tabName, text: t('tabs.' + tabName) };
            })
        };
    },

    clickTab: function(evt) {
        this.setSelectedTab($(evt.target).closest('.tab'));
        chorus.page && chorus.page.trigger('resized');
    },

    setSelectedTab: function(tab) {
        this.$(".tabs li").removeClass("selected");
        tab.addClass("selected");
        this.selectedTabName = tab.data('name');
        this.toggleTabbedArea();
        this.trigger("selected:" + tab.data("name"));
        this.trigger("selected");
    },

    postRender: function() {
        _.each(this.tabNames, function(tabName) {
            var view = this[tabName];
            if (view) {
                this.registerSubView(view);
                this.$(".tabbed_content_area").append(view.render().el);
                view.delegateEvents();
            }
        }, this);

        var tab = this.selectedTabName ? this.$("li[data-name=" + this.selectedTabName + "]") : this.$('li:first');
        this.setSelectedTab(tab);
    },

    toggleTabbedArea: function () {
        _.each(this.tabNames, function(tabName) {
            var view = this[tabName];
            if (view) $(view.el).addClass("hidden");
        }, this);

        if (this.selectedTabName) {
            var view = this[this.selectedTabName];
            if (view) $(view.el).removeClass("hidden");
        }
    }
});
