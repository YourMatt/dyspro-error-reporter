var current_environment;

$(document).ready (function () {
});

var app = angular.module ("ErrorReporter", []);
app.controller ("DashboardController", ["$scope", function ($scope) {

    $scope.error_occurrences = [];

    $scope.changeEnvironmentTab = function (event) {
        current_environment = $(event.currentTarget).parent().attr ("environment");
        $(".nav-tabs li").removeClass ("active");
        $(event.currentTarget).parent().addClass ("active");
        this.reloadErrorOccurrences ();
    };

    $scope.reloadErrorOccurrences = function () {
        if (! current_environment) current_environment = $(".nav-tabs li.active").attr("environment"); // TODO: load this from a different method
        $.ajax("/api/errors/" + current_environment)
            .done(function (results) {

                if (results.error) {
                    // TODO: Show error message on screen
                    console.log("Error: " + results.error);
                    return;
                }

                $scope.error_occurrences = [];
                for (var i = 0; i < results.data.length; i++) {
                    var error_occurrence = new ErrorOccurrence ();
                    error_occurrence.error_occurrence_id = results.data[i].ErrorOccurrenceId;
                    error_occurrence.environment = results.data[i].Environment;
                    error_occurrence.message = results.data[i].Message;
                    error_occurrence.server = results.data[i].Server;
                    error_occurrence.user_name = results.data[i].UserName;
                    error_occurrence.date = moment(results.data[i].Date);
                    error_occurrence.error.error_id = results.data[i].ErrorId;
                    error_occurrence.error.account_id = results.data[i].AccountId;
                    error_occurrence.error.product = results.data[i].Product;
                    error_occurrence.error.stack_trace = results.data[i].StackTrace;

                    $scope.error_occurrences.push(error_occurrence);

                }

                // refresh the error list and show the table
                $scope.$apply();
                $("#RecentErrors").removeClass("hidden");

            });
    };

    $scope.reloadErrorOccurrences ();

}]);