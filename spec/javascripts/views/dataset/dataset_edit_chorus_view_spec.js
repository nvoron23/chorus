describe("chorus.views.DatasetEditChorusView", function() {
    beforeEach(function() {

        this.dataset = backboneFixtures.workspaceDataset.chorusView();
        this.view = new chorus.views.DatasetEditChorusView({ model: this.dataset });
        $("#jasmine_content").append(this.view.el);
        this.clock = this.useFakeTimers();

        // in IE8, we can't 'select' a textrange whose textarea is not on the DOM
//         if ($.browser.msie) {
//             spyOn(window.TextRange.prototype, 'select');
//         }

        var originalFromTextArea = CodeMirror.fromTextArea;
        spyOn(CodeMirror, "fromTextArea").andCallFake(_.bind(function(textarea, opts) {
            this.codeMirrorOptions = opts;
            return originalFromTextArea(textarea, opts);
        }, this));
    });

    context("#setup", function() {
        it("saves the initial query value", function() {
            expect(this.view.model.initialQuery).toBe(this.view.model.get("query"));
        });
    });

    describe("#render", function() {
        beforeEach(function() {
            this.view.render();
        });

        it("displays the query", function() {
            expect(this.view.editor.getValue()).toBe(this.dataset.get("query"));
        });

        it("displays line numbers", function() {
            expect(this.view.editor.getOption("lineNumbers")).toBe(true);
        });

        it("displays the query", function() {
            expect(this.view.editor.getValue()).toBe(this.dataset.get("query"));
        });

        it("uses the 'text/x-plsql' mode", function() {
            expect(this.view.editor.getOption("mode")).toBe("text/x-plsql");
        });

        it("provides CodeMirror with an onBlur function", function() {
            expect(this.codeMirrorOptions.onBlur).toBeDefined();
        });

        context("when blur is received by the editor", function() {
            beforeEach(function() {
                spyOn(this.view, "postRender");
                this.view.editor.setValue("select * from hello;");
                this.codeMirrorOptions.onBlur();
            });

            it("sets the query in the model", function() {
                expect(this.view.model.get("query")).toBe("select * from hello;");
            });

            it("does not re-render", function() {
                expect(this.view.postRender).not.toHaveBeenCalled();
            });
        });
    });

    describe("#saveChanges", function() {
        beforeEach(function() {
            chorus.page = new chorus.pages.Base();
            this.view.render();
            spyOn(chorus.router, "navigate");
            this.view.editor.setValue("select * from table_abc");
            spyOn(this.view.model, "save");
            chorus.PageEvents.trigger("dataset:saveEdit");
            this.clock.tick(1000);

        });
        context("when save succeed", function() {
            beforeEach(function() {
                this.view.model.trigger("saved");
            });
            it("saves the model with silent:true (otherwise the page will re-render)", function() {
                expect(this.view.model.save).toHaveBeenCalledWith(undefined, {silent: true});
            });

            it("sets the query in the model", function() {
                expect(this.view.model.get("query")).toBe("select * from table_abc");
            });

            it("should return the user to the standard page view", function() {
                expect(chorus.router.navigate).toHaveBeenCalledWith(this.view.model.showUrl());
            });
        });

        context("when save fails", function() {
            beforeEach(function() {
                this.view.model.set({serverErrors: { fields: { a: { BLANK: {} } } }});
                this.view.model.trigger("saveFailed");
                this.view.render();
            });
            it("displays the error message", function() {
                expect(this.view.$(".errors ul li").text()).toBe("A can't be blank");
            });
        });
    });

    describe("cancel", function() {
        beforeEach(function() {
            this.view.model.serverErrors = {fields: {a: {BLANK: {}}}};
            chorus.PageEvents.trigger("dataset:cancelEdit");
        });

        it("clears the errors", function() {
            expect(this.view.model.serverErrors).toBeUndefined();
        });
    });
});
