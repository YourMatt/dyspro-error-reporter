/***********************************************************************************************************************
 *
 * HANDLES ALL PAGE REQUESTS
 *
 **********************************************************************************************************************/
const mime = require ("mime"),
    moment = require("moment"),
    models = require("./models/all"),
    queries = require("./queries/all"),
    sessionManager = require("./sessionmanager");

// Processes a login.
exports.processLogin = function (req, res) {

    queries.users.getByLogin(req.body.email, req.body.password, function (userData) {

        // user not authenticated
        if (!userData.userId) {
            sessionManager.set("errorMessage", "Incorrect email or password.");
            return res.redirect(req.headers.referer);
        }

        // save user to session and forward to the dashboard
        sessionManager.set("user", userData);
        res.redirect("/dashboard");

    });

};

// Process a logout.
exports.processLogout = function (req, res) {

    sessionManager.set ("user", new models.User());
    sessionManager.set ("successMessage", "You have successfully logged out.");
    res.redirect ("/");

};

// Renders the home page.
exports.renderHome = function (req, res) {

    pageUtils.renderPage(res, "home.ejs", {
        jsFiles: []
    });

};

// Renders the dashboard page.
exports.renderDashboard = function (req, res) {
    if (!sessionManager.loggedIn()) return res.redirect("/");

    queries.accounts.getEnvironments (sessionManager.data.user.accountId, function (environments) {

        pageUtils.renderPage(res, "dashboard.ejs", {
            jsFiles: ["errors.js", "dashboard.js"],
            environments: environments,
            selectedEnvironment: environments[0] // TODO: Pull value from settings if exists
        });

    });

};

// Renders the error occurrence detail page.
exports.renderErrorOccurrenceDetail = function (req, res) {
    if (!sessionManager.loggedIn()) return res.redirect("/");

    // load the error occurrence data
    queries.errorOccurrences.get(req.params.errorOccurrenceId, function (errorOccurrence) {
        if (!errorOccurrence) {
            sessionManager.set("errorMessage", "Error occurrence not found.");
            return res.redirect(req.headers.referer);
        }

        // load the attachments for the error occurrence
        queries.errorAttachments.getAllByErrorOccurrence(
            errorOccurrence.errorOccurrenceId,
            function (attachments) {
                errorOccurrence.attachments = attachments;

                try {
                    let stackTraceJson = JSON.parse(errorOccurrence.stackTrace);
                    errorOccurrence.stackTrace = JSON.stringify(stackTraceJson, null, 2);
                }
                catch (e) {}

                // load the error details
                queries.errors.get(errorOccurrence.errorId, function (error) {

                    pageUtils.renderPage(res, "error-occurrence-detail.ejs", {
                        jsFiles: ["errors.js", "error-detail.js"],
                        errorOccurrence: errorOccurrence,
                        error: error,
                        moment: moment
                    });

                });
            }
        );
    });
};

// Renders the error detail page.
exports.renderErrorDetail = function (req, res) {
    if (!sessionManager.loggedIn()) return res.redirect("/");

    // load the error data
    queries.errors.get(req.params.errorId, function (error) {
        if (!error) {
            sessionManager.set("errorMessage", "Error not found.");
            return res.redirect(req.headers.referer);
        }

        pageUtils.renderPage(res, "error-details.ejs", {
            jsFiles: ["errors.js", "error-detail.js"],
            error: error
        });

    });

};

// Renders an error attachment source file.
exports.renderErrorAttachment = function (req, res) {
    queries.errorAttachments.get(
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
    if (!sessionManager.loggedIn()) return res.redirect("/");

    pageUtils.renderPage(res, "settings.ejs", {
        jsFiles: []
    });

};

// Common methods to this module.
const pageUtils = {

    renderPage: function (res, ejsFileName, ejsVariables) {

        // add common variables to provided object
        if (!ejsVariables) ejsVariables = {};
        ejsVariables.page = ejsFileName.replace(".ejs", "").replace("-", "");
        ejsVariables.errorMessage = sessionManager.getOnce("errorMessage");
        ejsVariables.successMessage = sessionManager.getOnce("successMessage");
        ejsVariables.userId = sessionManager.data.user.userId;

        // render the page
        res.render(ejsFileName, ejsVariables);

    }

};