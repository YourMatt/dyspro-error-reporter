/***********************************************************************************************************************
 *
 * ACCOUNT MODEL
 *
 **********************************************************************************************************************/

var self = function (name, apiKey, createDate, accountId) {
    this.name = name;
    this.apiKey = apiKey;
    this.createDate = createDate;
    if (accountId) this.accountId = accountId;
};

self.prototype = {
    accountId: 0,
    name: "",
    apiKey: "",
    createDate: {}
};

module.exports = self;
