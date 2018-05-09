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
      uri = "/api/errors/" + meta_environment + "/" + meta_error_id;
   }
   else if (typeof (current_environment) !== "undefined") uri = "/api/errors/" + current_environment;

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

            for (var i = 0; i < results.length; i++) {
               var error_occurrence = new ErrorOccurrence ();
               error_occurrence.error_occurrence_id = results[i].ErrorOccurrenceId;
               error_occurrence.environment = results[i].Environment;
               error_occurrence.message = results[i].Message;
               error_occurrence.server = results[i].Server;
               error_occurrence.user_name = results[i].UserName;
               error_occurrence.date = moment (results[i].Date);
               error_occurrence.error.error_id = results[i].ErrorId;
               error_occurrence.error.account_id = results[i].AccountId;
               error_occurrence.error.product = results[i].Product;
               error_occurrence.error.stack_trace = results[i].StackTrace;

               $scope.error_occurrences.push(error_occurrence);

               // check to change stats // TODO: Move stat calculations into different method
               error_occurrence_stats.num_occurrences++;
               if (! error_occurrence_stats.date_first_occurrence || moment (results[i].Date) < error_occurrence_stats.date_first_occurrence)
                  error_occurrence_stats.date_first_occurrence = moment (results[i].Date);
               if (moment (results[i].Date) > error_occurrence_stats.date_last_occurrence)
                  error_occurrence_stats.date_last_occurrence = moment (results[i].Date);

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