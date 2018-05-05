var models = require("./models/all");

var req;
exports.init = function (init_req) {
    req = init_req;
    if (req.session.data) {
        exports.data = req.session.data;
    }
    else {
        exports.data = new models.Session();
    }
};

exports.set = function (name, value) {

    eval ("exports.data." + name + " = value;");
    req.session.data = exports.data;

};
exports.getOnce = function (name) {

    var value;
    eval ("value = exports.data." + name + ";");
    eval ("exports.data." + name + " = '';");
    return value;

};

exports.loggedIn = function () {
    return (exports.data.user.userId);
};
