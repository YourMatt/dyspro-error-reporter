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

            for (var i = 0; i < results.data.length; i++) {
               var error_occurrence = new ErrorOccurrence ();
               error_occurrence.error_occurrence_id = results.data[i].ErrorOccurrenceId;
               error_occurrence.environment = results.data[i].Environment;
               error_occurrence.message = results.data[i].Message;
               error_occurrence.server = results.data[i].Server;
               error_occurrence.user_name = results.data[i].UserName;
               error_occurrence.date = moment (results.data[i].Date);
               error_occurrence.error.error_id = results.data[i].ErrorId;
               error_occurrence.error.account_id = results.data[i].AccountId;
               error_occurrence.error.product = results.data[i].Product;
               error_occurrence.error.stack_trace = results.data[i].StackTrace;

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