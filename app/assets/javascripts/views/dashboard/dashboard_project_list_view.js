chorus.views.DashboardProjectList = chorus.views.Base.extend({
    constructorName: "DashboardProjectListView",
    templateName: "dashboard/project_list",
    useLoadingSection:true,

    setup: function (params) {
        this.projectCards = [];
        if(params.option === 'most_active') {
            this.mostActive = true;
            this.noFilter = true;
        }
        else {
            this.mostActive = false;
            if(params.option === 'all') {
                this.noFilter = true;
            }
            else {
                this.noFilter = false;
            }
        }
    },

    preRender: function () {
        _.invoke(this.projectCards, 'teardown');
        this.projectCards = this.collection.filter(this.filter, this).map(function (workspace) {
            var card = new chorus.views.ProjectCard({model: workspace});
            this.registerSubView(card);
            return card;
        }, this);
    },

    postRender: function () {
        _.each(this.projectCards, function(view) {
            this.$el.append(view.render().el);
        }, this);
    },

    triggerRender: function (bool) {
        this.noFilter = bool;
        this.render();
    },

    filter: function (project) {
        return this.noFilter || project.get('isMember');
    }
});