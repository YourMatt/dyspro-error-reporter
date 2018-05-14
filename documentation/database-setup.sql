
-- Holds setup queries for the MySQL database.

-- Accounts represent a company with a single API key for sending error information.
CREATE TABLE  Accounts
(             AccountId   INT NOT NULL AUTO_INCREMENT
,             Name        VARCHAR(50) NOT NULL
,             ApiKey      VARCHAR(20) NOT NULL
,             CreateDate  TIMESTAMP NOT NULL
,             PRIMARY KEY (AccountId));

-- Users allow access to error data and allow notification of errors.
CREATE TABLE  Users
(             UserId      INT NOT NULL AUTO_INCREMENT
,             AccountId   INT NOT NULL
,             Name        VARCHAR(50) NOT NULL
,             Email       VARCHAR(50) NOT NULL
,             Phone       VARCHAR(10)
,             Password    VARCHAR(34) NOT NULL
,             CreateDate  TIMESTAMP NOT NULL
,             PRIMARY KEY (UserId)
,             FOREIGN KEY (AccountId) REFERENCES Accounts(AccountId) ON DELETE CASCADE);

-- Products are an identifier for scoping data to a given logical product.
CREATE TABLE  Products
(             ProductId   INT NOT NULL AUTO_INCREMENT
,             AccountId   INT NOT NULL
,             Name        VARCHAR(50) NOT NULL
,             Sequence    INT NOT NULL
,             CreateDate  TIMESTAMP NOT NULL
,             PRIMARY KEY (ProductId)
,             FOREIGN KEY (AccountId) REFERENCES Accounts(AccountId) ON DELETE CASCADE);

-- Environments are an identifier for scoping data to a given instance of the product.
CREATE TABLE  Environments
(             EnvironmentId INT NOT NULL AUTO_INCREMENT
,             AccountId     INT NOT NULL
,             Name          VARCHAR(25) NOT NULL
,             Sequence      INT NOT NULL
,             CreateDate    TIMESTAMP NOT NULL
,             PRIMARY KEY   (EnvironmentId)
,             FOREIGN KEY   (AccountId) REFERENCES Accounts(AccountId) ON DELETE CASCADE);

-- Errors are a unique definition for a particular (possibly reoccurring) error that is only stored once.
CREATE TABLE  Errors
(             ErrorId     INT NOT NULL AUTO_INCREMENT
,             AccountId   INT NOT NULL
,             ProductId   INT NOT NULL
,             StackTrace  MEDIUMTEXT
,             PRIMARY KEY (ErrorId)
,             FOREIGN KEY (AccountId) REFERENCES Accounts(AccountId) ON DELETE CASCADE
,             FOREIGN KEY (ProductId) REFERENCES Products(ProductId) ON DELETE CASCADE);

-- Provides information about a single occurrence of a particular error.
CREATE TABLE  ErrorOccurrences
(             ErrorOccurrenceId INT NOT NULL AUTO_INCREMENT
,             ErrorId           INT NOT NULL
,             EnvironmentId     INT NOT NULL
,             Message           TEXT
,             Server            VARCHAR(50)
,             UserName          VARCHAR(50)
,             Date              TIMESTAMP NOT NULL
,             PRIMARY KEY (ErrorOccurrenceId)
,             FOREIGN KEY (ErrorId) REFERENCES Errors(ErrorId) ON DELETE CASCADE
,             FOREIGN KEY (EnvironmentId) REFERENCES Environments(EnvironmentId) ON DELETE CASCADE);

-- Files provided with the error package.
CREATE TABLE  ErrorAttachments
(             ErrorOccurrenceId INT NOT NULL
,             FileName          VARCHAR(50) NOT NULL
,             FileType          VARCHAR(25) NOT NULL
,             Source            MEDIUMBLOB NOT NULL
,             PRIMARY KEY (ErrorOccurrenceId, FileName)
,             FOREIGN KEY (ErrorOccurrenceId) REFERENCES ErrorOccurrences(ErrorOccurrenceId) ON DELETE CASCADE);

-- Notes by users to give detail about the error that are useful for future troubleshooting or denoting resolution.
CREATE TABLE  ErrorNotes
(             ErrorNoteId   INT NOT NULL AUTO_INCREMENT
,             ErrorId       INT NOT NULL
,             UserId        INT NOT NULL
,             Message       TEXT NOT NULL
,             Date          TIMESTAMP
,             PRIMARY KEY (ErrorNoteId)
,             FOREIGN KEY (ErrorId) REFERENCES Errors(ErrorId) ON DELETE CASCADE
,             FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE);

-- Monitoring definitions.
CREATE TABLE  Monitors
(             MonitorId       INT NOT NULL AUTO_INCREMENT
,             AccountId       INT NOT NULL
,             ProductId       INT NOT NULL
,             EnvironmentId   INT NOT NULL
,             EndpointUri     VARCHAR(500) NOT NULL
,             IntervalSeconds INT NOT NULL
,             PRIMARY KEY (MonitorId)
,             FOREIGN KEY (AccountId) REFERENCES Accounts(AccountId) ON DELETE CASCADE
,             FOREIGN KEY (ProductId) REFERENCES Products(ProductId) ON DELETE CASCADE
,             FOREIGN KEY (EnvironmentId) REFERENCES Environments(EnvironmentId) ON DELETE CASCADE);

-- Monitoring results.
CREATE TABLE  MonitorResults
(             MonitorId                     INT NOT NULL
,             Metric                        VARCHAR(50) NOT NULL
,             Day                           CHAR(8) NOT NULL
,             RawData                       MEDIUMTEXT
,             AveragesPer15MinuteIntervals  VARCHAR(1000)
,             AverageForDay                 VARCHAR(25)
,             PRIMARY KEY (MonitorId, Metric, Day)
,             FOREIGN KEY (MonitorId) REFERENCES Monitors(MonitorId) ON DELETE CASCADE);
