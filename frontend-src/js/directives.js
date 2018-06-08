/***********************************************************************************************************************
 *
 * ANGULAR CUSTOM DIRECTIVES
 *
 **********************************************************************************************************************/

// Fixes error list tables after adding all records.
app.directive("fixerrorlistwidth", function () {
    return function (scope, element, attrs) {
        if (scope.$last) {
            utilities.restrictFullWidthTableToMaxWidthOfArea();
        }
    }
});
