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
    $scope.errors.push (new ErrorOccurrence ());


}]);