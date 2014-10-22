chorus.dialogs.RenameWorkfile = chorus.dialogs.Base.include(chorus.Mixins.DialogFormHelpers).extend({
    constructorName: "RenameWorkfileDialog",
    templateName: "rename_workfile_dialog",

    title: t("workfile.rename_dialog.title"),

    additionalContext: function(){
        var isSql = this.model.isSql();
        return {
            isSql: isSql,
            fileName: isSql ? this.model.get('fileName').replace(/\.sql$/,'') : this.model.get('fileName')
        };
    },

    setup: function() {
        this.listenTo(this.model, "saved", this.saved);
        this.listenTo(this.model, "saveFailed", this.saveFailed);
        this.disableFormUnlessValid({
            formSelector: "form",
            inputSelector: "input"
        });
    },

    create: function(e) {
        var fileName = this.$("input").val();
        this.model.save({fileName: this.model.isSql() ? fileName + ".sql" : fileName }, {wait: true});
        this.$("button.submit").startLoading("actions.renaming");
    },

    saved: function() {
        this.closeModal(true);
        chorus.PageEvents.trigger('workfile:rename');
    }
});
