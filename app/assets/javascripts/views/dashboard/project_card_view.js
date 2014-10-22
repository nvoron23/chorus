chorus.views.ProjectCard = chorus.views.Base.extend({
    constructorName: 'ProjectCard',
    templateName: 'dashboard/project_card',

    subviews: {
        '.activity': 'insightView',
        '.status': 'statusView'
    },

    setup: function () {
        this.statusView = new chorus.views.ProjectStatus({model: this.model});

        if (this.model.latestInsight()) {
            this.insightView = new chorus.views.Activity({
                model: this.model.latestInsight(),
                isNotification: false,
                isReadOnly: true,
                unexpandable: true
            });
        }
    },

    postRender: function () {
        this.styleTooltip();

        var workspace = this.model;
        var comments = workspace.comments();
        comments.comparator = function(comment) {
            return -(new Date(comment.get('timestamp')).valueOf());
        };
        comments.sort();
        comments.loaded = true;
        var commentList = new chorus.views.ActivityList({
            collection: comments,
            initialLimit: 5,
            displayStyle: 'without_workspace',
            isReadOnly: true
        });
        this.registerSubView(commentList);

        var el = $(commentList.render().el);
        el.find("ul").addClass("tooltip activity");

        // reassign the offset function so that when qtip calls it, qtip correctly positions the tooltips
        // with regard to the fixed-height header.
        var viewport = $(window);
        var top = $("#header").height();
        viewport.offset = function() {
            return { left: 0, top: top };
        };

        var li = this.$(".insight_row");
        li.find(".has_recent_comments").qtip({
            content: el,
            show: {
                event: 'mouseover',
                solo: true,
                effect: {
                    type: 'fade',
                    length: 60
                }
            },
            hide: {
                delay: 500,
                fixed: true,
                event: 'mouseout'
            },
            position: {
                viewport: viewport,
                my: "right center",
                at: "left center"
            },
            style: {
                classes: "tooltip-white recent_comments_list",
                tip: {
                    width: 15,
                    height: 20
                }
            },
            events: {
                show: function(e) {
                    commentList.render();
                    commentList.show();
                }
            }
        });
    },

    additionalContext: function () {
        return {
            showUrl: this.model.showUrl(),
            workfilesUrl: this.model.workfilesUrl(),
            datasetsUrl: this.model.datasetsUrl(),
            latestInsight: this.model.latestInsight() && new chorus.presenters.Activity(this.model.latestInsight()),
            allInsightsRoute: this.model.showUrl() + '?filter=insights',
            milestoneProgress: this.model.milestoneProgress(),
            milestonesUrl: this.model.milestonesUrl()
        };
    },

    styleTooltip: function () {
        // reassign the offset function so that when qtip calls it, qtip correctly positions the tooltips
        // with regard to the fixed-height header.
        var viewport = $(window);
        viewport.offset = function () {
            return { left: 0, top: $("#header").height() };
        };

        this.$('.info_icon .icon').qtip({
            hide: {
                delay: 500,
                fixed: true,
                event: 'mouseout'
            },
            position: {
                viewport: viewport,
                my: "bottom left",
                at: "top center"
            },
            style: {
                classes: "tooltip-white tooltip",
                tip: {
                    width: 15,
                    height: 20
                }
            }
        });
    },

    milestonesUrl: function () {
        return this.showUrl() + "/milestones";
    }
    
});