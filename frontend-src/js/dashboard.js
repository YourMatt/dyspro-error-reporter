var current_environment;

app.controller ("DashboardController", ["$scope", function ($scope) {

    $scope.error_occurrences = [];

    $scope.changeEnvironmentTab = function (event) {

        current_environment = $(event.currentTarget).text().trim();
        $(".nav-tabs a").removeClass("active");
        $(event.currentTarget).addClass("active");

        this.reloadErrorOccurrences ();
    };

    $scope.reloadErrorOccurrences = function () {
        if (! current_environment) current_environment = $(".nav-tabs a.active").text().trim(); // TODO: load this from a different method

        $.ajax("/api/errors/" + current_environment + "/20")
            .done(function (results) {

                if (results.error) {
                    // TODO: Show error message on screen
                    console.log("Error: " + results.error);
                    return;
                }

                $scope.error_occurrences = [];
                for (var i = 0; i < results.length; i++) {
                    var error_occurrence = new ErrorOccurrence ();
                    error_occurrence.error_occurrence_id = results[i].ErrorOccurrenceId;
                    error_occurrence.environment = results[i].Environment;
                    error_occurrence.message = results[i].Message;
                    error_occurrence.server = results[i].Server;
                    error_occurrence.user_name = results[i].UserName;
                    error_occurrence.date = moment(results[i].Date);
                    error_occurrence.error.error_id = results[i].ErrorId;
                    error_occurrence.error.account_id = results[i].AccountId;
                    error_occurrence.error.product = results[i].ProductName;
                    error_occurrence.error.stack_trace = results[i].StackTrace;

                    $scope.error_occurrences.push(error_occurrence);

                }

                // refresh the error list and show the table
                $scope.$apply();
                $("#RecentErrors").removeClass("hidden");

            });
    };

    $scope.reloadErrorOccurrences ();

}]);