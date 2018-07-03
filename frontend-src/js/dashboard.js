/***********************************************************************************************************************
 *
 * DASHBOARD PAGE
 *
 **********************************************************************************************************************/

app.controller ("DashboardController", ["$scope", function ($scope) {

    // default local storage options
    if (!localStorage.selectedEnvironment) localStorage.selectedEnvironment = "Dev"; // TODO: Set to use an environment held by the current account
    if (!localStorage.selectedFilterProduct) localStorage.selectedFilterProduct = "All Products";
    if (!localStorage.selectedFilterMinOccurrence) localStorage.selectedFilterMinOccurrence = 1;
    if (!localStorage.selectedFilterErrorEnumeration) localStorage.selectedFilterErrorEnumeration = "all";

    // local properties
    $scope.currentEnvironment = localStorage.selectedEnvironment;
    $scope.errorOccurrences = [];
    $scope.monitors = [];
    $scope.monitorStats = [];
    $scope.products = [];
    $scope.minOccurrenceOptions = [];
    $scope.filterProduct = localStorage.selectedFilterProduct;
    $scope.filterMinOccurrence = localStorage.selectedFilterMinOccurrence;
    $scope.filterErrorEnumeration = localStorage.selectedFilterErrorEnumeration;

    // local methods
    $scope.changeEnvironmentTab = dashboardPage.changeEnvironmentTab;
    $scope.selectProduct = dashboardPage.selectProduct;
    $scope.selectMinOccurrence = dashboardPage.selectMinOccurrence;
    $scope.formatMinOccurrenceText = dashboardPage.formatMinOccurrenceText;

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
        dashboardPage.loadErrorOccurrences();

    },

    // Loads default state of the filters bar.
    initFilters: function () {

        $("input[name=filter-error-enumeration][value=" + dashboardPage.angularScope.filterErrorEnumeration + "]").parent().click();
        $("input[name=filter-error-enumeration]").change(function () {
            var newErrorEnumeration = $(this).val();
            dashboardPage.updateAngularValue(function () {
                localStorage.selectedFilterErrorEnumeration = newErrorEnumeration;
                dashboardPage.angularScope.filterErrorEnumeration = newErrorEnumeration;
                dashboardPage.loadErrorOccurrences();
            });
        });

        dashboardPage.loadFilterOptionProducts();
        dashboardPage.loadFilterOptionMinOccurrences();

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
    loadFilterOptionProducts: function () {

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

    // Loads all options for the minimum number of occurrences filter.
    loadFilterOptionMinOccurrences: function () {

        var options = [];
        options.push({count: 1, title: "Occurred at least once"});
        options.push({count: 2, title: "Occurred more than once"});
        options.push({count: 5, title: "Occurred at least 5 times"});
        options.push({count: 10, title: "Occurred at least 10 times"});
        options.push({count: 25, title: "Occurred at least 25 times"});
        options.push({count: 50, title: "Occurred at least 50 times"});
        options.push({count: 100, title: "Occurred at least 100 times"});

        dashboardPage.updateAngularValue(function () {
            dashboardPage.angularScope.minOccurrenceOptions = options;
        });

    },

    // Loads error occurrences.
    loadErrorOccurrences: function (sinceDate) {

        var filters = {};
        filters.occurrenceThreshold = dashboardPage.angularScope.filterMinOccurrence;
        if (sinceDate) filters.sinceDate = sinceDate;
        if (dashboardPage.angularScope.filterProduct !== "All Products") filters.product = dashboardPage.angularScope.filterProduct;
        if (dashboardPage.angularScope.filterErrorEnumeration !== "all") filters.occurrenceFilter = dashboardPage.angularScope.filterErrorEnumeration;

        $.get("/api/errors/" + dashboardPage.angularScope.currentEnvironment, filters)
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

    },

    // Filters by a product name.
    selectProduct: function (name) {

        localStorage.selectedFilterProduct = name;

        dashboardPage.updateAngularValue(function () {
            dashboardPage.angularScope.filterProduct = localStorage.selectedFilterProduct;
            dashboardPage.loadErrorOccurrences();
        });

    },

    // Filters by a minimum number of occurrences.
    selectMinOccurrence: function (occurrenceCount) {

        localStorage.selectedFilterMinOccurrence = occurrenceCount;

        dashboardPage.updateAngularValue(function () {
            dashboardPage.angularScope.filterMinOccurrence = localStorage.selectedFilterMinOccurrence;
            dashboardPage.loadErrorOccurrences();
        });

    },

    // Displays text related to the minimum occurrence count.
    formatMinOccurrenceText: function (count) {

        for (var i = 0; i < dashboardPage.angularScope.minOccurrenceOptions.length; i++) {
            if (dashboardPage.angularScope.minOccurrenceOptions[i].count == count)
                return dashboardPage.angularScope.minOccurrenceOptions[i].title;
        }

        return count;

    }

};
