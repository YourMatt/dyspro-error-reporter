/***********************************************************************************************************************
 *
 * DATABASE INTERACTION FOR MONITORS
 *
 **********************************************************************************************************************/
const db = require("../databaseaccessor"),
    models = require("../models/all");

// Loads a single monitor.
// callback(models.Monitor: Monitor details)
exports.get = function(monitorId, callback) {

    db.selectSingle(
        {
            sql:
            "SELECT     MonitorId, AccountId, ProductId, EnvironmentId, EndpointUri, IntervalSeconds " +
            "FROM       Monitors " +
            "WHERE      MonitorId = ? ",
            values: [
                monitorId
            ]
        },
        function (m) {
            if (!m) return callback(new models.Monitor);

            let monitor = new models.Monitor(
                m.AccountId,
                m.ProductId,
                m.EnvironmentId,
                m.EndpointUri,
                m.IntervalSeconds,
                m.MonitorId
            );
            callback(monitor);

        }
    );

};

// Loads all for an account.
// callback(array: List of model.Monitor)
exports.getAllByAccountId = function(accountId, callback) {

    db.selectMultiple(
        {
            sql:
            "SELECT     MonitorId, AccountId, ProductId, EnvironmentId, EndpointUri, IntervalSeconds " +
            "FROM       Monitors " +
            "WHERE      AccountId = ? " +
            "ORDER BY   MonitorId ASC ",
            values: [
                accountId
            ]
        },
        function (m) {
            if (!m) return callback([]);

            let monitors = [];
            for (let i = 0; i < m.length; i++) {
                monitors.push(new models.Monitor(
                    m[i].AccountId,
                    m[i].ProductId,
                    m[i].EnvironmentId,
                    m[i].EndpointUri,
                    m[i].IntervalSeconds,
                    m[i].MonitorId
                ));
            }
            callback(monitors);

        }
    );

};

// Creates a new record.
// callback(int: Monitor ID)
exports.create = function(monitor, callback) {

    db.insert(
        {
            sql:
            "INSERT INTO    Monitors " +
            "(              AccountId, ProductId, EnvironmentId, EndpointUri, IntervalSeconds) " +
            "VALUES (       ?, ?, ?, ?, ?) ",
            values: [
                monitor.accountId,
                monitor.productId,
                monitor.environmentId,
                monitor.endpointUri,
                monitor.intervalSeconds
            ]
        },
        callback
    );

};

// Updates a record.
// callback(int: Number of affected rows)
exports.update = function(monitor, callback) {

    db.update(
        {
            sql:
            "UPDATE Monitors " +
            "SET    AccountId = ?, ProductId = ?, EnvironmentId = ?, EndpointUri = ?, IntervalSeconds = ? " +
            "WHERE  MonitorId = ? ",
            values: [
                monitor.accountId,
                monitor.productId,
                monitor.environmentId,
                monitor.endpointUri,
                monitor.intervalSeconds,
                monitor.monitorId
            ]
        },
        callback
    );

};

// Deletes a record.
// callback(int: Number of affected rows)
exports.delete = function(monitorId, callback) {

    db.delete(
        {
            sql:
            "DELETE FROM    Monitors " +
            "WHERE          MonitorId = ? ",
            values: [
                monitorId
            ]
        },
        callback
    );

};
