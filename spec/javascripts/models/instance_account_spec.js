describe("chorus.models.InstanceAccount", function() {
    beforeEach(function() {
        this.model = fixtures.instanceAccount({ id: '72', instance_id: '1045', userId: "1011" });
    });

    it("wraps parameters in 'credentials'", function() {
        expect(this.model.parameterWrapper).toBe("account")
    });

    describe("#url", function() {
        context("when updating or deleting", function() {
            it("has the right url for accessing an account by its id", function() {
                expect(this.model.url({ method: 'update' })).toMatchUrl("/instances/1045/accounts/72");
                expect(this.model.url({ method: 'delete' })).toMatchUrl("/instances/1045/accounts/72");
            });
        });

        context("when creating", function() {
            it("has the base url for accounts (no id)", function() {
                expect(this.model.url({ method: 'create' })).toMatchUrl("/instances/1045/accounts");
            });
        });

        context("when fetching", function() {
            it("has the right url for fetching an account by user id and instance id", function() {
                expect(this.model.url({ method: 'read' })).toMatchUrl("/instances/1045/accounts?user_id=1011");
            });
        });
    });

    describe("#user", function() {
        beforeEach(function() {
            this.model.set({"user": {
                first_name: "Ricardo",
                last_name: "Henderson",
                id: "45",
                userId: "45"
            }})
        });

        it("returns a user", function() {
            expect(this.model.user()).toBeA(chorus.models.User);
        });

        it("sets the name and id fields based on the account's information", function() {
            expect(this.model.user().get("first_name")).toBe("Ricardo");
            expect(this.model.user().get("last_name")).toBe("Henderson");
            expect(this.model.user().get("id")).toBe("45");
            expect(this.model.user().get("userId")).toBe("45");
        });

        context("when the account doesn't have a user", function() {
            beforeEach(function() {
                this.model.unset("user");
            });

            it("returns undefined", function() {
                expect(this.model.user()).toBeUndefined();
            });
        });
    });

    describe("#fetchByInstanceId", function() {
        it("hits the correct url", function() {
            chorus.models.InstanceAccount.findByInstanceId("4");
            expect(this.server.requests[0].url).toMatchUrl("/instances/4/accounts")
        })

        it("returns an InstanceAccount", function() {
            var model = chorus.models.InstanceAccount.findByInstanceId("4");
            expect(model instanceof chorus.models.InstanceAccount).toBeTruthy()
        })
    })

    describe("validations", function() {
        beforeEach(function() {
            spyOn(this.model, "require").andCallThrough();
        });

        it("requires db_username", function() {
            this.model.unset("db_username");
            this.model.performValidation();
            expect(this.model.require).toHaveBeenCalledWith("db_username", undefined);
        });

        context("when the account already exists and the password is NOT being changed", function() {
            it("does not require a db_password", function() {
                this.model.unset("db_password");
                this.model.performValidation();
                expect(this.model.isValid()).toBeTruthy();
            });
        });

        context("when the account is being created", function() {
            it("requires a db_password", function() {
                this.model = new chorus.models.InstanceAccount({ db_username: "ilikecoffee" });
                this.model.performValidation();
                expect(this.model.isValid()).toBeFalsy();
            });
        });

        context("when the account already exists and the password is being changed", function() {
            it("requires a db_password", function() {
                this.model.performValidation({ db_password: "" });
                expect(this.model.isValid()).toBeFalsy();
            });
        });

        context("when the instance account is a shared account", function() {
            beforeEach(function() {
                this.model = fixtures.instanceAccount({ shared : "yes" })
            });

            describe("and it is changed to an individual account", function() {
                beforeEach(function() {
                    this.model.unset("db_username");
                })

                it("does not require db_username", function() {
                    this.model.performValidation({ shared : "no" })
                    expect(this.model.isValid()).toBeTruthy();
                })
            })
        })
    })
});
