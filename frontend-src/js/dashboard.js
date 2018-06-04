/***********************************************************************************************************************
 *
 * DASHBOARD PAGE
 *
 **********************************************************************************************************************/

app.controller ("DashboardController", ["$scope", function ($scope) {

    // default local storage options
    if (!localStorage.selectedEnvironment) localStorage.selectedEnvironment = "Dev"; // TODO: Set to use an environment held by the current account

    // local properties
    $scope.currentEnvironment = localStorage.selectedEnvironment;
    $scope.errorOccurrences = [];
    $scope.totalErrors = 0;

    // local methods
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

    // Loads error occurrences.
    loadErrorOccurrences: function (sinceDate) {

        $.ajax("/api/errors/" + dashboardPage.angularScope.currentEnvironment + ((sinceDate) ? ("/" + sinceDate) : ""))
        .done(function (results) {

            // add results to scope
            dashboardPage.updateAngularValue(function () {
                dashboardPage.angularScope.errorOccurrences = results;
                dashboardPage.angularScope.totalErrors = results.length;
            });

        })
        .fail(function (response) {
            notifications.errorFromServiceResponse(response);
        });

    },

    // Updates the current environment and loads all related error occurrences.
    changeEnvironmentTab: function (environmentName) {

        localStorage.selectedEnvironment = environmentName;

        dashboardPage.updateAngularValue(function () {
            dashboardPage.angularScope.currentEnvironment = localStorage.selectedEnvironment;
        });

        dashboardPage.loadErrorOccurrences ();
    }

};
