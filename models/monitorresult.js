/***********************************************************************************************************************
 *
 * MONITOR RESULTS MODEL
 *
 **********************************************************************************************************************/

var self = function (monitorId, metric, day, rawData, averagesPer15MinuteInterval, averageForDay) {
    this.monitorId = monitorId;
    this.metric = metric;
    this.day = day;
    this.rawData = rawData;
    this.averagesPer15MinuteInterval = averagesPer15MinuteInterval;
    this.averageForDay = averageForDay;
};

self.prototype = {
    monitorId: 0,
    metric: "",
    day: "",
    rawData: "",
    averagesPer15MinuteInterval: "",
    averageForDay: ""
};

module.exports = self;
