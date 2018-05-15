/***********************************************************************************************************************
 *
 * SETTINGS PAGE
 *
 **********************************************************************************************************************/

app.controller ("SettingsController", ["$scope", function ($scope) {

    var userId = $("userid", "#account-metadata").text();

    $scope.user = {};

    $scope.loadUser = function () {

        $.ajax("/api/user/" + userId)
        .done(function (results) {
            $scope.user = results;
            $scope.$apply();
        })
        .fail(function (response) {
            notifications.errorFromServiceResponse(response);
        });

    };

    $scope.saveUser = function () {
        console.log($scope.user);

        $.ajax({
            type: "put",
            url: "/api/user/" + userId,
            data: $scope.user
        })
        .done(function (results) {
            notifications.success("Successfully saved your user information.");
        })
        .fail(function (response) {
            notifications.errorFromServiceResponse(response);
        });

    };

    $scope.loadUser();

}]);
