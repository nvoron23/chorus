describe("chorus.collections.DatabaseObjectSet", function() {
    beforeEach(function() {
        this.collection = new chorus.collections.DatabaseObjectSet([], {
            instanceId: '10000', databaseName:"some_database", schemaName: "some_schema"
        });
    });

    it("includes the InstanceCredentials mixin", function() {
        expect(this.collection.instanceRequiringCredentials).toBe(chorus.Mixins.InstanceCredentials.model.instanceRequiringCredentials);
    });

    describe("#url", function() {
        it("is correct", function() {
            expect(this.collection.url({ rows: 10, page: 1})).toMatchUrl("/edc/data/10000/database/some_database/schema/some_schema?rows=10&page=1&type=meta");
        });

        context("when the url needs to be encoded", function() {
            beforeEach(function() {
                this.collection = new chorus.collections.DatabaseObjectSet([], {
                    instanceId: '10000', databaseName: "some%database", schemaName: "some schema"
                });
            });

            it("should encode the url", function() {
                expect(this.collection.url()).toContain("/edc/data/10000/database/some%25database/schema/some%20schema");
            });
        });
    });

    describe("#parse", function() {
        beforeEach(function() {
            this.collection.fetch();
            this.server.lastFetchFor(this.collection).succeed([
                { objectName: "brian_the_table" },
                { objectName: "rand_the_table" }
            ]);
        });

        it("sets the instance id, databaseName, and schemaName from the collection on each model", function() {
            expect(this.collection.at(0).get("instance").id).toBe("10000");
            expect(this.collection.at(0).get("databaseName")).toBe("some_database");
            expect(this.collection.at(0).get("schemaName")).toBe("some_schema");

            expect(this.collection.at(1).get("instance").id).toBe("10000");
            expect(this.collection.at(1).get("databaseName")).toBe("some_database");
            expect(this.collection.at(1).get("schemaName")).toBe("some_schema");
        });
    });
});
