chorus.pages.WorkspaceIndexPage = chorus.pages.Base.extend({
    helpId: "workspaces",

    setup:function () {
        this.collection = new chorus.collections.WorkspaceSet();

        this.multiSelectSidebarMenu = new chorus.views.MultipleSelectionSidebarMenu({
            selectEvent: "workspace:checked",
            actionProvider: [{name: "edit_tags", target: chorus.dialogs.EditTags}]
        });

        this.mainContent = new chorus.views.MainContentList({
            modelClass:"Workspace",
            collection:this.collection,
            linkMenus:{
                type:{
                    title:t("filter.show"),
                    options:[
                        {data:"active", text:t("filter.active_workspaces")},
                        {data:"all", text:t("filter.active_and_archived_workspaces")}
                    ],
                    event:"filter"
                },
                scope:{
                    options:[
                        {data:"members_only", text:t("workspace.project.filter.members_only")},
                        {data:"members_any", text:t("workspace.project.filter.everyones")}
                    ],
                    event:"filterScope"
                }
            },
            contentDetailsOptions: { multiSelect: true }
        });

        this.buildPrimaryActions();
        this.sidebar = new chorus.views.WorkspaceListSidebar();
        this.subscribePageEvent("workspace:selected", this.setModel);

        this.mainContent.contentHeader.bind("choice:filter", this.choose, this);
        this.mainContent.contentHeader.bind("choice:filterScope", this.chooseScope, this);
        this.choose("active");
        this.choose("members_any");
    },
    
    choose:function (choice) {
        console.log ("filter ->" + choice);
        this.collection.attributes.active = (choice === "active");
        this.collection.fetch();
    },
    chooseScope:function (choice) {
        console.log ("scope ->" + choice);
        this.collection.attributes.members_only = (choice === "members_only");
        this.collection.fetch();
    },

    setModel: function(workspace) {
        this.model = workspace;
    },

    buildPrimaryActions: function() {
        var actions = [{name: 'create_workspace', target: chorus.dialogs.WorkspacesNew}];
        this.primaryActionPanel = new chorus.views.PrimaryActionPanel({actions: actions});
    }
});