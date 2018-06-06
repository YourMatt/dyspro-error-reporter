dyspro-error-reporter
=====================

A rough app for accepting error information and displaying back in reports.

API Endpoints

All requests require auth basic where the user name is the account name, and the password is the API Key.

GET /api/errors/[environment]
Load all errors for a given environment.

GET /api/errors/[environment]/[error id]
Load error details with occurrences related to a specific environment.

POST /api/log
Params:
 files          If want to add attachments to the error occurrence
 product        String identifier for the originating app
 environment    String identifier for the environment the error originated from
 server         The specific server
 message        An error message related to this specific error occurrence
 userName       An account identifier for tracking who was affected
 stackTrace     A stack trace showing where in the code the error originated from - This is used not only for debug,
                but acts as an identifier for grouping error occurrences

Crontab Entries

Sets to run at minimum resolution of 15 seconds.

* * * * * node /srv/dyspro-system-monitor/runmonitors.js
* * * * * sleep 15 && node /srv/dyspro-system-monitor/runmonitors.js
* * * * * sleep 30 && node /srv/dyspro-system-monitor/runmonitors.js
* * * * * sleep 45 && node /srv/dyspro-system-monitor/runmonitors.js
