/***********************************************************************************************************************
 *
 * DATABASE INTERACTION FOR ENVIRONMENTS
 *
 **********************************************************************************************************************/
const models = require("../models/all");

// Loads a single environment.
// callback(models.Environment: Environment details)
exports.get = function(db, environmentId, callback) {

    db.selectSingle(
        {
            sql:
            "SELECT     EnvironmentId, AccountId, Name, Sequence, CreateDate " +
            "FROM       Environments " +
            "WHERE      EnvironmentId = ? ",
            values: [
                environmentId
            ]
        },
        function (e) {
            if (!e) return callback(new models.Environment);

            let environment = new models.Environment(
                e.AccountId,
                e.Name,
                e.Sequence,
                e.CreateDate,
                e.EnvironmentId
            );
            callback(environment);

        }
    );

};

// Loads a single environment by name.
// callback(models.Environment: Environment details)
exports.getByName = function(db, accountId, name, callback) {

    db.selectSingle(
        {
            sql:
            "SELECT     EnvironmentId, AccountId, Name, Sequence, CreateDate " +
            "FROM       Environments " +
            "WHERE      AccountId = ? " +
            "AND        Name = ? ",
            values: [
                accountId,
                name
            ]
        },
        function (e) {
            if (!e) return callback(new models.Environment);

            let environment = new models.Environment(
                e.AccountId,
                e.Name,
                e.Sequence,
                e.CreateDate,
                e.EnvironmentId
            );
            callback(environment);

        }
    );

};

// Loads the next unused sequence number.
// callback(int: New sequence number)
exports.getNextSequence = function(db, accountId, callback) {

    db.selectSingle(
        {
            sql:
            "SELECT     IFNULL(MAX(Sequence), 0) + 1 AS NewSequence " +
            "FROM       Environments " +
            "WHERE      AccountId = ? ",
            values: [
                accountId
            ]
        },
        function (s) {
            if (!s) return callback(0);

            callback(s.NewSequence);

        }
    );

};

// Loads all for an account.
// callback(array: List of model.Environment)
exports.getAllByAccountId = function(db, accountId, callback) {

    db.selectMultiple(
        {
            sql:
            "SELECT     EnvironmentId, AccountId, Name, Sequence, CreateDate " +
            "FROM       Environments " +
            "WHERE      AccountId = ? " +
            "ORDER BY   Sequence ASC ",
            values: [
                accountId
            ]
        },
        function (e) {
            if (!e) return callback([]);

            let environments = [];
            for (let i = 0; i < e.length; i++) {
                environments.push(new models.Environment(
                    e[i].AccountId,
                    e[i].Name,
                    e[i].Sequence,
                    e[i].CreateDate,
                    e[i].EnvironmentId
                ));
            }
            callback(environments);

        }
    );

};

// Creates a new record.
// callback(int: Environment ID)
exports.create = function(db, environment, callback) {

    // find the next sequence
    exports.getNextSequence(
        db,
        environment.accountId,
        function(sequence) {
            if (!sequence) return callback(0);
            environment.sequence = sequence;

            db.insert(
                {
                    sql:
                    "INSERT INTO    Environments " +
                    "(              AccountId, Name, Sequence, CreateDate) " +
                    "VALUES (       ?, ?, ?, NOW()) ",
                    values: [
                        environment.accountId,
                        environment.name,
                        environment.sequence
                    ]
                },
                callback
            );

        }
    );

};

// Updates a record.
// callback(int: Number of affected rows)
exports.update = function(db, environment, callback) {

    db.update(
        {
            sql:
            "UPDATE Environments " +
            "SET    AccountId = ?, Name = ?, Sequence = ? " +
            "WHERE  EnvironmentId = ? ",
            values: [
                environment.accountId,
                environment.name,
                environment.sequence,
                environment.environmentId
            ]
        },
        callback
    );

};

// Deletes a record.
// callback(int: Number of affected rows)
exports.delete = function(db, environmentId, callback) {

    db.delete(
        {
            sql:
            "DELETE FROM    Environments " +
            "WHERE          EnvironmentId = ? ",
            values: [
                environmentId
            ]
        },
        callback
    );

};
