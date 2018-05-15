/***********************************************************************************************************************
 *
 * NOTIFICATION ACTIONS
 *
 **********************************************************************************************************************/

var notifications = {

    success: function (message) {

        toastr.success(message);

    },

    error: function (message) {

        toastr.error(message);

    },

    errorFromServiceResponse: function (response) {

        // set default actions for specific status codes, ignoring provided error messaging
        switch (response.status) {
            case 0:
                return toastr.error("Error connecting to server. Please try again in a few moments.", "Communication Error");
            case 401:
                return toastr.error(
                    "You were signed out after a period of inactivity. Please sign in and try again.<br/>Redirecting in <span id='notification-redirect-seconds'>5</span> seconds...",
                    "Authentication Error",
                    {
                        timeout: 5000,
                        onShown: function () {
                            var secondsRemaining = 5;
                            window.setInterval(function() {
                                $("#notification-redirect-seconds").text(--secondsRemaining);
                                }, 1000);
                        },
                        onHidden: function () {
                            document.location = "/";
                        }
                    }
                );
        }

        // display provided error message if exists
        if (response.responseJSON && response.responseJSON.error) return toastr.error(response.responseJSON.error);

        // display a general error if no further information was found
        toastr.error("An unhandled error has occurred.", response.status + " error");

    }

};
