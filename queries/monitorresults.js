/***********************************************************************************************************************
 *
 * DATABASE INTERACTION FOR MONITOR RESULTS
 *
 **********************************************************************************************************************/
const models = require("../models/all");

// Adds a metric value to the current day or creates the record if doesn't already exist.
// callback(int: Number of affected rows)
exports.upsert = function (db, monitorId, metric, value, callback) {

    db.update(
        {
            sql:
            "INSERT INTO MonitorResults " +
            "(           MonitorId, Metric, Day, RawData) " +
            "VALUES (    ?, ?, DATE_FORMAT(NOW(), '%Y%m%d'), ?) " +
            "ON DUPLICATE KEY UPDATE RawData = CONCAT(RawData, ',', ?) ",
            values: [
                monitorId,
                metric,
                value,
                value
            ]
        },
        callback
    );

};
