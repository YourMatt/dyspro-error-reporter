/***********************************************************************************************************************
 *
 * HANDLES ALL SESSION INTERACTION
 * This is meant to be created as an object on req, ensuring the session is always scoped to the current request.
 *
 **********************************************************************************************************************/
const models = require("./models/all");

// Constructor.
let self = function (req) {

    this.req = req; // current request is target for reading and writing session data

    // initialize the session data if is not already set
    if (!this.req.session.data) this.req.session.data = new models.Session();

};

// Writes a value to the session data object.
self.prototype.set = function (name, value) {

    eval ("this.req.session.data." + name + " = value;");

};

// Retrieves a value from the session data object.
self.prototype.get = function (name) {

    let value = "";
    eval("value = this.req.session.data." + name + ";");
    return value;

};

// Retrieves a value the removes it from the session data object.
self.prototype.getOnce = function (name) {

    let value = this.get(name);
    eval ("this.req.session.data." + name + " = '';");
    return value;

};

// Checks if a user is currently logged in.
self.prototype.loggedIn = function () {
    return (this.req.session.data.user.userId);
};

module.exports = self;
