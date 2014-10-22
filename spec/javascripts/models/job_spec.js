describe("chorus.models.Job", function () {
    beforeEach(function () {
        this.model = backboneFixtures.job();
    });

    describe("runsOnDemand", function () {
        context("when the model's interval unit is 'on demand'", function () {
            beforeEach(function () {
                this.model.set('intervalUnit', 'on_demand');
            });
            it("return true", function () {
                expect(this.model.runsOnDemand()).toBeTruthy();
            });
        });
        context("when the model's interval unit is a unit of time", function () {
            beforeEach(function () {
                this.model.set('intervalUnit', 'hours');
            });
            it("return true", function () {
                expect(this.model.runsOnDemand()).toBeFalsy();
            });
        });
    });

    describe("disable", function () {
        beforeEach(function () {
            spyOn(this.model, "save");
        });
        it("makes a request to disable the job", function () {
            this.model.disable();
            expect(this.model.save).toHaveBeenCalledWith({ enabled: false }, { wait: true });
        });
    });

    describe("enable", function () {
        beforeEach(function () {
            spyOn(this.model, "save");
        });
        it("makes a request to enable the job", function () {
            this.model.enable();
            expect(this.model.save).toHaveBeenCalledWith({ enabled: true }, { wait: true });
        });
    });

    describe("#toggleEnabled", function () {
        beforeEach(function () {
            spyOn(this.model, 'enable');
            spyOn(this.model, 'disable');
        });

        context("when enabled", function () {
            beforeEach(function () {
                this.model.set("enabled", true);
                this.model.toggleEnabled();
            });

            it("disables", function () {
                expect(this.model.disable).toHaveBeenCalled();
            });
        });

        context("when disabled", function () {
            beforeEach(function () {
                this.model.set("enabled", false);
                this.model.toggleEnabled();
            });

            it("enables", function () {
                expect(this.model.enable).toHaveBeenCalled();
            });
        });
    });

    describe("#ableToRun", function () {
        context("when there are no tasks", function () {
            beforeEach(function() {
                this.model.set('tasks', []);
            });

            it("is never true", function () {
                var res =_.filter(['enqueued', 'running', 'stopping', 'idle'], function(status) {
                    this.model.set('status', status);
                    return this.model.ableToRun();
                }, this);
                expect(res).toEqual([]);
            });
        });

        context("when there are tasks", function () {
            it("is true iff status is idle", function () {
                var res =_.filter(['enqueued', 'running', 'stopping', 'idle'], function(status) {
                    this.model.set('status', status);
                    return this.model.ableToRun();
                }, this);
                expect(res).toEqual(['idle']);
            });
        });

    });

    describe("#isRunning", function () {
        it("is true iff status is running or enqueued", function () {
            var res =_.filter(['enqueued', 'running', 'stopping', 'idle'], function(status) {
                this.model.set('status', status);
                return this.model.isRunning();
            }, this);
            expect(res).toEqual(['enqueued', 'running']);
        });
    });

    describe("tasks", function () {
        it("are not memoized", function () {
            expect(this.model.tasks().models.length).toBeGreaterThan(0);
            this.model.fetch();
            this.server.completeFetchFor(this.model, {tasks: []});
            expect(this.model.tasks().models).toEqual([]);
        });
    });

    describe("nextRunDate", function () {
        beforeEach(function () {
            this.model = new chorus.models.Job();
        });

        it("defaults to an hour from creation", function () {
            expect(this.model.nextRunDate().format()).toEqual(moment().add(1, 'hour').format());
        });
    });

    describe("run", function () {
        beforeEach(function () {
            spyOn(chorus, 'toast');
            this.model.run();
        });

        it("saves", function () {
            var postUrl = this.server.lastCreate().url;
            expect(postUrl).toBe('/jobs/' + this.model.id + '/run');
        });


        it("does not toast without success", function () {
            expect(chorus.toast).not.toHaveBeenCalled();
        });


        context("when the save succeeds", function () {
            beforeEach(function () {
                this.server.lastCreate().succeed();
            });

            it("flashes a toast message", function () {
                expect(chorus.toast).toHaveBeenCalledWith('job.running_toast', {jobName: this.model.name()});
            });
        });

        context("when the run is unprocessable", function() {
            it("flashes an error toast message", function () {
                this.server.lastCreate().failUnprocessableEntity();
                expect(chorus.toast).toHaveBeenCalledWith('job.not_running_toast', {jobName: this.model.name(), toastOpts: {type: 'error'}});
            });

            it("includes server errors if present", function() {
                this.server.lastCreate().failUnprocessableEntity({fields: { owner: { BLANK: {}, JOB_OWNER_MEMBERSHIP_REQUIRED: {} } } });
                expect(chorus.toast).toHaveBeenCalledWith('job.not_running_toast', {jobName: this.model.name(), toastOpts: {type: 'error'}});
                expect(chorus.toast).toHaveBeenCalledWith(this.model.serverErrorMessage(), jasmine.objectContaining({ skipTranslation: true }));
            });
        });
    });

    describe("stop", function () {
        beforeEach(function () {
            spyOn(chorus, 'toast');
            this.model.stop();
        });

        it("saves", function () {
            var postUrl = this.server.lastCreate().url;
            expect(postUrl).toContain('/jobs/' + this.model.id + '/stop');
        });

        it("does not toast without success", function () {
            expect(chorus.toast).not.toHaveBeenCalled();
        });

        context("when the save succeeds", function () {
            beforeEach(function () {
                this.server.lastCreate().succeed();
            });

            it("flashes a toast message", function () {
                expect(chorus.toast).toHaveBeenCalledWith('job.stopping_toast', {jobName: this.model.name()});
            });
        });
    });
});
