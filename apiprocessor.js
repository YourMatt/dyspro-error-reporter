var database;

exports.init = function (initDatabase) {
    database = initDatabase;
};

exports.processor = {

    authenticate: function (req, callback) {

        var checkUser = req.headers.username;
        var checkPassword = req.headers.password;

        database.query.loadUser (checkUser, checkPassword,
            function (userData) {
                callback (userData);
            },
            function () {
                callback ();
            }
        );

    },

    getError: function (errorMessage) {

        var error = {
            error: errorMessage
        };

        return error;

    }

}