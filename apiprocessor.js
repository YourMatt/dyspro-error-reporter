
exports.processor = {

    authenticate: function (req) {

        var checkUser = req.headers.username;
        var checkPassword = req.headers.password;

        // TODO: Check database for user
        if (checkUser != "user" || checkPassword != "password") return false;

        return true;

    },

    // check HTTP basic authentication - removed because Heroku doesn't send these HTTP headers to the app
    authenticateBasic: function (req) {

        if (! req.headers.authorization) return false;
        var authParams = new Buffer(req.headers.authorization.substring(6), 'base64').toString().split(':');
        if (! authParams) return false;

        var checkUser = authParams[0];
        var checkPassword = authParams[1];

        // TODO: Check database for user
        if (checkUser != "user" || checkPassword != "password") return false;

        return true;

    }

}