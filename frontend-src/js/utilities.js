/***********************************************************************************************************************
 *
 * GENERAL UTILITIES
 *
 **********************************************************************************************************************/

var utilities = {

    scrollToTopOfPage: function () {

        $("html, body")
        .stop()
        .animate(
            {scrollTop:0},
            300,
            "swing"
        );

    },

    // This converts JSON within a table-json classed element into a table.
    formatJsonTables: function () {

        $.each($(".table-json"), function (index, element) {
            var content = $(element).text();

            try {

                var parsedContent = JSON.parse(content);
                var columnTitles = [];

                for (var i = 0; i < parsedContent.length; i++) {
                    for (var title in parsedContent[i]) {
                        if (columnTitles.indexOf(title) < 0)
                            columnTitles.push(title);
                    }
                }

                var table = "<table class='table'>";
                table += "<tr>";
                for (var i = 0; i < columnTitles.length; i++) {
                    table += "<td>" + columnTitles[i] + "</td>";
                }
                table += "</tr>";
                for (var i = 0; i < parsedContent.length; i++) {
                    table += "<tr>";
                    for (var j = 0; j < columnTitles.length; j++) {
                        var content = parsedContent[i][columnTitles[j]];
                        if (typeof content == "undefined") content = "";
                        table += "<td>" + content + "</td>";
                    }
                    table += "</tr>";
                }
                table += "</table>";

                $(element).html(table);

            }
            catch (e) {}
        });

    }

};
