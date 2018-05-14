/***********************************************************************************************************************
 *
 * MONITOR RESULTS MODEL
 *
 **********************************************************************************************************************/
const utils = require("../utilities");

let self = function (monitorId, metric, day, rawData, averagesPer15MinuteInterval, averageForDay) {
    this.monitorId = utils.toInt(monitorId);
    this.metric = metric;
    this.day = day; // always YYYYMMDD format
    this.rawData = rawData; // comma-separated list
    this.averagesPer15MinuteInterval = averagesPer15MinuteInterval; // comma-separated list
    this.averageForDay = averageForDay; // this is a string to allow state tracking, ie if raw data is a series of "good" and "bad", the average can be calculated as most occurrences of either

    this.errorMessage = "";

    this.isValid = function () {

        let missingFields = [];
        let maxLengthExceededFields = [];
        let outOfBoundsFields = [];

        if (!this.monitorId) missingFields.push("monitorId");

        if (!this.metric) missingFields.push("metric");
        else if (this.metric.length > 50) maxLengthExceededFields.push("metric");

        if (!this.day) missingFields.push("day");
        else if (this.day.length !== 8) outOfBoundsFields.push("day");

        if (this.rawData.length > 16000000) maxLengthExceededFields.push("rawData");

        if (this.averagesPer15MinuteInterval.length > 1000) maxLengthExceededFields.push("averagesPer15MinuteInterval");

        if (this.averageForDay.length > 25) maxLengthExceededFields.push("averageForDay");

        this.errorMessage = utils.buildApiFieldErrorMessage(missingFields, maxLengthExceededFields, outOfBoundsFields);
        return (this.errorMessage === "");

    }

};

module.exports = self;
