var database = require ("./databaseaccessor.js");

exports.manager = {

    loadFile: function (errorOccurrenceId, fileName, callback) {

        database.query.getErrorAttachment (errorOccurrenceId, fileName, callback);

    }

};
