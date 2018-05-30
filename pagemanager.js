/***********************************************************************************************************************
 *
 * HANDLES ALL PAGE REQUESTS
 *
 **********************************************************************************************************************/
const mime = require ("mime"),
    moment = require("moment"),
    models = require("./models/all"),
    queries = require("./queries/all");

// Processes a login.
exports.processLogin = function (req, res) {

    queries.users.getByLogin(
        req.db,
        req.body.email,
        req.body.password,
        function (userData) {

            // user not authenticated
            if (!userData.userId) {
                req.sessionManager.set("errorMessage", "Incorrect email or password.");
                return res.redirect(req.headers.referer);
            }

            // save user to the session
            req.sessionManager.set("user", userData);

            // load the account information
            queries.accounts.get(
                req.db,
                userData.accountId,
                function (accountData) {

                    // account not found
                    if (!accountData.accountId) {
                        req.sessionManager.set("errorMessage", "Could not load account information.");
                        return res.redirect(req.headers.referrer);
                    }

                    // save the account to the session
                    req.sessionManager.set("account", accountData);

                    // redirect to the dashboard
                    res.redirect("/dashboard");

                }
            );

        }
    );

};

// Process a logout.
exports.processLogout = function (req, res) {

    req.sessionManager.set ("user", new models.User());
    req.sessionManager.set ("successMessage", "You have successfully logged out.");
    res.redirect ("/");

};

// Renders the home page.
exports.renderHome = function (req, res) {

    pageUtils.renderPage(req, res, "home.ejs");

};

// Renders the dashboard page.
exports.renderDashboard = function (req, res) {
    if (!req.sessionManager.loggedIn()) return res.redirect("/");

    queries.environments.getAllByAccountId(
        req.db,
        req.sessionManager.get("user.accountId"),
        function(environments) {

            pageUtils.renderPage(req, res, "dashboard.ejs", {
                environments: environments,
                selectedEnvironment: environments[0] // TODO: Pull value from settings if exists
            });

        }
    );

};

// Renders the error occurrence detail page.
exports.renderErrorOccurrenceDetail = function (req, res) {
    if (!req.sessionManager.loggedIn()) return res.redirect("/");

    // load the error occurrence data
    queries.errorOccurrences.get(req.db, req.params.errorOccurrenceId, function (errorOccurrence) {
        if (!errorOccurrence) {
            req.sessionManager.set("errorMessage", "Error occurrence not found.");
            return res.redirect(req.headers.referer);
        }

        // load the attachments for the error occurrence
        queries.errorAttachments.getAllByErrorOccurrence(
            req.db,
            errorOccurrence.errorOccurrenceId,
            function (attachments) {
                errorOccurrence.attachments = attachments;

                try {
                    let stackTraceJson = JSON.parse(errorOccurrence.stackTrace);
                    errorOccurrence.stackTrace = JSON.stringify(stackTraceJson, null, 2);
                }
                catch (e) {}

                // load the error details
                queries.errors.get(
                    req.db,
                    errorOccurrence.errorId,
                    function (error) {

                        pageUtils.renderPage(req, res, "error-occurrence-detail.ejs", {
                            errorOccurrence: errorOccurrence,
                            error: error
                        });

                    }
                );

            }
        );
    });
};

// Renders the error detail page.
exports.renderErrorDetail = function (req, res) {
    if (!req.sessionManager.loggedIn()) return res.redirect("/");

    // load the error data
    queries.errors.get(
        req.db,
        req.params.errorId,
        function (error) {
            if (!error) {
                req.sessionManager.set("errorMessage", "Error not found.");
                return res.redirect(req.headers.referer);
            }

            pageUtils.renderPage(req, res, "error-detail.ejs", {
                error: error
            });
        }
    );

};

// Renders an error attachment source file.
exports.renderErrorAttachment = function (req, res) {
    queries.errorAttachments.get(
        req.db,
        req.params.errorOccurrenceId,
        req.params.fileName,
        function (file) {

            if (!file) { // TODO: Call standard 404 handler
                res.writeHead(404, {"Content-Type": "text/html"});
                res.end("not found");
                return;
            }

            /* // TODO: Add option to prompt download
            res.writeHead (200, {"Content-Disposition": "attachment filename=" + file.file_name + ";"});
            res.end (file.source);
            */

            // display the file
            res.writeHead(200, {
                "Content-Type": mime.getType(file.fileType),
                "Content-Length": file.source.length
            });
            res.end(file.source);

        }
    );
};

// Renders the settings page.
exports.renderSettings = function (req, res) {
    if (!req.sessionManager.loggedIn()) return res.redirect("/");

    pageUtils.renderPage(req, res, "settings.ejs");

};

// Common methods to this module.
const pageUtils = {

    renderPage: function (req, res, ejsFileName, ejsVariables) {

        // add common variables to provided object
        if (!ejsVariables) ejsVariables = {};
        ejsVariables.page = ejsFileName.replace(".ejs", "").replace("-", "");
        ejsVariables.errorMessage = req.sessionManager.getOnce("errorMessage");
        ejsVariables.successMessage = req.sessionManager.getOnce("successMessage");
        ejsVariables.userId = req.sessionManager.get("user.userId");
        ejsVariables.accountName = req.sessionManager.get("account.name");
        ejsVariables.moment = moment;

        // render the page
        res.render(ejsFileName, ejsVariables);

    }

};
