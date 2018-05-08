/***********************************************************************************************************************
 *
 * DATABASE INTERACTION FOR USERS
 *
 **********************************************************************************************************************/
var db = require("../databaseaccessor"),
    models = require("../models/all");

// Loads a single user.
// callback(models.User: User details)
exports.get = function(userId, callback) {

    db.selectSingle(
        {
            sql:
            "SELECT     UserId, AccountId, Name, Email, Phone, CreateDate " +
            "FROM       Users " +
            "WHERE      UserId = ? ",
            values: [
                userId
            ]
        },
        function (u) {
            if (!u) return callback();

            let user = new models.User(
                u.AccountId,
                u.Name,
                u.Email,
                u.Phone,
                "", // do not load password hash
                u.CreateDate,
                u.UserId
            );
            callback(user);

        }
    );

};

// Loads a single user by email and password.
// callback(models.User: User data)
exports.getByLogin = function (email, password, callback) {

    db.selectSingle(
        {
            sql:
            "SELECT     UserId, AccountId, Name, Email, Phone, CreateDate " +
            "FROM       Users " +
            "WHERE      Email = ? " +
            "AND        Password = MD5(?) ",
            values: [
                email,
                password
            ]
        },
        function (u) {
            if (!u) return callback();

            let user = new models.User(
                u.AccountId,
                u.Name,
                u.Email,
                u.Phone,
                "", // do not load password hash
                u.CreateDate,
                u.UserId
            );
            callback(user);

        }
    );

};

// Loads all for an account.
// callback(array: List of model.User)
exports.getAllByAccountId = function(accountId, callback) {

    db.selectMultiple(
        {
            sql:
            "SELECT     UserId, AccountId, Name, Email, Phone, CreateDate " +
            "FROM       Users " +
            "WHERE      AccountId = ? " +
            "ORDER BY   Name ASC ",
            values: [
                accountId
            ]
        },
        function (u) {
            if (!u) return callback();

            let users = [];
            for (let i = 0; i < u.length; i++) {
                users.push(new models.User(
                    u[i].AccountId,
                    u[i].Name,
                    u[i].Email,
                    u[i].Phone,
                    "", // do not load password hash
                    u[i].CreateDate,
                    u[i].UserId
                ));
            }
            callback(users);

        }
    );

};

// Creates a new record.
// callback(int: User ID)
exports.create = function(user, callback) {

    db.insert(
        {
            sql:
            "INSERT INTO    Users " +
            "(              AccountId, Name, Email, Phone, Password, CreateDate) " +
            "VALUES (       ?, ?, ?, ?, MD5(?), NOW()) ",
            values: [
                user.accountId,
                user.name,
                user.email,
                user.phone,
                user.password
            ]
        },
        callback
    );

};

// Updates a record.
// callback(int: Number of affected rows)
exports.update = function(user, callback) {

    db.update(
        {
            sql:
            "UPDATE Users " +
            "SET    AccountId = ?, Name = ?, Email = ?, Phone = ? " +
            "WHERE  UserId = ? ",
            values: [
                user.accountId,
                user.name,
                user.email,
                user.phone,
                user.userId
            ]
        },
        function (numUpdated) {
            if (!numUpdated) return callback();

            // return if a password update is not requested
            if (!user.password) return callback(numUpdated);

            db.update({
                    sql:
                    "UPDATE Users " +
                    "SET    Password = MD5(?) " +
                    "WHERE  UserId = ? ",
                    values: [
                        user.password,
                        user.userId
                    ]
                },
                callback
            );

        }
    );

};

// Deletes a record.
// callback(int: Number of affected rows)
exports.delete = function(userId, callback) {

    db.delete(
        {
            sql:
            "DELETE FROM    Users " +
            "WHERE          UserId = ? ",
            values: [
                userId
            ]
        },
        callback
    );

};
