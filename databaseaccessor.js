var dbLocation, pg;

exports.init = function (initDbLocation, initPg) {

    dbLocation = initDbLocation;
    pg = initPg;

}

// TODO: Add error handling callbacks

exports.query = {

    // authenticate the user
    loadUser: function (userName, password, success, fail) {

        pg.connect (dbLocation, function (err, client, done) {
            if (err) {
                fail ();
                return;
            }
            client.query ("select * from users where username = '" + userName + "' and password = md5('" + password + "')", function (err, result) {
                done ();
                if (! err && result.rows.length == 1) {
                    success (result.rows[0]);
                }
                else fail ();
            });
        });

    }

}