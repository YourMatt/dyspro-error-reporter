/***********************************************************************************************************************
 *
 * DATABASE INTERACTION FOR ACCOUNTS
 *
 **********************************************************************************************************************/
const models = require("../models/all");

// Loads a single account.
// callback(models.Account: Account details)
exports.get = function(db, accountId, callback) {

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
exports.getByApiKey = function (db, userName, apiKey, callback) {

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
exports.getAll = function(db, callback) {

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

// Creates a new record.
// callback(int: Account ID)
exports.create = function(db, account, callback) {

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
exports.update = function(db, account, callback) {

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
exports.delete = function(db, accountId, callback) {

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
