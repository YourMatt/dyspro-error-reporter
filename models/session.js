/***********************************************************************************************************************
 *
 * SESSION MODEL
 *
 **********************************************************************************************************************/

var self = function () {
    this.user = {};
    this.errorMessage = "";
    this.successMessage = "";
};

self.prototype = {
    user: {},
    errorMessage: "",
    successMessage: ""
};

module.exports = self;
