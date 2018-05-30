var app = angular.module ("ErrorReporter", []);

$(document).ready (function () {

    // build JSON tables
    utilities.formatJsonTables();

    // add shade behind popover bubbles
    $(".popover-link")
    .on("show.bs.popover", function () {
        $("#popover-shade")
        .height($(document).height() - 1)
        .show();
    })
    .on("hidden.bs.popover", function () {
        $("#popover-shade").hide();
    });

});
