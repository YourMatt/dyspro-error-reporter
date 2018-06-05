/***********************************************************************************************************************
 *
 * DATABASE INTERACTION FOR MONITORS
 *
 **********************************************************************************************************************/
const models = require("../models/all");

// Loads a single monitor.
// callback(models.Monitor: Monitor details)
exports.get = function(db, monitorId, callback) {

    db.selectSingle(
        {
            sql:
            "SELECT     m.MonitorId, m.AccountId, m.ProductId, m.EnvironmentId, m.EndpointUri, m.IntervalSeconds " +
            ",          p.Name AS ProductName " +
            ",          e.Name AS EnvironmentName " +
            "FROM       Monitors m " +
            "INNER JOIN Products p ON p.ProductId = m.ProductId " +
            "INNER JOIN Environments e ON e.EnvironmentId = m.EnvironmentId " +
            "WHERE      m.MonitorId = ? ",
            values: [
                monitorId
            ]
        },
        function (m) {
            if (!m) return callback(new models.Monitor);

            let monitor = new models.Monitor(
                m.AccountId,
                m.ProductId,
                m.ProductName,
                m.EnvironmentId,
                m.EnvironmentName,
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
exports.getAllByAccountId = function(db, accountId, callback) {

    db.selectMultiple(
        {
            sql:
            "SELECT     m.MonitorId, m.AccountId, m.ProductId, m.EnvironmentId, m.EndpointUri, m.IntervalSeconds " +
            ",          p.Name AS ProductName " +
            ",          e.Name AS EnvironmentName " +
            "FROM       Monitors m " +
            "INNER JOIN Products p ON p.ProductId = m.ProductId " +
            "INNER JOIN Environments e ON e.EnvironmentId = m.EnvironmentId " +
            "WHERE      m.AccountId = ? " +
            "ORDER BY   m.MonitorId ASC ",
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
                    m[i].ProductName,
                    m[i].EnvironmentId,
                    m[i].EnvironmentName,
                    m[i].EndpointUri,
                    m[i].IntervalSeconds,
                    m[i].MonitorId
                ));
            }
            callback(monitors);

        }
    );

};

// Loads all monitors eligible for processing by its interval period.
// callback(array: List of model.Monitor)
exports.getAllByInterval = function (db, cronIntervalSeconds, callback) {

    // selects all monitors where the current second is within 5 seconds of the interval period - this 5 seconds
    // accounts for any possible difference between web server time and database time, and thus should always match the
    // cron run interval on the server
    db.selectMultiple(
        {
            sql:
            "SELECT  MonitorId, AccountId, EndpointUri, IntervalSeconds " +
            "FROM    Monitors " +
            "WHERE   TIME_TO_SEC(NOW()) % IntervalSeconds < ? " +
            "OR (    TIME_TO_SEC(NOW()) = 25200 AND IntervalSeconds = 0) ",
            values: [
                cronIntervalSeconds
            ]
        },
        function (m) {
            if (!m) return callback([]);

            let monitors = [];
            for (let i = 0; i < m.length; i++) {
                monitors.push(new models.Monitor(
                    m[i].AccountId,
                    0, "",
                    0, "",
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
exports.create = function(db, monitor, callback) {

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
exports.update = function(db, monitor, callback) {

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
exports.delete = function(db, monitorId, callback) {

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
