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
        $.ajax("/api/session/errors/" + current_environment)
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

                    if (results.data[i].attachments) {
                        for (var j = 0; j < results.data[i].attachments.length; j++) {
                            var error_attachment = new ErrorAttachment();
                            error_attachment.file_name = results.data[i].attachments[j].file_name;
                            error_attachment.file_type = results.data[i].attachments[j].file_type;
                            error_occurrence.attachments.push(error_attachment);
                        }
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