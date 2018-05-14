/***********************************************************************************************************************
 *
 * DATABASE INTERACTION FOR PRODUCTS
 *
 **********************************************************************************************************************/
var db = require("../databaseaccessor"),
    models = require("../models/all");

// Loads a single product.
// callback(models.Product: Product details)
exports.get = function(productId, callback) {

    db.selectSingle(
        {
            sql:
            "SELECT     ProductId, AccountId, Name, Sequence, CreateDate " +
            "FROM       Products " +
            "WHERE      ProductId = ? ",
            values: [
                productId
            ]
        },
        function (p) {
            if (!p) return callback(new models.Product);

            let product = new models.Product(
                p.AccountId,
                p.Name,
                p.Sequence,
                p.CreateDate,
                p.ProductId
            );
            callback(product);

        }
    );

};

// Loads a single product by name.
// callback(models.Product: Product details)
exports.getByName = function(accountId, name, callback) {

    db.selectSingle(
        {
            sql:
            "SELECT     ProductId, AccountId, Name, Sequence, CreateDate " +
            "FROM       Products " +
            "WHERE      AccountId = ? " +
            "AND        Name = ? ",
            values: [
                accountId,
                name
            ]
        },
        function (p) {
            if (!p) return callback(new models.Product);

            let product = new models.Product(
                p.AccountId,
                p.Name,
                p.Sequence,
                p.CreateDate,
                p.ProductId
            );
            callback(product);

        }
    );

};

// Loads the next unused sequence number.
// callback(int: New sequence number)
exports.getNextSequence = function(accountId, callback) {

    db.selectSingle(
        {
            sql:
            "SELECT     IFNULL(MAX(Sequence), 0) + 1 AS NewSequence " +
            "FROM       Products " +
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
// callback(array: List of model.Product)
exports.getAllByAccountId = function(accountId, callback) {

    db.selectMultiple(
        {
            sql:
            "SELECT     ProductId, AccountId, Name, Sequence, CreateDate " +
            "FROM       Product " +
            "WHERE      AccountId = ? " +
            "ORDER BY   Sequence ASC ",
            values: [
                accountId
            ]
        },
        function (p) {
            if (!p) return callback([]);

            let products = [];
            for (let i = 0; i < p.length; i++) {
                products.push(new models.Product(
                    p[i].AccountId,
                    p[i].Name,
                    p[i].Sequence,
                    p[i].CreateDate,
                    p[i].ProductId
                ));
            }
            callback(products);

        }
    );

};

// Creates a new record.
// callback(int: Product ID)
exports.create = function(product, callback) {

    // find the next sequence
    exports.getNextSequence(
        product.accountId,
        function(sequence) {
            product.sequence = sequence;

            db.insert(
                {
                    sql:
                    "INSERT INTO    Products " +
                    "(              AccountId, Name, Sequence, CreateDate) " +
                    "VALUES (       ?, ?, ?, NOW()) ",
                    values: [
                        product.accountId,
                        product.name,
                        product.sequence
                    ]
                },
                callback
            );

        }
    );

};

// Updates a record.
// callback(int: Number of affected rows)
exports.update = function(product, callback) {

    db.update(
        {
            sql:
            "UPDATE Products " +
            "SET    AccountId = ?, Name = ?, Sequence = ? " +
            "WHERE  ProductId = ? ",
            values: [
                product.accountId,
                product.name,
                product.sequence,
                product.productId
            ]
        },
        callback
    );

};

// Deletes a record.
// callback(int: Number of affected rows)
exports.delete = function(productId, callback) {

    db.delete(
        {
            sql:
            "DELETE FROM    Products " +
            "WHERE          ProductId = ? ",
            values: [
                productId
            ]
        },
        callback
    );

};
