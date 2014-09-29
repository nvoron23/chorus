chorus.views.WorkfileItem = chorus.views.Base.extend(chorus.Mixins.TagsContext).extend({
    constructorName: "WorkfileItemView",
    templateName:"workfile_item",
    tagName: "div",

    subviews: {
        ".comment .body": "commentBody"
    },

    setup: function() {
        this._super("setup", arguments);
        this.listenTo(this.model, "invalidated", function() { this.model.fetch(); });
    },

    setupSubviews: function() {
        this.commentBody = new chorus.views.TruncatedText({
            model: this.model.lastComment(),
            attribute: "body",
            attributeIsHtmlSafe: true
        });
    },

    postRender: function() {
        $(this.el).attr('data-id', this.model.id);
    },

    additionalContext: function() {

        var ctx = {
            iconUrl: this.model.iconUrl({size: 'large'}),
            name: this.model.name(),
            tableauWorkbook: this.model.get('fileType') === 'tableau_workbook',
            tableauIcon: Handlebars.helpers.tableauIcon(),
            model: this.model
        };

        ctx.url = this.model.hasOwnPage() ? this.model.showUrl() : this.model.downloadUrl();

        _.extend(ctx, this.additionalContextForTags());

        var lastComment = this.model.lastComment();
        if (lastComment) {
            var date = chorus.parseDateFromApi(lastComment.get("commentCreatedStamp"));

            ctx.lastComment = {
                body:lastComment.get("body"),
                creator:lastComment.author(),
                on:date && date.toString("MMM d")
            };

            ctx.otherCommentCount = parseInt(this.model.get("commentCount"), 10) - 1;
        }
        return ctx;
    }
});
