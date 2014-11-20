var database = require ("./databaseaccessor.js");

exports.manager = {

    loadFile: function (error_occurrence_id, file_name, callback) {

        database.query.getErrorAttachment (error_occurrence_id, file_name, callback);

    }

}