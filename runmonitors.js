#!/usr/bin/env nodejs

// load configuration values
require("dotenv").config();

// include libraries from node modules
const async = require("async"),
    childProcess = require("child_process"),
    sprintf = require("util").format;

// include local libraries
const databaseAccessor = require("./databaseaccessor"),
    models = require("./models/all"),
    monitorQueries = require("./queries/monitors"),
    monitorResultQueries = require("./queries/monitorresults"),
    uriMonitor = require("./urimonitor");

let script = {

    db: {},
    monitors: [],
    startTime: {},

    // Creates a connection to the database.
    connectToDb: function (callback) {

        script.writeLog ("STARTING MONITOR PROCESS ---------------------------------------------------------------------------"); // header line will total 120 chars including date
        script.startTime = Date.now();

        script.db = new databaseAccessor(function (success) {
            if (!success) {
                shell.writeLog("Error connecting to database.");
                script.exit();
            }

            callback();

        });

    },

    // Closes the database connection.
    disconnectFromDb: function (callback) {

        script.db.close();
        callback();

    },

    // Exits the script.
    exit: function () {

        script.writeLog(sprintf("Completed in %dms.", (Date.now() - script.startTime)));
        process.exit(1);

    },

    // Loads monitors eligible for processing.
    loadMonitors: function (callback) {

        monitorQueries.getAllByInterval(script.db, process.env.CRON_RUN_INTERVAL, function (monitors) {
            script.monitors = monitors;
            script.writeLog(sprintf("Found %d monitor%s ready for processing.", monitors.length, (monitors.length == 1) ? "" : "s"));
            callback();
        });

    },

    // Processes loaded monitors.
    processMonitors: function (callback) {

        if (!script.monitors.length) return callback();

        // remove the first element - this function will be called recursively until no monitors remain
        const currentMonitor = script.monitors.shift();
        script.writeLog(sprintf("Processing monitor %d against %s.", currentMonitor.monitorId, currentMonitor.endpointUri));

        // load data from the URI
        uriMonitor.getResponse(currentMonitor.endpointUri, function (response) {

            script.writeLog(sprintf("Received response with status %d in %dms.", response.statusCode, response.responseMilliseconds));

            // build the list of metrics to store in the database
            let metrics = [];
            metrics.push(["responseTime", response.responseMilliseconds]); // all will include the time it took to load, but this can be overridden by the a metric of the same name if the user wants to track server time without network overhead
            let metricKeys = Object.keys(response.responseParsed);
            for (let i = 0; i < metricKeys.length; i++) {
                metrics.push([metricKeys[i], response.responseParsed[metricKeys[i]]]);
            }

            // store metrics in the database
            for (let i = 0; i < metrics.length; i++) {
                monitorResultQueries.upsert(
                    script.db,
                    currentMonitor.monitorId,
                    metrics[i][0],
                    metrics[i][1],
                    function (numUpdated) {
                        if (!numUpdated) script.writeLog(sprintf("Could not add metric %s with value of %s to monitor results.", metrics[i][0], metrics[i][1]));

                        if ((i + 1) === metrics.length)
                            script.processMonitors(callback);

                    }
                );
            }

        });

    },

    // Writes a message to the log file with a standard format.
    writeLog: function (message) {

        childProcess.exec (
            "echo $(date '+%Y-%m-%d %H:%M:%S')' " + message + "' >> " + process.env.LOG_FILE,
            function (error, stdout, stderr) {
                if (error) console.log(error);
            }
        )

    }

};

// procedurally apply all actions
async.series([
    script.connectToDb,
    script.loadMonitors,
    script.processMonitors,
    script.disconnectFromDb,
    script.exit
]);
