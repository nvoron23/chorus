chorus.pages.AboutPage = chorus.pages.Base.extend({
    constructorName: "AboutPage",
    templateName: "about",
    additionalClass: "logged_in_layout",

    makeModel: function() {
        this.model = this.license = new chorus.models.License();
    },

    setup: function() {
        this.requiredResources.add(this.model);
        this.model.fetch();
    },

    postRender: function() {
        this.$(".version").load("/VERSION", function(res) {
            $(this).text(res);
        });
    },

    context: function() {
        return _.extend({
            items: this.items(),
            applicationKey: "about." + this.model.applicationKey()
        }, this.pageOptions);
    },

    items: function() {
        var keys = [];
        var vendor = this.model.get("vendor");
        if (vendor !== "openchorus") {
            keys.splice(0, 0, "expires");
        }
        if(vendor === "alpine") {
            keys.splice(0, 0, "collaborators", "admins", "developers");
        }

        return _.map(keys, function(key) {
            return {
                key: key,
                translationKey: "about." + key,
                value: this.model.get(key)
            };
        }, this);
    }
});
