exports.data = {

    account_id: 0,
    user_id: 0,
    error_message: "",
    success_message: ""

};

var req;
exports.init = function (init_req) {
    req = init_req;
    if (req.session.data) {
        exports.data = req.session.data;
    }
    else exports.data = {};
}

exports.set = function (name, value) {

    eval ("exports.data." + name + " = value;");
    req.session.data = exports.data;

};
exports.getOnce = function (name) {

    var value;
    eval ("value = exports.data." + name + ";");
    eval ("exports.data." + name + " = '';");
    return value;

}

exports.loggedIn = function () {
    return (exports.data.user_id > 0);
}