chorus.dialogs.CopyWorkfile = chorus.dialogs.PickWorkspace.extend({
    constructorName: "CopyWorkfile",

    title: t("workfile.copy_dialog.title"),
    submitButtonTranslationKey: "workfile.copy_dialog.copy_file",

    setup: function() {
        this.workfile = new chorus.models.Workfile({
            id: this.options.workfileId,
            workspace: { id: this.options.workspaceId }
        });
        this.requiredResources.add(this.workfile);
        this.requiredResources.add(this.collection);
        this.workfile.fetch();

        this._super("setup", arguments);
    },

    resourcesLoaded: function() {
        this.render();
    },

    submit: function() {
        var self = this;
        var workfile = this.workfile;

        var params = {
            workspace_id: this.selectedItem().get("id")
        };

        var description = workfile.get("description");
        if (description) {
            params.description = description;
        }
        $.ajax({
            url: "/workfiles/" + this.workfile.get("id") + "/copy",
            type: "POST",
            dataType: "json",
            data: params,
            success: function(data) {
                self.closeModal(true);
                var copiedWorkfile = new chorus.models.Workfile(workfile.parse(data));
                chorus.toast("workfile.copy_dialog.toast", {workfileTitle: copiedWorkfile.get("fileName"), workspaceNameTarget: self.selectedItem().get("name")});
            },

            error: function(xhr) {
                var data = JSON.parse(xhr.responseText);
                self.resource.serverErrors = data.errors;
                self.showErrors();
            }
        });
    }
});
