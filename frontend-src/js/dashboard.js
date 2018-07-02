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
    $scope.monitors = [];
    $scope.monitorStats = [];
    $scope.products = [];

    // local methods
    $scope.changeEnvironmentTab = dashboardPage.changeEnvironmentTab;

    // watch for changes in stats and update the graph accordingly
    $scope.$watch("monitorStats", dashboardPage.handleMonitorStatsChange, true);

    // initialize the page
    dashboardPage.init($scope);

}]);

var dashboardPage = {

    angularScope: null, // allows access to $scope in DashboardController

    init: function (angularScope) {
        dashboardPage.angularScope = angularScope;

        dashboardPage.initFilters();
        dashboardPage.loadMonitors();
        dashboardPage.loadProducts();
        dashboardPage.loadErrorOccurrences();

    },

    // Loads default state of the filters bar.
    initFilters: function () {

        var filterErrorEnumeration = "all";
        $("input[name=filter-error-enumeration][value=" + filterErrorEnumeration + "]").parent().click();

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

    // Loads all URI monitors.
    loadMonitors: function () {

        $.ajax("/api/monitors/" + dashboardPage.angularScope.currentEnvironment)
        .done(function (results) {

            // add results to scope
            dashboardPage.updateAngularValue(function () {
                dashboardPage.angularScope.monitors = results;
                dashboardPage.loadMonitorStats();
            });

        })
        .fail(function (response) {
            notifications.errorFromServiceResponse(response);
        });

    },

    // Loads stats for all current monitors.
    loadMonitorStats: function () {

        $.each(dashboardPage.angularScope.monitors, function (index, monitor) {

            $.ajax("/api/monitor/" + monitor.monitorId + "/stats/day") // TODO: Change last param to be driven by tab control
            .done(function (results) {

                // add results to scope
                dashboardPage.updateAngularValue(function () {
                    dashboardPage.angularScope.monitorStats[monitor.monitorId] = results[0];
                });

            })
            .fail(function (response) {
                notifications.errorFromServiceResponse(response);
            });

        });

    },

    // Loads all products to allow select from existing.
    loadProducts: function () {

        $.ajax("/api/products")
        .done(function (results) {

            dashboardPage.updateAngularValue(function () {
                dashboardPage.angularScope.products = results;
            });

        })
        .fail(function (response) {
            notifications.errorFromServiceResponse(response);
        });

    },

    // Loads error occurrences.
    loadErrorOccurrences: function (sinceDate) {

        $.ajax("/api/errors/" + dashboardPage.angularScope.currentEnvironment + ((sinceDate) ? ("/" + sinceDate) : ""))
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

        localStorage.selectedEnvironment = environmentName;

        dashboardPage.updateAngularValue(function () {
            dashboardPage.angularScope.currentEnvironment = localStorage.selectedEnvironment;
        });

        dashboardPage.loadMonitors();
        dashboardPage.loadErrorOccurrences ();

    },

    // Updates graph data whenever stats are updated.
    handleMonitorStatsChange: function (stats) {
        if (!stats.length) return;

        // TODO: This is a POC only - update to load for each monitor and provide directly to graphing object instead of updating DOM
        $("scores", $("#ProgressGraphData")).text (stats[9].averagedStats);
        $("dates", $("#ProgressGraphData")).text (stats[9].averagedStats);
        dysproGraph.buildGraph ();

    }

};
