
-- Holds setup queries for the PostgreSQL database.

CREATE TABLE    accounts
(               account_id          SERIAL
,               name                VARCHAR(50) NOT NULL
,               api_key             VARCHAR(20) NOT NULL UNIQUE
,               create_date         TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
, CONSTRAINT    pk_account_id                   PRIMARY KEY (account_id));

CREATE TABLE    users
(               user_id             SERIAL
,               account_id          INTEGER     NOT NULL
,               name                VARCHAR(50) NOT NULL
,               email               VARCHAR(50) NOT NULL UNIQUE
,               password            VARCHAR(34) NOT NULL
,               create_date         TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
, CONSTRAINT    pk_user_id                      PRIMARY KEY (user_id)
, CONSTRAINT    fk_users_accounts               FOREIGN KEY (account_id)
  REFERENCES    accounts (account_id));

CREATE TABLE    errors
(               error_id            SERIAL
,               account_id          INTEGER     NOT NULL
,               product             VARCHAR(50) NOT NULL
,               stack_trace         TEXT
, CONSTRAINT    pk_error_id                     PRIMARY KEY (error_id)
, CONSTRAINT    fk_errors_accounts              FOREIGN KEY (account_id)
  REFERENCES    accounts (account_id));

CREATE TABLE    error_occurrences
(               error_occurrence_id SERIAL
,               error_id            INTEGER     NOT NULL
,               environment         VARCHAR(25) NOT NULL
,               message             TEXT
,               server              VARCHAR(50)
,               user_name           VARCHAR(50)
,               date                TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
, CONSTRAINT    pk_error_occurrence_id          PRIMARY KEY (error_occurrence_id)
, CONSTRAINT    fk_error_occurrences_errors     FOREIGN KEY (error_id)
  REFERENCES    errors (error_id));

CREATE TABLE    error_attachments
(               error_occurrence_id INTEGER     NOT NULL
,               file_name           VARCHAR(50) NOT NULL
,               file_type           VARCHAR(25) NOT NULL
,               source              BYTEA
, CONSTRAINT    pk_error_attachments            PRIMARY KEY (error_occurrence_id, file_name)
, CONSTRAINT    fk_error_attachments_error_occurrences  FOREIGN KEY (error_occurrence_id)
  REFERENCES    error_occurrences (error_occurrence_id));

CREATE TABLE    error_notes
(               error_note_id       SERIAL
,               error_id            INTEGER     NOT NULL
,               user_id             INTEGER     NOT NULL
,               message             TEXT        NOT NULL
,               date                TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
, CONSTRAINT    pk_error_note_id                PRIMARY KEY (error_note_id)
, CONSTRAINT    fk_error_notes_errors           FOREIGN KEY (error_id)
  REFERENCES    errors (error_id)
, CONSTRAINT    fk_error_notes_users            FOREIGN KEY (user_id)
  REFERENCES    users (user_id));