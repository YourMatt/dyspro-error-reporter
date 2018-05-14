/***********************************************************************************************************************
 *
 * ACCOUNT MODEL
 *
 **********************************************************************************************************************/
const utils = require("../utilities");

let self = function (name, apiKey, createDate, accountId) {
    this.name = name;
    this.apiKey = apiKey;
    this.createDate = createDate;
    this.accountId = utils.toInt(accountId);
};

module.exports = self;
