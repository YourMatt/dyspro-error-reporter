/***********************************************************************************************************************
 *
 * DATABASE INTERACTION FOR ACCOUNTS
 *
 **********************************************************************************************************************/
const db = require("../databaseaccessor"),
    models = require("../models/all");

// Loads a single account.
// callback(models.Account: Account details)
exports.get = function(accountId, callback) {

    db.selectSingle(
        {
            sql:
            "SELECT     AccountId, Name, ApiKey, CreateDate " +
            "FROM       Accounts " +
            "WHERE      AccountId = ? ",
            values: [
                accountId
            ]
        },
        function (a) {
            if (!a) return callback(new models.Account());

            let account = new models.Account(
                a.Name,
                a.ApiKey,
                a.CreateDate,
                a.AccountId
            );
            callback(account);

        }
    );

};

// Load a single account by its API key.
// callback(models.Account: Account data)
exports.getByApiKey = function (userName, apiKey, callback) {

    db.selectSingle(
        {
            sql:
            "SELECT     AccountId, Name, ApiKey, CreateDate " +
            "FROM       Accounts " +
            "WHERE      Name = ? " +
            "AND        ApiKey = ? ",
            values: [
                userName,
                apiKey
            ]
        },
        function (a) {
            if (!a) return callback(new models.Account());

            let account = new models.Account(
                a.Name,
                a.ApiKey,
                a.CreateDate,
                a.AccountId
            );
            callback(account);

        }
    );

};

// Loads all.
// callback(array: List of model.User)
exports.getAll = function(callback) {

    db.selectMultiple(
        {
            sql:
            "SELECT     AccountId, Name, ApiKey, CreateDate " +
            "FROM       Accounts " +
            "ORDER BY   Name ASC "
        },
        function (a) {
            if (!a) return callback([]);

            let accounts = [];
            for (let i = 0; i < a.length; i++) {
                accounts.push(new models.Account(
                    a[i].Name,
                    a[i].ApiKey,
                    a[i].CreateDate,
                    a[i].AccountId
                ));
            }
            callback(accounts);

        }
    );

};

// Finds all environments that have been used within the account.
// callback(array: List of environment strings)
exports.getEnvironments = function (accountId, callback) {

    // TODO: Move these into a separate table which will allow for faster lookups and ability for user sorts

    db.selectMultiple(
        {
            sql:
            "SELECT     DISTINCT eo.Environment " +
            "FROM       Errors e " +
            "INNER JOIN ErrorOccurrences eo ON eo.ErrorId = e.ErrorId " +
            "WHERE      e.AccountId = ? " +
            "UNION " +
            "SELECT     DISTINCT Environment " +
            "FROM       Monitors " +
            "WHERE      AccountId = ? ",
            values: [
                accountId,
                accountId
            ]
        },
        function (result) {
            let environments = [];
            for (let i = 0; i < result.length; i++) {
                environments.push(result[i].Environment);
            }
            callback(environments);
        }
    );

};

// Creates a new record.
// callback(int: Account ID)
exports.create = function(account, callback) {

    db.insert(
        {
            sql:
            "INSERT INTO    Accounts " +
            "(              Name, ApiKey, CreateDate) " +
            "VALUES (       ?, ?, NOW()) ",
            values: [
                account.name,
                account.apiKey]
        },
        callback
    );

};

// Updates a record.
// callback(int: Number of affected rows)
exports.update = function(account, callback) {

    db.update(
        {
            sql:
            "UPDATE Accounts " +
            "SET    Name = ?, ApiKey = ? " +
            "WHERE  AccountId = ? ",
            values: [
                account.name,
                account.apiKey
            ]
        },
        callback
    );

};

// Deletes a record.
// callback(int: Number of affected rows)
exports.delete = function(accountId, callback) {

    db.delete(
        {
            sql:
            "DELETE FROM    Accounts " +
            "WHERE          AccountId = ? ",
            values: [
                accountId
            ]
        },
        callback
    );

};
