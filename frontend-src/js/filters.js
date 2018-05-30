/***********************************************************************************************************************
 *
 * ANGULAR CUSTOM FILTERS
 *
 **********************************************************************************************************************/

// Returns only the first line of the provided text.
app.filter("firstLine", function () {
    return function (input) {
        return input.split("\n")[0];
    }
});

// Formats a date string using the moment library.
app.filter("formatDate", function () {
    return function (date, format) {
        if (!format) format = "MM/DD [at] h:mm A";
        var dateMoment = moment(date);
        return dateMoment.format(format);
    }
});
