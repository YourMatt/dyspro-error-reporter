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

        const currentMonitor = script.monitors.shift();
        script.writeLog(sprintf("Processing monitor %d against %s.", currentMonitor.monitorId, currentMonitor.endpointUri));
        console.log(currentMonitor);

        uriMonitor.getResponse(currentMonitor.endpointUri, function (response) {

            script.writeLog(sprintf("Received response with status %d in %dms.", response.statusCode, response.responseMilliseconds));
            response.response = "length was " + response.response.length;
            console.log(response);

            script.processMonitors(callback);

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
