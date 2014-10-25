chorus.views.LinkMenu = chorus.views.Base.extend({
    constructorName: "LinkMenuView",
    templateName:"link_menu",

    events:{
        "click a.popup":"popupLinkClicked",
        "click .menu a":"choose"
    },

    context:function () {
        if (!this.options.chosen) {
            this.options.chosen = this.options.options[0].data;
        }

        _.each(this.options.options, function (option) {
            if (option.data === this.options.chosen) {
                option.isChecked = true;
                this.options.chosenText = option.text;
            } else {
                option.isChecked = false;
            }
        }, this);

        return this.options;
    },

    popupLinkClicked:function (e) {
        chorus.PopupMenu.toggle(this, ".menu", e);
    },

    choose:function (e) {
        e.preventDefault();
        var ul = $(e.target).closest("ul"),
            li = $(e.target).closest("li");
        this.options.chosen = li.data("type");

        var eventName = ul.data("event");
        var pickedChoiceData = $(e.target).closest('li').data("type");
        this.trigger("choice", eventName, pickedChoiceData);
        chorus.PageEvents.trigger("choice:" + eventName, pickedChoiceData, this);
        this.render();
    }
});
