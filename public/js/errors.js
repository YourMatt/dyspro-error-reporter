// add models

var Error = (function () {

   this.error_id = 0;
   this.account_id = 0;
   this.product = "";
   this.stack_trace = "";

});
var ErrorOccurrence = (function () {

   this.error = new Error ();
   this.error_occurrence_id = 0;
   this.environment = "";
   this.message = "";
   this.server = "";
   this.user_name = "";
   this.date = 0;
   this.attachments = [];

});
var ErrorAttachment = (function () {

   this.file_name = "";
   this.file_type = "";

});

var app = angular.module ("ErrorReporter", []);
app.controller ("ErrorHistoryController", ["$scope", function ($scope) {

   $scope.error_occurrences = [];

   $scope.reloadErrorOccurrences = function () {
      $.ajax("/api/session/errors/dev")
         .done(function (results) {

            if (results.error) {
               // TODO: Show error message on screen
               console.log("Error: " + results.error);
               return;
            }

            $scope.error_occurrences = [];
            for (var i = 0; i < results.data.length; i++) {
               var error_occurrence = new ErrorOccurrence ();
               error_occurrence.error_occurrence_id = results.data[i].error_occurrence_id;
               error_occurrence.environment = results.data[i].environment;
               error_occurrence.message = results.data[i].message;
               error_occurrence.server = results.data[i].server;
               error_occurrence.user_name = results.data[i].user_name;
               error_occurrence.date = moment(results.data[i].date);
               error_occurrence.error.error_id = results.data[i].error_id;
               error_occurrence.error.account_id = results.data[i].account_id;
               error_occurrence.error.product = results.data[i].product;
               error_occurrence.error.stack_trace = results.data[i].stack_trace;

               for (var j = 0; j < results.data[i].attachments.length; j++) {
                  var error_attachment = new ErrorAttachment ();
                  error_attachment.file_name = results.data[i].attachments[j].file_name;
                  error_attachment.file_type = results.data[i].attachments[j].file_type;
                  error_occurrence.attachments.push (error_attachment);
               }

               $scope.error_occurrences.push(error_occurrence);
            }

            // refresh the error list and show the table
            $scope.$apply();
            $("#RecentErrors").removeClass("hidden");

         });
   };

   $scope.reloadErrorOccurrences ();

}]);