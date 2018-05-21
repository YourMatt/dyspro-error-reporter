/***********************************************************************************************************************
 *
 * WEB SERVER
 *
 **********************************************************************************************************************/

// load configuration values
require ("dotenv").config();

// include libraries from node modules
const bodyParser = require ("body-parser"),
    busboy = require ("connect-busboy"),
    compression = require ("compression"),
    ejs = require ("ejs"),
    express = require ("express"),
    session = require ("express-session");

// include local libraries
const api = require ("./apiprocessor"),
    middleware = require("./middleware"),
    pageManager = require("./pagemanager");

// initialize express
let app = express ();
app.set ("port", (process.env.RUNTIME_PORT || 80));
app.set ("views", __dirname + "/views/layout");
app.engine ("ejs", ejs.renderFile);
app.use (bodyParser.urlencoded ({extended: false}));
app.use (compression({level: 1, threshold: 0})); // use fastest compression
app.use (express.static (__dirname + "/public"));
app.use (busboy ()); // allow file uploads
app.use (session ({secret: "dyspro-sess", resave: true, saveUninitialized: true}));
middleware.addAll(app);

// handle page requests
app.get     ("/", pageManager.renderHome);
app.get     ("/dashboard", pageManager.renderDashboard);
app.get     ("/errors/:errorId/occurrence/:errorOccurrenceId", pageManager.renderErrorOccurrenceDetail);
app.get     ("/errors/:errorId", pageManager.renderErrorDetail);
app.get     ("/settings", pageManager.renderSettings);

// handle other file requests
app.get     ("/attachments/:errorOccurrenceId/:fileName", pageManager.renderErrorAttachment);

// handle submits
app.post    ("/login", pageManager.processLogin);
app.get     ("/logout", pageManager.processLogout);

// handle api requests
// errors
app.get     ("/api/error/:errorId", api.error.getSingle);
app.get     ("/api/errors/:environment/:count?", api.error.getLatestForEnvironment);
app.post    ("/api/error", api.error.create);
// error notes
app.get     ("/api/errornote/:errorNoteId", api.errorNotes.getSingle);
app.get     ("/api/errornotes/:errorId", api.errorNotes.getAllForError);
app.post    ("/api/errornote", api.errorNotes.create);
app.put     ("/api/errornote/:errorNoteId", api.errorNotes.update);
app.delete  ("/api/errornote/:errorNoteId", api.errorNotes.delete);
// monitors
app.get     ("/api/monitor/:monitorId", api.monitor.getSingle);
app.get     ("/api/monitors", api.monitor.getAllInAccount);
app.get     ("/api/monitor/test/:uri", api.monitor.testUri);
app.post    ("/api/monitor", api.monitor.create);
app.put     ("/api/monitor/:monitorId", api.monitor.update);
app.delete  ("/api/monitor/:monitorId", api.monitor.delete);
// users
app.get     ("/api/user/:userId", api.user.getSingle);
app.get     ("/api/users", api.user.getAllInAccount);
app.post    ("/api/user", api.user.create);
app.post    ("/api/user/authenticate", api.user.authenticate);
app.put     ("/api/user/:userId", api.user.update);
app.delete  ("/api/user/:userId", api.user.delete);
// products
app.get     ("/api/products", api.product.getAllInAccount);
// environments
app.get     ("/api/environments", api.environment.getAllInAccount);

// start server
app.listen (app.get ("port"));
console.log ("Server started.");
