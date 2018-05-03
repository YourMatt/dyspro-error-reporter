/***********************************************************************************************************************
 *
 * ERROR MODEL
 *
 **********************************************************************************************************************/

var self = function (accountId, product, stackTrace, errorId) {
    this.accountId = accountId;
    this.product = product;
    this.stackTrace = stackTrace;
    if (errorId) this.errorId = errorId;
};

self.prototype = {
    errorId: 0,
    accountId: 0,
    product: "",
    stackTrace: ""
};

module.exports = self;
