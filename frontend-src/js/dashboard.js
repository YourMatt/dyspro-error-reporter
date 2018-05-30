/***********************************************************************************************************************
 *
 * DASHBOARD PAGE
 *
 **********************************************************************************************************************/

app.controller ("DashboardController", ["$scope", function ($scope) {

    // local properties
    $scope.currentEnvironment = "Dev";
    $scope.errorOccurrences = [];

    // local methods
    $scope.loadErrorOccurrences = dashboardPage.loadErrorOccurrences;
    $scope.changeEnvironmentTab = dashboardPage.changeEnvironmentTab;

    // initialize the page
    dashboardPage.init($scope);

}]);

var dashboardPage = {

    angularScope: null, // allows access to $scope in DashboardController

    init: function (angularScope) {
        dashboardPage.angularScope = angularScope;

        dashboardPage.loadErrorOccurrences();

    },

    // Applies an object update to the related scope.
    updateAngularValue: function (command) {

        // run the provided function to update the value
        command();

        // evaluate if need to run $apply() - if left out, will generate errors when updating an existing value
        var phase = dashboardPage.angularScope.$root.$$phase;
        if (phase !== "$apply" && phase !== "$digest")
            dashboardPage.angularScope.$apply();

    },

    // Loads latest error occurrences.
    loadErrorOccurrences: function () {

        $.ajax("/api/errors/" + dashboardPage.angularScope.currentEnvironment + "/20")
        .done(function (results) {

            // add results to scope
            dashboardPage.updateAngularValue(function () {
                dashboardPage.angularScope.errorOccurrences = results;
            });

        })
        .fail(function (response) {
            notifications.errorFromServiceResponse(response);
        });

    },

    // Updates the current environment and loads all related error occurrences.
    changeEnvironmentTab: function (environmentName) {

        dashboardPage.updateAngularValue(function () {
            dashboardPage.angularScope.currentEnvironment = environmentName;
        });

        dashboardPage.loadErrorOccurrences ();
    }

};
