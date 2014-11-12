var dbLocation, pg;

exports.init = function (initDbLocation, initPg) {

    dbLocation = initDbLocation;
    pg = initPg;

}

// TODO: Add error handling callbacks

exports.query = {

    // authenticate the user
    loadUser: function (userName, password, callback) {

        pg.connect (dbLocation, function (err, client, done) {
            client.query ("select * from users where username = '" + userName + "' and password = md5('" + password + "')", function (err, result) {
                done ();
                callback (result.rows[0]);
            });
        });

    }

}