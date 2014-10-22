chorus.views.Activity = chorus.views.Base.extend({
    constructorName: 'ActivityView',
    templateName: 'activity',
    tagName: 'li',

    events: {
        'click a.promote': 'promote',
        'click a.demote': 'demote',
        'click a.publish': 'publish',
        'click a.unpublish': 'unpublish',
        'click a.update_credentials': 'launchUpdateCredentialsDialog',
        'click a.delete_note': 'launchDeleteNoteConfirmAlert',
        'click a.delete_notification': 'launchNotificationDeleteAlert',
        'click a.edit_note': 'launchEditNoteDialog',
        'click a.comment': 'launchCommentDialog',
        'click a.image_link': 'launchImageDialog',
        'click .image_attachment_link': 'launchAttachmentImageDialog'
    },

    subviews: {
        '.comment_list': 'commentList',
        '.activity_content > .truncated_text': 'htmlContent',
        '.activity_content > .actions > .error_details': 'failureContent'
    },

    setup: function() {
        this.subscribePageEvent('comment:added', this.addComment);
        this.subscribePageEvent('comment:deleted', this.deleteComment);
    },

    addComment: function(comment) {
        if(this.model.id === comment.get('eventId')) {
            var comments = this.model.comments();
            if(!comments.get(comment.id)) {
                comments.add(comment);
            }
            this.render();
        }
    },

    deleteComment: function(comment) {
        var comments = this.model.comments();
        if(comments.get(comment.id)) {
            comments.remove(comment);
            this.render();
        }
    },

    preRender: function () {
        this.presenter = new chorus.presenters.Activity(this.model, this.options);
        this.events = _.extend(this.events, this.presenter.dialogEvents());
        this.delegateEvents();
        this._super('preRender');
    },

    context: function() {
        return this.presenter;
    },

    setupSubviews: function() {
        this.commentList = this.commentList || new chorus.views.CommentList({ collection: this.model.comments() });

        if(!this.htmlContent) {
            if(this.model.isUserGenerated()) {
                this.htmlContent = new chorus.views.TruncatedText({model: this.model, attribute: 'body', attributeIsHtmlSafe: true, unexpandable: this.options.unexpandable});
            }
            if(this.model.hasCommitMessage()) {
                this.htmlContent = new chorus.views.TruncatedText({model: this.model, attribute: 'commitMessage', attributeIsHtmlSafe: true, unexpandable: this.options.unexpandable});
            }
        }
        this.failureContent = this.failureContent || new chorus.views.ErrorDetails({model: this.model});
    },

    promote: function(e) {
        e.preventDefault();
        this.model.promoteToInsight({
            success: _.bind(function() {
                chorus.PageEvents.trigger('insight:promoted', this.model);
            }, this)
        });
    },

    demote: function(e) {
        e.preventDefault();
        this.model.demoteFromInsight();
    },

    publish: function(e) {
        e.preventDefault();
        var alert = new chorus.alerts.PublishInsight({model: this.model, publish: true});
        alert.launchModal();
    },

    unpublish: function(e) {
        e.preventDefault();
        var alert = new chorus.alerts.PublishInsight({model: this.model, publish: false});
        alert.launchModal();
    },

    launchUpdateCredentialsDialog: function(e) {
        e.preventDefault();
        new chorus.dialogs.DataSourceAccount({ dataSource: this.model.dataSource(), title: t("data_sources.account.edit.title") }).launchModal();
    },

    launchDeleteNoteConfirmAlert: function(e) {
        e.preventDefault();
        var alert = new chorus.alerts.DeleteNoteConfirmAlert({activity: this.model});
        alert.launchModal();
    },

    launchNotificationDeleteAlert: function(e) {
        e.preventDefault();
        var alert = new chorus.alerts.NotificationDeleteAlert({activity: this.model});
        alert.launchModal();
    },

    launchEditNoteDialog: function(e) {
        e.preventDefault();
        var dialog = new chorus.dialogs.EditNote({activity: this.model});
        dialog.launchModal();
    },

    launchCommentDialog: function(e) {
        e.preventDefault();
        var dialog = new chorus.dialogs.Comment({pageModel: this.model, eventId: this.model.id});
        dialog.launchModal();
    },

    launchImageDialog: function(e) {
        e.preventDefault();
        var dialog = new chorus.dialogs.ShowImage({activity: this.model, originalModule: this.parentView.parentView});
        dialog.launchModal();
    },

    launchAttachmentImageDialog: function(e) {
        e.preventDefault();
        var attachment;
        var thisLink = e.srcElement.src;
        for(var x = 0; x < this.model.attachments().length; x++) {
            if(thisLink.indexOf(this.model.attachments()[x].iconUrl()) > -1) {
                attachment = this.model.attachments()[x];
            }
        }
        var dialog = new chorus.dialogs.ShowImage({activity: this.model, originalModule: this.parentView.parentView, attachment: attachment});
        dialog.launchModal();
    },

    postRender: function() {
        $(this.el).attr('data-activity-id', this.model.get('errorModelId') || this.model.get('id'));
        this.$('a.delete_link, a.edit_link').data('activity', this.model);
        if(this.model.get('isInsight')) {
            $(this.el).addClass('insight');
        }
    },

    show: function() {
        this.htmlContent && this.htmlContent.show();
    }
});
