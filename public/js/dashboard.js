$(document).ready (function () {

    var current_environment = $(".nav-tabs li.active").attr ("environment");

    $(".nav-tabs li a").click (function () {

        var new_environment = $(this).parent().attr ("environment");
        $(".nav-tabs li").removeClass ("active");
        $(this).parent().addClass ("active");
        return false;

    });

});


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

});
var ErrorAttachment = (function () {

    this.file_name = "";
    this.file_type = "";

});

var app = angular.module ("ErrorReporter", []);
app.controller ("DashboardController", ["$scope", function ($scope) {

    $scope.errors = [];

    $.ajax ("/api/session/errors")
    .done (function (results) {

        if (results.error) {
            // TODO: Show error message on screen
            console.log ("Error: " + results.error);
            return;
        }

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
            $scope.errors.push (error_occurrence);
        }

        $scope.$apply ();
        $("#RecentErrors").removeClass ("hidden");

    });

}]);