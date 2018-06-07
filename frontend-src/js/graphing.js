/***********************************************************************************************************************
 *
 * GRAPHING ACTIONS
 *
 **********************************************************************************************************************/

$(document).ready (function () {

    dysproGraph.BuildGraph();

});
$(window).resize (function () {

    dysproGraph.BuildGraph ();

});

var dysproGraph = {

    graphType: "",              // loaded from SVG element
    gameData: {
        scores: [],             // loaded from HTML instructions
        levels: [],             // loaded from HTML instructions
        times: [],              // loaded from HTML instructions
        dates: [],              // loaded from HTML instructions
        stats: {                // added through initialize graph method
            highScore: 0,
            lowScore: 0,
            highLevel: 0
        },
        totalScores: 0,
        highScoreIndex: 0,      // set when the high score is found
        lastSelectedIndex: 0    // set when the high score is found and updated after showing a different score
    },
    lastGraphType: "",
    lastBuildWidth: 0,
    canvas: null,
    dims: {
        width: 0,               // following will be overwritten on load and resize
        height: 0,
        graphPositionTop: 0,
        graphPositionBottom: 0,
        graphPositionLeft: 0,
        graphPositionRight: 0,
        graphWidth: 0,
        graphHeight: 0,
        graphScoreSpacing: 0,
        graphLevelSpacing: 0,
        graphMarginTop: 30,     // area above the graph area
        graphMarginBottom: 50,  // area below the graph area
        graphMarginMinLeft: 25, // minimum margin for left and right margins
        labelMarginTop: 5,      // spacing from the top where labels should be from the top of the graph
        labelMarginLeft: 10,    // spacing from the left axis where labels should be from the left of the graph
        labelMarginBottom: 14,  // spacing from the bottom axis where labels should be from the bottom of the graph
        graphPadding: 5,        // spacing from top and bottom bounds within the graph
    },
    colors: {
        axisLine: "#888888",
        graphLine: "#333333",
        levelWithoutTime: "#e6e6e6",
        alert: [ // ranges from worst to best
            "#ed2024",
            "#e85c25",
            "#e98423",
            "#e9b235",
            "#e4c634",
            "#d5d026",
            "#cece25",
            "#aed147",
            "#93c847",
            "#69bd45"
        ]
    },
    sizes: {
        axisLine: 2,
        graphLine: 3,
        bestLine: 1,
        barGraphWidthPercent: 80,        // the percentage of the available width the bar with use
        labelSmall: 14,
        labelMedium: 20,
        labelLarge: 26,
        animationTime: 250
    },
    elements: {
        scoreIndicatorLine: null,
        scoreIndicatorScore: null,
        scoreIndicatorDate: null,
        graphLine: null
    },

    BuildGraph: function () {
        if (! this.InitializeGraph ()) return;

        this.canvas.clear ();
        this.DrawGraph ();

    },

    InitializeGraph: function () {

        if (! $("#ProgressGraph").length) return false;
        if (! this.canvas) this.canvas = Snap ("#ProgressGraph");

        // load the graph type
        this.graphType = $("#ProgressGraph").attr ("graphtype");

        // load the base size information from the HTML page
        this.dims.width = $("#ProgressGraph").width ();
        this.dims.height = $("#ProgressGraph").height ();
        //if (this.dims.width == this.lastBuildWidth && this.graphType == this.lastGraphType) return false; // don't rebuild if the graph hasn't changed size and hasn't changed type, even if the page has
        this.lastBuildWidth = this.dims.width;
        this.lastGraphType = this.graphType;

        // load game data from the HTML page
        this.gameData.scores = this.SplitDataElementsAsInt ($("scores", $("#ProgressGraphData")).text ());
        this.gameData.dates = this.SplitDataElementsAsInt ($("dates", $("#ProgressGraphData")).text ());
        this.gameData.totalScores = this.gameData.scores.length;

        // load base stats about the game deriving from the provided data
        this.LoadGameStats ();

        // load positional information for the graph - this has to happen after loading stats because the average score
        // is used as a label and will define the margin for the left and right of the graph
        this.LoadGraphPositions ();

        return true;

    },

    LoadGraphPositions: function () {

        // set the top, bottom and height of the graph
        this.dims.graphPositionTop = this.dims.graphMarginTop;
        this.dims.graphPositionBottom = this.dims.height - this.dims.graphMarginBottom;
        this.dims.graphHeight = this.dims.graphPositionBottom - this.dims.graphPositionTop;

        this.dims.graphPositionLeft = this.dims.graphMarginMinLeft; // set minimum width of the margin area

        this.dims.graphPositionRight = this.dims.width - this.dims.graphPositionLeft;
        this.dims.graphWidth = this.dims.graphPositionRight - this.dims.graphPositionLeft;

    },

    LoadGameStats: function () {

        var highScore = 0;
        var lowScore = 0;
        var totalScores = 0;
        var highLevel = 0;
        var numScores = this.gameData.scores.length;

        if (numScores) {
            highScore = this.gameData.scores[0];
            lowScore = this.gameData.scores[0];

            for (var i = 0; i < numScores; i++) {
                if (this.gameData.scores[i] > highScore) highScore = this.gameData.scores[i];
                if (this.gameData.scores[i] < lowScore) lowScore = this.gameData.scores[i];
                if (this.gameData.levels[i] > highLevel) highLevel = this.gameData.levels[i];
                totalScores += this.gameData.scores[i];
            }
        }

        this.gameData.stats.highScore = highScore;
        this.gameData.stats.lowScore = lowScore;
        this.gameData.stats.highLevel = highLevel;

    },

    DrawGraph: function () {

        if (this.graphType == "line") this.DrawLineGraph ();
        //else if (this.graphType == "levels") this.DrawLevelGraph (); // TODO: Change to "bar" as type

    },

    DrawLineGraph: function () {

        this.DrawAxisLines ();
        //this.DrawBottomDateLabels ();

        var graphTopLimit = this.dims.graphPositionTop + this.dims.graphPadding;
        var graphBottomLimit = this.dims.graphPositionBottom - this.dims.graphPadding;
        var graphLimitHeight = graphBottomLimit - graphTopLimit;

        var pathInstruction = "";
        var numScores = this.gameData.scores.length;
        var numScoreIndexes = numScores - 1;

        var scorePositionLeft = 0;
        var scoreMidpointPositionLeft = 0;
        var scorePositionTop = 0;
        var scorePreviousPositionTop = 0;
        var scoreNextPositionTop = 0;

        var handlePositionTop = 0;
        var handlePreviousPositionTop = 0;
        var handlePositionTopAdjustment = 0;
        var slopeDirection = 0;             // set to -1 for multiple points sloping up, 1 for down, and 0 if changing direction

        this.dims.graphScoreSpacing = this.dims.graphWidth / numScoreIndexes;

        // draw a single line if only one score has been logged
        if (this.gameData.totalScores == 1) {

            pathInstruction = "M{0} {1}L{2} {3}".format (
                this.dims.graphPositionLeft,
                this.dims.graphPositionTop + this.dims.graphHeight / 2,
                this.dims.graphPositionRight,
                this.dims.graphPositionTop + this.dims.graphHeight / 2
            );

        }

        // draw a path if multiple scores have been logged
        else {

            // set up the instructions to draw the path across all game scores
            for (var i = 0; i < numScores; i++) {

                // set the x position to be the left edge plus percentage across the width of the graph
                scorePositionLeft = parseInt(this.dims.graphPositionLeft + i * this.dims.graphScoreSpacing);

                // set the y position to be the bottom edge minus the percent of the height of the graph
                scorePositionTop = parseInt(graphBottomLimit - graphLimitHeight * (this.gameData.scores[i] - this.gameData.stats.lowScore) / (this.gameData.stats.highScore - this.gameData.stats.lowScore));

                // if just starting, move to the starting point
                if (!i) {
                    pathInstruction += "M{0} {1}".format(scorePositionLeft, scorePositionTop);
                }

                // if connecting a point, draw a curve to the new point
                else {

                    // set the X position handles to be the same midpoint between the current and previous score positions
                    scoreMidpointPositionLeft = parseInt(this.dims.graphPositionLeft + (i - 0.5) * this.dims.graphScoreSpacing);

                    // change the position of the curve handles if 3 scores in a row either ascending or descending - this
                    // rounds out the curve so that there aren't flat spots at each of these successive points
                    handlePositionTop = scorePositionTop;
                    slopeDirection = 0;
                    if (i > 0 && i < numScores - 1) {

                        // find if the scores are moving up or down
                        if (this.gameData.scores[i - 1] < this.gameData.scores[i] && this.gameData.scores[i] < this.gameData.scores[i + 1]) {
                            slopeDirection = -1;
                        }
                        else if (this.gameData.scores[i - 1] > this.gameData.scores[i] && this.gameData.scores[i] > this.gameData.scores[i + 1]) {
                            slopeDirection = 1;
                        }

                        // if found slope, then move the handles up or down by the smallest difference between the previous, current and next scores
                        if (slopeDirection) {
                            scoreNextPositionTop = parseInt(graphBottomLimit - graphLimitHeight * (this.gameData.scores[i + 1] - this.gameData.stats.lowScore) / (this.gameData.stats.highScore - this.gameData.stats.lowScore));
                            handlePositionTopAdjustment = Math.min(slopeDirection * (scorePositionTop - scorePreviousPositionTop), slopeDirection * (scoreNextPositionTop - scorePositionTop));
                            handlePositionTop = scorePositionTop - (slopeDirection * handlePositionTopAdjustment);
                        }

                    }

                    // if there wasn't a specific handle position set previously, then use the last score
                    if (!handlePreviousPositionTop) handlePreviousPositionTop = scorePreviousPositionTop;

                    // add the curve to the path instructions
                    pathInstruction += "C{0} {1} {2} {3} {4} {5}".format(
                        scoreMidpointPositionLeft, // X position of handle connected to the previous point
                        handlePreviousPositionTop, // Y position of handle connected to the previous point
                        scoreMidpointPositionLeft, // X position of handle connected to the current point
                        handlePositionTop,         // Y position of handle connected to the current point
                        scorePositionLeft,         // X position of the point
                        scorePositionTop           // Y position of the point
                    );

                }

                // add the high score if found
                if (this.gameData.scores[i] == this.gameData.stats.highScore) {
                    this.gameData.highScoreIndex = i;
                    this.gameData.lastSelectedIndex = i;
                    this.DrawScoreIndicator(scorePositionLeft, i);
                }

                // add hover points to show the score for this date
                this.canvas.rect (
                    (i) ? scoreMidpointPositionLeft : this.dims.graphPositionLeft,
                    this.dims.graphPositionTop,
                    this.dims.graphWidth / numScoreIndexes,
                    this.dims.graphHeight)
                .attr ({
                    fill: "rgba(255,255,255,0)",                 // set to transparent fill - mouseover will not work if fill set to none
                    scoreIndex: i,
                    linePositionLeft: scorePositionLeft
                }).mouseover(dysproGraphEventHandlers.MoveScoreIndicator);

                // set the last y position so can use for the handle when drawing the next curve
                scorePreviousPositionTop = scorePositionTop;

                // set the previous handle position based on any slope that was applied or set to 0 if none found
                handlePreviousPositionTop = (slopeDirection) ? scorePositionTop + (slopeDirection * handlePositionTopAdjustment) : 0;

            }

        }

        // draw the score progress line
        var graphLineStyle = {
            stroke: this.colors.graphLine,
            strokeWidth: this.sizes.graphLine,
            fill: "none"
        };
        this.elements.graphLine = this.canvas.path (pathInstruction)
        .attr (graphLineStyle);

    },

    /*
    DrawLevelGraph: function () {

        this.DrawAxisLines ();
        this.DrawBottomDateLabels ();
        this.DrawLeftLevelLabels ();

        var numLevels= this.gameData.levels.length;
        this.dims.graphLevelSpacing = this.dims.graphWidth / numLevels;
        var levelPositionLeft = 0;
        var levelPositionTop = 0;

        var barWidthPercent = this.sizes.barGraphWidthPercent / 100;
        var barLeftOffset = 0;
        var barWidth = 0;

        for (var i = 0; i < numLevels; i++) {

            // set the x position to be the left edge plus percentage across the width of the graph
            levelPositionLeft = parseInt(this.dims.graphPositionLeft + i * this.dims.graphLevelSpacing);

            // skip any without logged levels
            if (! this.gameData.levels[i]) continue;

            barWidth = (this.dims.graphWidth / numLevels);
            barLeftOffset = (1 - barWidthPercent) / 2 * barWidth;
            barWidth -= barLeftOffset * 2;

            // set the y position to be the bottom edge minus the percent of the height of the graph
            levelPositionTop = parseInt(this.dims.graphPositionBottom - this.dims.graphHeight * (this.gameData.levels[i]) / (this.gameData.stats.highLevel));

            this.canvas.rect (
                levelPositionLeft + barLeftOffset,
                levelPositionTop,
                barWidth,
                this.dims.graphPositionBottom - levelPositionTop - this.sizes.axisLine / 2
            ).attr({
                fill: this.colors.levelWithoutTime,
                stroke: "none"
            });

        }

    },
    */

    DrawAxisLines: function () {

        var axisStyle = {
            stroke: this.colors.axisLine,
            strokeWidth: this.sizes.axisLine
        };

        // add x axis
        this.canvas.path ("M{0} {1}L{2} {3}".format (
            this.dims.graphPositionLeft,
            this.dims.graphPositionBottom,
            this.dims.graphPositionRight,
            this.dims.graphPositionBottom
        )).attr (axisStyle);

        // add y axis
        this.canvas.path ("M{0} {1}L{2} {3}".format (
            this.dims.graphPositionLeft,
            this.dims.graphPositionTop,
            this.dims.graphPositionLeft,
            this.dims.graphPositionBottom
        )).attr (axisStyle);

    },

    /*
    DrawLeftLevelLabels: function () {

        // set the level to show for each horizontal line
        var levelIncrement = 1;
        if (this.gameData.stats.highLevel >= 50) levelIncrement = 10;
        else if (this.gameData.stats.highLevel >= 20) levelIncrement = 5;
        else if (this.gameData.stats.highLevel >= 8) levelIncrement = 2;

        var levelPercent = 0;
        var lineColorIndex = 0;
        var linePositionTop = 0;
        var label;

        // lop through levels by the increment
        for (var i = levelIncrement; i <= this.gameData.stats.highLevel; i += levelIncrement) {

            levelPercent = i / this.gameData.stats.highLevel;
            lineColorIndex = 9 - Math.floor (levelPercent * 9.99);
            linePositionTop = this.dims.graphPositionBottom - (this.dims.graphHeight * levelPercent);

            // draw the level lines
            this.canvas.path ("M{0} {1}L{2} {3}".format (
                this.dims.graphPositionLeft,
                linePositionTop,
                this.dims.graphPositionRight,
                linePositionTop
            )).attr ({
                stroke: this.colors.alert[lineColorIndex],
                strokeWidth: 1
            });

            // draw the labels
            label = this.canvas.text (0, 0, i)
            .attr ({
                fontSize: this.sizes.labelSmall,
                fill: this.colors.alert[lineColorIndex]
            });
            label.transform ("t{0} {1}".format (
                this.dims.graphPositionLeft - (label.getBBox().width + this.dims.labelMarginLeft),
                linePositionTop + this.sizes.labelSmall / 2 - 2
            ));

        }

    },
    */

    /*
    DrawBottomDateLabels: function () {

        // set the label text
        var startDateLabelText = this.GetFormattedStartDate (new Date (this.gameData.dates[0]));
        var endDateLabelText = this.GetFormattedEndDate (new Date (this.gameData.dates[this.gameData.dates.length - 1]));

        // add the labels to the canvas
        var labelStyle = {
            fontSize: this.sizes.labelMedium + "px",
            fill: this.colors.axisLine
        };

        var labelDateStart = this.canvas.text (0, 0, startDateLabelText)
        .attr (labelStyle);

        var labelDateEnd = this.canvas.text (0, 0, endDateLabelText)
        .attr (labelStyle);

        // calculate positions
        var leftPositionDateStart = this.dims.graphPositionLeft - labelDateStart.getBBox().width / 2;
        var leftPositionDateEnd = this.dims.graphPositionRight - labelDateEnd.getBBox().width / 2;
        var topPosition = this.dims.graphPositionBottom + this.dims.labelMarginBottom + this.sizes.labelMedium;

        // move the labels to final position
        labelDateStart.transform ("t{0},{1}".format (
            leftPositionDateStart,
            topPosition
        ));

        labelDateEnd.transform ("t{0},{1}".format (
            leftPositionDateEnd,
            topPosition
        ));

    },
    */

    DrawScoreIndicator: function (positionLeft, scoreIndex) {

        var topLabelStyle = {
            fontSize: this.sizes.labelMedium + "px",
            fill: this.colors.alert[0]
        };
        var bottomLabelStyle = {
            fontSize: this.sizes.labelSmall + "px",
            fill: this.colors.alert[0]
        };
        var scoreLine = {
            stroke: this.colors.alert[0],
            strokeWidth: this.sizes.bestLine,
            fill: "none",
            strokeDasharray: "5,5"
        };

        // add the vertical line
        this.elements.scoreIndicatorLine = this.canvas.path ("M{0} {1}L{2} {3}".format (
            positionLeft,
            this.dims.graphPositionTop,
            positionLeft,
            this.dims.graphPositionBottom
        )).attr (scoreLine);

        // add score as the top label
        this.elements.scoreIndicatorScore = this.canvas.text (0, 0, this.gameData.stats.highScore.toLocaleString ())
        .attr (topLabelStyle);
        this.elements.scoreIndicatorScore.transform ("t{0},{1}".format (
            positionLeft - (this.elements.scoreIndicatorScore.getBBox().width / 2),
            this.dims.graphPositionTop - this.dims.labelMarginTop
        ));

        // add date below the graph
        var dateHighScore = new Date (this.gameData.dates[scoreIndex]);
        this.elements.scoreIndicatorDate = this.canvas.text (0, 0, moment.unix(dateHighScore).format("MM/DD/YYYY"))
        .attr (bottomLabelStyle);
        this.elements.scoreIndicatorDate.transform ("t{0},{1}".format (
            positionLeft - (this.elements.scoreIndicatorDate.getBBox().width / 2),
            this.dims.graphPositionBottom + this.sizes.labelSmall
        ));

    },

    /*
    GetFormattedStartDate: function (startDate) {

        // always use the month and year for the start date instead of time ago
        return moment.unix(startDate).format("MMMM YYYY");

    },
    */

    /*
    GetFormattedEndDate: function (endDate) {

        var today = new Date (Date.parse (moment().format("MM/DD/YYYY")));
        var yesterday = new Date (today - 1000 * 60 * 60 * 24);
        var thisWeek = new Date (today - 1000 * 60 * 60 * 24 * today.getDay ());
        var lastWeek = new Date (today - 1000 * 60 * 60 * 24 * (today.getDay () + 7));
        var thisMonth = new Date (Date.parse (moment().format("MM/01/YYYY")));
        var lastMonth = new Date (Date.parse (moment().subtract(1, 'months').format("MM/01/YYYY")));

        var endDescription = "";
        if (endDate > today) endDescription = "Today";
        else if (endDate > yesterday) endDescription = "Yesterday";
        else if (endDate > thisWeek) endDescription = "This Week";
        else if (endDate > lastWeek) endDescription = "Last Week";
        else if (endDate > thisMonth) endDescription = "This Month";
        else if (endDate > lastMonth) endDescription = "Last Month";
        else endDescription = moment.unix(endDate).format("MMMM YYYY");

        return endDescription;

    },
    */

    /*
    GetFormattedDateRange: function (unixDateStart, unixDateEnd) {

        var dateRangeSeconds = unixDateEnd - unixDateStart;

        var week = 60 * 60 * 24 * 7;
        var month = 60 * 60 * 24 * 30;
        var year = 60 * 60 * 24 * 365;

        var checkRange = Math.round (dateRangeSeconds / week);

        // show weeks between 1 and 7
        if (checkRange <= 7) {
            return "{0} week{1}".format (checkRange, (checkRange != 1) ? "s" : "");
        }

        // show months between 2 and 23
        checkRange = Math.round (dateRangeSeconds / month);
        if (checkRange <= 23) {
            return "{0} months".format (checkRange);
        }

        // show years
        checkRange = Math.round (dateRangeSeconds / year);
        return "{0} years".format (checkRange);

    },
    */

    SplitDataElementsAsInt: function (dataString) {

        var elements = dataString.split (",");
        for (var i = 0; i < elements.length; i++) {
            elements[i] = parseInt (elements[i]);
        }

        return elements;

    }

};

