/***********************************************************************************************************************
 *
 * USER MODEL
 *
 **********************************************************************************************************************/

var self = function (accountId, name, email, phone, password, createDate, userId) {
    this.accountId = accountId;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.password = password;
    this.createDate = createDate;
    if (userId) this.userId = userId;
};

self.prototype = {
    userId: 0,
    accountId: 0,
    name: "",
    email: "",
    phone: "",
    password: "",
    createDate: {}
};

module.exports = self;
