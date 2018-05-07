/***********************************************************************************************************************
 *
 * MONITOR RESULTS MODEL
 *
 **********************************************************************************************************************/
var utils = require("../utilities");

var self = function (monitorId, metric, day, rawData, averagesPer15MinuteInterval, averageForDay) {
    this.monitorId = utils.toInt(monitorId);
    this.metric = metric;
    this.day = day; // always YYYYMMDD format
    this.rawData = rawData; // comma-separated list
    this.averagesPer15MinuteInterval = averagesPer15MinuteInterval; // comma-separated list
    this.averageForDay = averageForDay; // this is a string to allow state tracking, ie if raw data is a series of "good" and "bad", the average can be calculated as most occurrences of either

    this.errorMessage = "";

    this.isValid = function () {

        var missingFields = [];
        var maxLengthExceededFields = [];
        var outOfBoundsFields = [];

        if (!monitorId) missingFields.push("monitorId");

        if (!metric) missingFields.push("metric");
        else if (metric.length > 50) maxLengthExceededFields.push("metric");

        if (!day) missingFields.push("day");
        else if (day.length != 8) outOfBoundsFields.push("day");

        if (rawData.length > 16000000) maxLengthExceededFields.push("rawData");

        if (averagesPer15MinuteInterval.length > 1000) maxLengthExceededFields.push("averagesPer15MinuteInterval");

        if (averageForDay.length > 25) maxLengthExceededFields.push("averageForDay");

        this.errorMessage = utils.buildApiFieldErrorMessage(missingFields, maxLengthExceededFields, outOfBoundsFields);
        return (this.errorMessage === "");

    }

};

module.exports = self;
