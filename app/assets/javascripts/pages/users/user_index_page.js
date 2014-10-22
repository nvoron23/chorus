chorus.pages.UserIndexPage = chorus.pages.Base.extend({
    constructorName: 'UserIndexPage',
    helpId: "users",

    setup:function () {
        this.collection = new chorus.collections.UserSet();
        this.collection.sortAsc("firstName");
        this.collection.fetch();

        this.mainContent = new chorus.views.MainContentList({
            modelClass:"User",
            title: t("header.users_list"),
            collection:this.collection,
            linkMenus:{
                sort:{
                    title:t("users.header.menu.sort.title"),
                    options:[
                        {data:"firstName", text:t("users.header.menu.sort.first_name")},
                        {data:"lastName", text:t("users.header.menu.sort.last_name")}
                    ],
                    event:"sort",
                    chosen: "firstName"
                }
            }
        });

        this.mainContent.contentHeader.bind("choice:sort", function (choice) {
            this.collection.sortAsc(choice);
            this.collection.fetch();
        }, this);

        this.mainContent.contentDetails = new chorus.views.ListContentDetails({ 
            collection: this.collection, 
            modelClass: "User", 
            multiSelect: true
        });

        this.buildPrimaryActionPanel();

        this.sidebar = new chorus.views.UserSidebar({listMode: true});

        this.multiSelectSidebarMenu = new chorus.views.MultipleSelectionSidebarMenu({
            selectEvent: "user:checked",
            actionProvider: [{name: "edit_tags", target: chorus.dialogs.EditTags}]
        });

        this.subscribePageEvent("user:selected", this.setModel);
    },

    setModel:function(user) {
        this.model = user;
    },

    buildPrimaryActionPanel: function () {
        var isAdmin = chorus.session.user().get("admin");
        var actions = isAdmin ? [{name: 'add_user', target: '#/users/new'}] : [];
        this.primaryActionPanel = new chorus.views.PrimaryActionPanel({actions: actions});
    }
    
});
