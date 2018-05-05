var database = require ("./databaseaccessor");

exports.manager = {

    loadFile: function (errorOccurrenceId, fileName, callback) {

        database.query.getErrorAttachment (errorOccurrenceId, fileName, callback);

    }

};