var dysproGraphEventHandlers = {

    MoveScoreIndicator: function (event) {

        // pull variables from hit point
        var index = event.target.attributes.scoreIndex.value;
        var linePositionLeft = event.target.attributes.linePositionLeft.value;

        // find if should animate movement of not - if moving more than 10% of the distance, then animate it
        var animateMovement = (Math.abs (dysproGraph.gameData.lastSelectedIndex - index) / dysproGraph.gameData.totalScores > 0.1);

        // find the color to change the element to based on the score
        var currentScoreOffset = dysproGraph.gameData.scores[index] - dysproGraph.gameData.stats.lowScore;
        var topScoreOffset = dysproGraph.gameData.stats.highScore - dysproGraph.gameData.stats.lowScore + 1;
        var colorIndex = Math.ceil ((1 - (currentScoreOffset / topScoreOffset)) * 10) - 1;

        // set common variables
        var movementTransform;

        // move the line indicator relative to the current position
        movementTransform = "t{0},{1}".format (
            (index - dysproGraph.gameData.highScoreIndex) * dysproGraph.dims.graphScoreSpacing,
            0
        );

        if (animateMovement) dysproGraph.elements.scoreIndicatorLine.animate ({ transform: movementTransform }, dysproGraph.sizes.animationTime);
        else dysproGraph.elements.scoreIndicatorLine.transform (movementTransform);

        // move the date and change the value as absolute positioned
        var dateHighScore = new Date (dysproGraph.gameData.dates[index]);
        dysproGraph.elements.scoreIndicatorDate.attr ({ text: moment.unix(dateHighScore).format("MM/DD/YYYY") });

        movementTransform = "t{0},{1}".format (
            linePositionLeft - (dysproGraph.elements.scoreIndicatorDate.getBBox().width / 2),
            dysproGraph.dims.graphPositionBottom + dysproGraph.sizes.labelSmall
        );

        if (animateMovement) dysproGraph.elements.scoreIndicatorDate.animate ({ transform: movementTransform }, dysproGraph.sizes.animationTime);
        else dysproGraph.elements.scoreIndicatorDate.transform (movementTransform);

        // move the score and change the value absolute positioned
        dysproGraph.elements.scoreIndicatorScore.attr ({ text: dysproGraph.gameData.scores[index].toLocaleString() });

        movementTransform = "t{0},{1}".format (
            linePositionLeft - (dysproGraph.elements.scoreIndicatorScore.getBBox().width / 2),
            dysproGraph.dims.graphPositionTop - dysproGraph.dims.labelMarginTop
        );

        if (animateMovement) dysproGraph.elements.scoreIndicatorScore.animate ({ transform: movementTransform }, dysproGraph.sizes.animationTime);
        else dysproGraph.elements.scoreIndicatorScore.transform (movementTransform);

        // change colors
        dysproGraph.elements.scoreIndicatorLine.animate ({ stroke: dysproGraph.colors.alert[colorIndex] }, dysproGraph.sizes.animationTime);
        dysproGraph.elements.scoreIndicatorDate.animate ({ fill: dysproGraph.colors.alert[colorIndex] }, dysproGraph.sizes.animationTime);
        dysproGraph.elements.scoreIndicatorScore.animate ({ fill: dysproGraph.colors.alert[colorIndex] }, dysproGraph.sizes.animationTime);

        // reset the last selected index
        dysproGraph.gameData.lastSelectedIndex = index;

    }

};
