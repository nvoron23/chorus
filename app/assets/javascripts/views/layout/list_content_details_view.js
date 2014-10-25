chorus.views.ListContentDetails = chorus.views.Base.include(
        chorus.Mixins.BoundForMultiSelect
    ).extend({
    constructorName: "ListContentDetailsView",
    templateName: "list_content_details",
    additionalClass: "action_bar_primary",

    events: {
        "click a.next": "fetchNextPage",
        "click a.previous": "fetchPreviousPage"
    },

    subviews: {
        "div.button_holder" : "buttonView"
    },

    setup: function(){
        this.buttonView = this.options.buttonView || new chorus.views.ListContentDetailsButtonView(this.options);
        this.listenTo(this.collection, "remove", this.render);
        if (this.options.multiSelect) {
            this.unselectOnFetch();
        }
    },

    fetchNextPage: function() {
        var page = parseInt(this.collection.pagination.page, 10);
        this.collection.fetchPage(page + 1);
        this.scrollToTopOfPage();
    },

    fetchPreviousPage: function() {
        var page = parseInt(this.collection.pagination.page, 10);
        this.collection.fetchPage(page - 1);
        this.scrollToTopOfPage();
    },

    scrollToTopOfPage: function() {
        window.scroll(0, 0);
    },

    postRender: function(el) {
        this.updatePagination();
        if (this.$(".pagination").hasClass("hidden") && this.options.hideIfNoPagination) {
            el.addClass("hidden");
        } else {
            el.removeClass("hidden");
        }

        if (this.options.search) {
            this.setupSearch();
        }

        this.renderCheckedState();
    },

    setupSearch: function() {
        chorus.search(_.extend(
            {
                input: this.$("input.search:text"),
                afterFilter: _.bind(this.updateFilterCount, this)
            },
            this.options.search)
        );
    },

    startLoading: function(selector) {
        this.$(selector).text(t("loading"));
    },

    updateFilterCount: function() {
        var count = this.options.search.list.find("> li").not(".hidden").length;
        this.$(".count").text(t("entity.name." + this.options.modelClass, {count: count}));
    },

    updatePagination: function() {
        var count = this.collection.totalRecordCount();
        this.$(".count").text(t("entity.name." + this.options.modelClass, {count: count}));

        if (this.collection.loaded && this.collection.pagination) {
            if (this.collection.length > 0) {
                this.$(".current").text(this.collection.pagination.page);
                this.$(".total").text(this.collection.pagination.total);
            }

            var page = this.collection.pagination.page;
            var total = this.collection.pagination.total;

            this.$(".pagination").toggleClass("hidden", total <= 1);

            var hasPreviousLink = page > 1;
            this.$("a.previous").toggleClass("hidden", !hasPreviousLink);
            this.$("span.previous").toggleClass("hidden", hasPreviousLink);

            var hasNextLink = page < total;
            this.$("a.next").toggleClass("hidden", !hasNextLink);
            this.$("span.next").toggleClass("hidden", hasNextLink);
        } else {
            this.$(".pagination").addClass("hidden");
        }
    },

    additionalContext: function(ctx) {
        var hash = {
            hideCounts: this.options.hideCounts,
            buttons: this.options.buttons,
            search: this.options.search,
            searchTerm: this.collection && this.collection.attributes && this.collection.attributes[this.collection.searchAttr],
            workspaceId: this.collection && this.collection.attributes && this.collection.attributes.workspaceId,
            multiSelect: this.options.multiSelect
        };

        if (this.collection.loaded && this.collection.pagination) {
            var page = parseInt(this.collection.pagination.page, 10);
            var total = parseInt(this.collection.pagination.total, 10);
            hash.nextPage = page < total;
        }

        return hash;
    }
});
