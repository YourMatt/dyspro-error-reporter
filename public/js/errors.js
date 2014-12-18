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
var ErrorOccurrenceStats = (function () {

   this.num_occurrences = 0;
   this.date_first_occurrence = 0;
   this.date_last_occurrence = 0;
   this.all_on_single_day = false;

});

var app = angular.module ("ErrorReporter", []);
app.controller ("ErrorHistoryController", ["$scope", function ($scope) {

   $scope.error_occurrences = [];

   // build the URI
   var uri = "";
   var meta_environment = $("environment", "#error-occurrence-metadata").text();
   if (meta_environment) {
      var meta_error_id = $("errorid", "#error-occurrence-metadata").text();
      uri = "/api/session/errors/" + meta_environment + "/" + meta_error_id;
   }
   else if (typeof (current_environment) !== "undefined") uri = "/api/session/errors/" + current_environment;

   if (! uri) return;

   // reload the error occurrences from the service
   $scope.reloadErrorOccurrences = function () {
      $.ajax(uri)
         .done(function (results) {

            if (results.error) {
               // TODO: Show error message on screen
               console.log("Error: " + results.error);
               return;
            }

            $scope.error_occurrences = [];
            var error_occurrence_stats = new ErrorOccurrenceStats ();

            for (var i = 0; i < results.data.length; i++) {
               var error_occurrence = new ErrorOccurrence ();
               error_occurrence.error_occurrence_id = results.data[i].error_occurrence_id;
               error_occurrence.environment = results.data[i].environment;
               error_occurrence.message = results.data[i].message;
               error_occurrence.server = results.data[i].server;
               error_occurrence.user_name = results.data[i].user_name;
               error_occurrence.date = moment (results.data[i].date);
               error_occurrence.error.error_id = results.data[i].error_id;
               error_occurrence.error.account_id = results.data[i].account_id;
               error_occurrence.error.product = results.data[i].product;
               error_occurrence.error.stack_trace = results.data[i].stack_trace;

               if (results.data[i].attachments) {
                  for (var j = 0; j < results.data[i].attachments.length; j++) {
                     var error_attachment = new ErrorAttachment();
                     error_attachment.file_name = results.data[i].attachments[j].file_name;
                     error_attachment.file_type = results.data[i].attachments[j].file_type;
                     error_occurrence.attachments.push(error_attachment);
                  }
               }

               $scope.error_occurrences.push(error_occurrence);

               // check to change stats // TODO: Move stat calculations into different method
               error_occurrence_stats.num_occurrences++;
               if (! error_occurrence_stats.date_first_occurrence || moment (results.data[i].date) < error_occurrence_stats.date_first_occurrence)
                  error_occurrence_stats.date_first_occurrence = moment (results.data[i].date);
               if (moment (results.data[i].date) > error_occurrence_stats.date_last_occurrence)
                  error_occurrence_stats.date_last_occurrence = moment (results.data[i].date);

            }
            
            if (error_occurrence_stats.date_first_occurrence.format ("MMDDYYYY") == error_occurrence_stats.date_last_occurrence.format ("MMDDYYYY"))
               error_occurrence_stats.all_on_single_day = true;
            $scope.error_occurrence_stats = error_occurrence_stats;

            // refresh the error list and show the table
            $scope.$apply();
            $("#RecentErrors").removeClass("hidden");

         });
   };

   $scope.reloadErrorOccurrences ();

}]);