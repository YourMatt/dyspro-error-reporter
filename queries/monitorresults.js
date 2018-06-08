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

// Loads all raw data for stats generated over the past 24 hours.
// callback(array: List of monitor names and raw data)
exports.loadStatsForDay = function (db, monitorId, monitorIntervalSeconds, callback) {

    db.selectMultiple(
        {
            sql:
            "SELECT    Metric " +
            ",         GROUP_CONCAT(RawData ORDER BY Day ASC SEPARATOR ',') AS RawData " +
            "FROM      MonitorResults " +
            "WHERE     MonitorId = ? " +
            "AND (     Day = DATE_FORMAT(NOW(), '%Y%m%d') " +
            "      OR  Day = DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY), '%Y%m%d')) " +
            "GROUP BY  Metric ",
            values: [
                monitorId
            ]
        },
        function (s) {
            if (!s) return callback([]);

            // set dataset to include only 24 hours worth of data
            const expectedNumberResults = (24 * 60 * 60) / monitorIntervalSeconds;

            for (let i = 0; i < s.length; i++) {
                let rawDataPieces = s[i].RawData.split(",");
                s[i].metric = s[i].Metric;
                delete s[i].RawData;
                delete s[i].Metric;

                // set the data unit type
                if (rawDataPieces.length) {
                    if (rawDataPieces[0].indexOf("%") >= 0) s[i].unitType = "percent";
                    else if (rawDataPieces[0] === "true" || rawDataPieces[0] === "false") s[i].unitType = "boolean";
                    else s[i].unitType = "numeric";
                }

                // loop through data standardizing to a number for each
                for (let j = 0; j < rawDataPieces.length; j++) {

                    // set to 0 if no value
                    if (!rawDataPieces[j].length) {
                        rawDataPieces[j] = 0;
                    }

                    // determine the unit type from the first record
                    switch (s[i].unitType) {
                        case "percent":
                            rawDataPieces[j] = rawDataPieces[j].replace("%", "");
                            break;
                        case "boolean":
                            rawDataPieces[j] = (rawDataPieces[j] === "true") ? 1 : 0;
                            break;
                    }

                }

                // trim from start if more elements than expected
                if (rawDataPieces.length > expectedNumberResults) {
                    rawDataPieces = rawDataPieces.splice(rawDataPieces.length - expectedNumberResults, expectedNumberResults);
                }

                // zero-pad if fewer elements than expected
                else if (rawDataPieces.length < expectedNumberResults) {
                    let paddedElements = [];
                    let shortBy = expectedNumberResults - rawDataPieces.length;
                    for (let j = 0; j < shortBy; j++) {
                        paddedElements.push(0);
                    }
                    rawDataPieces = paddedElements.concat(rawDataPieces);
                }

                // find number of elements in current 15-minute interval
                let minutesPerAveragedPeriod = 15;
                let currentTime = new Date();
                let secondsInCurrentHour = currentTime.getMinutes() * 60 + currentTime.getSeconds();
                let numStatsInEachPeriod = Math.round(minutesPerAveragedPeriod * 60 / monitorIntervalSeconds);
                let numStatsInCurrentPeriod = Math.floor(secondsInCurrentHour / monitorIntervalSeconds) % numStatsInEachPeriod;

                // build averages and split higher-resolution stats into separate arrays that make up each period average
                let averagedStats = [];
                let statsPerPeriod = [];
                let statsInCurrentPeriod = [];
                let periodTotal = 0;
                for (let j = 0; j < rawDataPieces.length; j++) {

                    let currentValue = parseInt(rawDataPieces[j]);
                    periodTotal += currentValue;
                    statsInCurrentPeriod.push(currentValue);

                    if (j % numStatsInEachPeriod === (numStatsInEachPeriod - numStatsInCurrentPeriod - 1) || j === rawDataPieces.length - 1) {
                        averagedStats.push(Math.round(periodTotal / statsInCurrentPeriod.length));
                        periodTotal = 0;
                        statsPerPeriod.push(statsInCurrentPeriod.join(","));
                        statsInCurrentPeriod = [];
                    }

                }

                s[i].averagedStats = averagedStats.join(",");
                s[i].statsPerPeriod = statsPerPeriod;

            }

            callback(s);

        }
    );

};