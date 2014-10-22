describe("chorus.Mixins.ServerErrors", function() {
    var HostModel;

    beforeEach(function() {
        HostModel = chorus.models.Base.include(chorus.Mixins.ServerErrors);
    });

    describe("#serverErrorMessages", function() {
        context("when the model has serverErrors", function() {
            beforeEach(function() {
                this.host = new HostModel({});
            });

            it("returns a default error message", function() {
                this.host.serverErrors = {fields: {a: {BLANK: {}}}};
                expect(_.first(this.host.serverErrorMessages())).toBe("A can't be blank");
            });

            it("returns a custom error message", function() {
                this.host.serverErrors = {fields: {workspaces: {EMPTY: {}}}};
                expect(_.first(this.host.serverErrorMessages())).toMatchTranslation('field_error.workspaces.EMPTY');
            });

            it("interpolates extra arguments", function() {
                this.host.serverErrors = {fields: {a: {EQUAL_TO: {count: 5}}}};
                expect(_.first(this.host.serverErrorMessages())).toBe("A must be equal to 5");
            });

            it("catches errors that are not directly on model fields", function() {
                this.host.serverErrors = {"record": "NOT_FOUND"};
                expect(_.first(this.host.serverErrorMessages())).toMatchTranslation('record_error.NOT_FOUND');
            });

            it("includes fields on server errors", function() {
                this.host.serverErrors = {"record": "DATA_SOURCE_DRIVER_NOT_CONFIGURED", data_source: "Oracle"};
                expect(_.first(this.host.serverErrorMessages())).toBe("Unable to connect to the Oracle data source. Please make sure the Oracle driver is configured correctly.");
            });

            it("catches errors for external services", function() {
                this.host.serverErrors = {"service": "SOLR_UNREACHABLE"};
                expect(_.first(this.host.serverErrorMessages())).toMatchTranslation("service_error.SOLR_UNREACHABLE");
            });

            it("returns error messages without translation", function() {
                var errorMessage = "THIS IS AN ERROR";
                this.host.serverErrors = {"message": errorMessage};
                expect(_.first(this.host.serverErrorMessages())).toBe(errorMessage);
            });
        });

        context("when the model does not have serverErrors", function() {
            beforeEach(function() {
                this.host = new HostModel();
            });

            it("returns false", function() {
                expect(this.host.serverErrorMessages()).toEqual([]);
            });
        });
    });

    describe("#serverErrorMessage", function() {
        it("joins all the server error messages", function() {
            this.host = new HostModel({});
            this.host.serverErrors = {fields: {first: {GENERIC: {message: "fail"}}, second: {GENERIC: {message: "oops"}}}};

            expect(this.host.serverErrorMessage()).toBe("fail\noops");
        });
    });
});

