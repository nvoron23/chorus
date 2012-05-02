chorus.models.InstanceAccount = chorus.models.Base.extend(
    {
        constructorName: "InstanceAccount",
        parameterWrapper: "account",

        urlTemplate:function (options) {
            var method = options && options.method;
            if (method === "update" || method === "delete") {
                return "instances/{{instance_id}}/accounts/{{id}}";
            } else {
                return "instances/{{instance_id}}/accounts";
            }
        },

        urlParams:function (options) {
            if (options && options.method === "read") {
                var params = { instanceId:this.get("instanceId") };
                if (this.get("userId")) {
                    params["user_id"] = this.get("userId")
                }
                return params;
            } else {
                return {};
            }
        },

        user:function () {
            return this.get("user") && new chorus.models.User(this.get('user'));
        },

        declareValidations:function (newAttrs) {
            var shared = newAttrs && newAttrs.hasOwnProperty("shared") ? newAttrs["shared"] : this.get("shared");

            if (shared === this.previous("shared")) {
                this.require('db_username', newAttrs);
            }

            if (this.isNew() || (newAttrs && newAttrs.hasOwnProperty('db_password'))) {
                this.require('db_password', newAttrs);
            }
        },

        attrToLabel:{
            "db_username":"instances.permissions.username",
            "db_password":"instances.permissions.password"
        }
    },
    {
        findByInstanceId:function (instanceId) {
            var account = new chorus.models.InstanceAccount({ instance_id:instanceId });
            account.fetch();
            return account;
        }
    });
