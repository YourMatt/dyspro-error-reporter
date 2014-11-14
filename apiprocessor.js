var database;
var files = [];

exports.init = function (init_database) {
    database = init_database;
};

exports.processor = {

    authenticate: function (req, callback) {

        var check_user = req.headers.username;
        var check_password = req.headers.password;

        database.query.loadUser (check_user, check_password,
            function (user_data) {
                callback (user_data);
            },
            function () {
                callback ();
            }
        );

    },

    logError: function (req, error_data, callback) {

        this.uploadFiles (req, function (error_message) {

            // return if an error loading files
            if (error_message) {
                callback (error_message);
                return;
            }

            // save the base error type
            database.query.logError (
                error_data,
                files,
                function () {
                    callback ();
                },
                function () {
                    callback ("Error saving data.");
                }
            );

        });

    },

    uploadFiles: function (req, callback) {
        var that = this;

        // open reqest to accept files
        req.pipe (req.busboy);

        // save files to local variable
        req.busboy.on ("file", function (field_name, file, file_name, encoding, mime_type) {

            // load the file data
            file.on ("data", function (data) {

                var file_data = {
                    file_name: file_name,
                    file_type: that.getFileType (file_name),
                    source: data.toString ("utf8")
                };

                files.push (file_data);

            });

        });

        // continue when all files have completed uploading
        req.busboy.on ("finish", function() {
            callback ();
        });

    },

    getFileType: function (file_name) {

        var file_name_parts = file_name.split (".");
        return file_name_parts[file_name_parts.length - 1].toLowerCase ();

    },

    getErrorResponseData: function (error_message) {

        var error = {
            error: error_message
        };

        return error;

    },

    getSuccessResponseData: function () {

        var success = {
            status: "success"
        };

        return success;

    },

    sendResponse: function (res, return_data) {

        res.writeHead (200, {"Content-Type": "application/json"});
        res.end (JSON.stringify (return_data));

    }

}