/***********************************************************************************************************************
 *
 * SETTINGS PAGE
 *
 **********************************************************************************************************************/

app.controller ("SettingsController", ["$scope", function ($scope) {

    // local properties
    $scope.user = {};
    $scope.isUserFormSubmitDisabled = true;

    $scope.monitors = [];
    $scope.products = [];
    $scope.environments = [];
    $scope.monitor = {};
    $scope.monitorTestResults = {};
    $scope.isMonitorFormSubmitDisabled = true;

    // local methods
    $scope.saveUser = settingsPage.userForm.saveUser;
    $scope.saveMonitor = settingsPage.monitorForm.saveMonitor;
    $scope.resetForm = settingsPage.monitorForm.resetForm;
    $scope.selectMonitor = settingsPage.monitorForm.loadMonitor;
    $scope.selectProduct = settingsPage.monitorForm.selectExistingProduct;
    $scope.selectEnvironment = settingsPage.monitorForm.selectExistingEnvironment;

    // watch for changes to monitor interval seconds and then apply to the selection - this is a hack to allow the
    // bootstrap buttons to work with underlying radio button
    $scope.$watch("monitor.intervalSeconds", settingsPage.monitorForm.handleIntervalSecondsChange);

    // initialize the page
    settingsPage.init($scope);

}]);

var settingsPage = {

    angularScope: null, // allows access to $scope in SettingsController

    init: function (angularScope) {
        settingsPage.angularScope = angularScope;

        settingsPage.userForm.userId = $("userid", "#account-metadata").text();
        settingsPage.userForm.loadUser();

        settingsPage.monitorForm.loadMonitors();
        settingsPage.monitorForm.loadProducts();
        settingsPage.monitorForm.loadEnvironments();
        settingsPage.monitorForm.initializeForm();

    },

    // Applies an object update to the related scope.
    updateAngularValue: function (command) {

        // run the provided function to update the value
        command();

        // evaluate if need to run $apply() - if left out, will generate errors when updating an existing value
        var phase = settingsPage.angularScope.$root.$$phase;
        if (phase !== "$apply" && phase !== "$digest")
            settingsPage.angularScope.$apply();

    },

    // Methods only useful for the user update tab.
    userForm: {

        userId: 0,
        originalEmailAddress: "", // used for validating the current password - will always be checked against the currently-saved email and not the changed input value

        // Changes submit button enabled status.
        formEnableSubmit: function () {
            settingsPage.updateAngularValue(function () {
                settingsPage.angularScope.isUserFormSubmitDisabled = false;
            });
        },
        formDisableSubmit: function () {
            settingsPage.updateAngularValue(function () {
                settingsPage.angularScope.isUserFormSubmitDisabled = true;
            });
        },

        // Prepares the input form.
        initializeForm: function () {

            $("#setting-user-phone").mask("000-000-0000");
            $("#setting-user-phone").val($("#setting-user-phone").masked());

            settingsPage.userForm.formEnableSubmit();

        },

        // Formats the user object to match what is expected from the update service.
        getUserDataForSave: function (user) {

            var saveData = {
                name: user.name,
                email: user.email,
                phone: $("#setting-user-phone").cleanVal()
            };

            // load the new password if exists - will not exist if the old password was not validated
            var newPassword = $("#setting-user-password-new").val();
            if (newPassword) {
                saveData.password = newPassword;
            }

            return saveData;

        },

        // Loads user information.
        loadUser: function () {

            $.ajax("/api/user/" + settingsPage.userForm.userId)
            .done(function (results) {
                settingsPage.userForm.originalEmailAddress = results.email;
                settingsPage.updateAngularValue(function () {
                    settingsPage.angularScope.user = results;
                });
                settingsPage.userForm.initializeForm();
            })
            .fail(function (response) {
                notifications.errorFromServiceResponse(response);
            });

        },

        // Updates user information.
        saveUser: function () {

            if (!settingsPage.userForm.isFormUserValidated()) return;

            settingsPage.userForm.formDisableSubmit();

            $.ajax({
                type: "put",
                url: "/api/user/" + settingsPage.userForm.userId,
                data: settingsPage.userForm.getUserDataForSave(settingsPage.angularScope.user)
            })
            .done(function (results) {
                $("#setting-user-password-current").val("");
                $("#setting-user-password-new").val("");
                settingsPage.userForm.originalEmailAddress = $("#setting-user-email").val();
                notifications.success("Successfully saved your user information.");
            })
            .fail(function (response) {
                notifications.errorFromServiceResponse(response);
            })
            .always(function () {
                settingsPage.userForm.formEnableSubmit();
            });

        },

        // Validates the user form.
        isFormUserValidated: function () {

            // validate the phone number
            var validityMessagePhone = "";
            var phoneNumber = $("#setting-user-phone").val();
            if (phoneNumber.length && phoneNumber.length !== 12)
                validityMessagePhone = "Invalid phone number.";
            $("#setting-user-phone")[0].setCustomValidity(validityMessagePhone);

            // validate the current password if provided
            var originalPassword = $("#setting-user-password-current").val();
            if (originalPassword) {
                $.ajax({
                    async: false,
                    type: "post",
                    url: "/api/user/authenticate",
                    data: {
                        email: settingsPage.userForm.originalEmailAddress,
                        password: originalPassword
                    }
                })
                .done(function () {
                    $("#setting-user-password-current")[0].setCustomValidity("");
                })
                .fail(function () {
                    $("#setting-user-password-current")[0].setCustomValidity("Your original password is incorrect.");
                });
            }
            else $("#setting-user-password-new").val(""); // if no original password, but entered a new one, just clear it

            // validate all fields
            if ($("#form-user")[0].checkValidity() === false) {
                return false;
            }

            // if adding a new password, prompt to confirm the new password
            var newPassword = $("#setting-user-password-new").val();
            if (newPassword) {

                var newPasswordConfirm = $("#setting-user-password-new-confirm").val();

                // validate the new password confirmation if already entered
                if (newPasswordConfirm) {

                    var validityPasswordMismatch = "";
                    if (newPasswordConfirm !== newPassword) {
                        validityPasswordMismatch = "Your password does not match what was entered.";
                    }
                    $("#setting-user-password-new-confirm")[0].setCustomValidity(validityPasswordMismatch);

                    if ($("#form-password-confirm")[0].checkValidity() === false) {
                        return false;
                    }

                    $("#modal-password-confirm").modal("hide");

                }

                // prompt for the new password confirmation if not yet entered
                else {

                    $("#modal-password-confirm").on("shown.bs.modal", function (e) {
                        $("#setting-user-password-new-confirm").focus();
                    });
                    $("#modal-password-confirm").modal();
                    return false;

                }
            }

            return true;

        }

    },

    // Methods only useful for the monitor management tab.
    monitorForm: {

        originalMonitorEndpointUri: "", // used for checking if path has changed and need to test the endpoint prior to saving

        // Changes submit button enabled status.
        formEnableSubmit: function () {
            settingsPage.updateAngularValue(function () {
                settingsPage.angularScope.isMonitorFormSubmitDisabled = false;
            });
        },
        formDisableSubmit: function () {
            settingsPage.updateAngularValue(function () {
                settingsPage.angularScope.isMonitorFormSubmitDisabled = true;
            });
        },

        // Converts the monitor object to what is expected from the create and update services.
        getMonitorDataForSave: function (monitor) {

            var saveData = {
                endpointUri: monitor.endpointUri,
                intervalSeconds: monitor.intervalSeconds,
                product: monitor.productName,
                environment: monitor.environmentName
            };

            return saveData;

        },

        // Prepares the input form.
        initializeForm: function () {

            settingsPage.monitorForm.formEnableSubmit();
            settingsPage.monitorForm.resetForm();

            // add handler for radio button routing between angular and control - could not get this to work with
            // angular alone, likely due to mixing with a bootstrap custom control that hides the radio inputs
            // themselves - adding this hack for a quick solution so can move on
            $("input[name=setting-monitor-interval]").change(function () {
                var newInterval = $(this).val();
                settingsPage.updateAngularValue(function () {
                    settingsPage.angularScope.monitor.intervalSeconds = newInterval;
                });
            });

            // add delete confirmation
            $("#button-delete")
            .popover({
                content: $("#popover-content-delete-confirmation").html(),
                html: true,
                placement: "bottom",
                template: '<div class="popover popover-confirmation" role="tooltip"><div class="arrow"></div><div class="popover-body"></div></div>'
            })
            .on("show.bs.popover", function () {
                $("#button-delete").prop("disabled", true);
            })
            .on("hidden.bs.popover", function () {
                $("#button-delete").prop("disabled", false);
            });

            // add handlers for buttons in the confirmation popover - note that has to apply to document and cannot be set on the click handler or be called directly via angular due to how the popover code creates the elements
            $(document)
            .on("click", "#button-delete-cancel", function () {
                $("#button-delete").popover("hide");
            })
            .on("click", "#button-delete-confirm", function () {
                settingsPage.monitorForm.delete();
                $("#button-delete").popover("hide");
            });

            // add help information about metrics
            $("#link-about-metrics-on-page, #link-about-metrics-in-modal").popover({
                content: $("#popover-content-about-metrics").html(),
                html: true,
                placement: "bottom",
                trigger: "focus"
            });

        },

        // Resets the form to default state.
        resetForm: function () {

            settingsPage.updateAngularValue(function () {
                settingsPage.angularScope.monitor = {intervalSeconds: 60};
            });

        },

        // Loads all monitors for display.
        loadMonitors: function () {

            $.ajax("/api/monitors")
            .done(function (results) {

                settingsPage.updateAngularValue(function () {
                    settingsPage.angularScope.monitors = results;
                });

            })
            .fail(function (response) {
                notifications.errorFromServiceResponse(response);
            });

        },

        // Loads a monitor for editing.
        loadMonitor: function(monitorId) {

            $.ajax("/api/monitor/" + monitorId)
            .done(function (results) {

                settingsPage.monitorForm.originalMonitorEndpointUri = results.endpointUri;

                settingsPage.updateAngularValue(function () {
                    settingsPage.angularScope.monitor = results;
                });

                utilities.scrollToTopOfPage();

            })
            .fail(function (response) {
                notifications.errorFromServiceResponse(response);
            });

        },

        // Loads all products to allow select from existing.
        loadProducts: function () {

            $.ajax("/api/products")
            .done(function (results) {

                settingsPage.updateAngularValue(function () {
                    settingsPage.angularScope.products = results;
                });

            })
            .fail(function (response) {
                notifications.errorFromServiceResponse(response);
            });

        },

        // Loads all environments to allow select from existing.
        loadEnvironments: function () {

            $.ajax("/api/environments")
            .done(function (results) {

                settingsPage.updateAngularValue(function () {
                    settingsPage.angularScope.environments = results;
                });

            })
            .fail(function (response) {
                notifications.errorFromServiceResponse(response);
            });

        },

        // Adds an existing product to the product form field.
        selectExistingProduct: function (name) {

            settingsPage.updateAngularValue(function () {
                settingsPage.angularScope.monitor.productName = name;
            });

        },

        // Adds an existing environment to the environment form field.
        selectExistingEnvironment: function (name) {

            settingsPage.updateAngularValue(function () {
                settingsPage.angularScope.monitor.environmentName = name;
            });

        },

        // Sends a click to the button that represents the interval seconds radio button.
        handleIntervalSecondsChange: function(value) {

            if (value != $("input[name=setting-monitor-interval]:checked").val()) {
                $("input[name=setting-monitor-interval][value=" + value + "]").parent().click();
            }

        },

        // Saves a new monitor or updates an existing monitor.
        saveMonitor: function () {

            if (!settingsPage.monitorForm.isFormValidated()) return;

            settingsPage.monitorForm.formDisableSubmit();

            // test the endpoint if changed
            if (settingsPage.angularScope.monitor.endpointUri !== settingsPage.monitorForm.originalMonitorEndpointUri) {

                $.ajax("/api/monitor/test/" + encodeURIComponent(settingsPage.angularScope.monitor.endpointUri))
                .done(function (results) {

                    // if no status code, then a catastrophic issue is in play and the URL should not be accepted
                    if (!results.statusCode) {
                        settingsPage.monitorForm.formEnableSubmit();
                        $("#setting-monitor-endpoint-uri")[0].setCustomValidity(results.requestErrorMessage);
                        $("#setting-monitor-endpoint-uri")[0].reportValidity();
                        $("#form-monitor")[0].checkValidity();
                        notifications.error("The Endpoint URI cannot be used. " + results.requestErrorMessage); // custom validity not displaying in this case, so also issuing a toast notification
                        return;
                    }

                    // add derived values to the response object then write back to the test results object
                    results.responseParsed.responseTime = results.responseMilliseconds + "ms";
                    results.statusText = settingsPage.monitorForm.evaluateHttpStatus(results.statusCode);
                    settingsPage.updateAngularValue(function () {
                        settingsPage.angularScope.monitorTestResults = results;
                    });

                    // assign the original URI to the new URI to allow the save to complete when confirming through the modal
                    settingsPage.monitorForm.originalMonitorEndpointUri = settingsPage.angularScope.monitor.endpointUri;

                    $("#modal-endpoint-uri-test").modal();

                })
                .fail (function (response) {
                    notifications.errorFromServiceResponse(response);
                })
                .always (function () {
                    settingsPage.monitorForm.formEnableSubmit();
                });

                return;

            }

            // update if already has a monitor ID
            if (settingsPage.angularScope.monitor.monitorId) {

                $.ajax({
                    type: "put",
                    url: "/api/monitor/" + settingsPage.angularScope.monitor.monitorId,
                    data: settingsPage.monitorForm.getMonitorDataForSave(settingsPage.angularScope.monitor)
                })
                .done(function (results) {

                    // reload all existing monitor information
                    settingsPage.monitorForm.loadMonitors();
                    settingsPage.monitorForm.loadProducts();
                    settingsPage.monitorForm.loadEnvironments();

                    // clear the form
                    settingsPage.monitorForm.resetForm();

                    notifications.success("Successfully saved your monitor.");

                })
                .fail(function (response) {
                    notifications.errorFromServiceResponse(response);
                })
                .always (function () {
                    $("#modal-endpoint-uri-test").modal("hide");
                    settingsPage.monitorForm.formEnableSubmit();
                });

            }

            // create if no monitor ID
            else {

                $.ajax({
                    type: "post",
                    url: "/api/monitor",
                    data: settingsPage.monitorForm.getMonitorDataForSave(settingsPage.angularScope.monitor)
                })
                .done(function (results) {

                    // reload all existing monitor information
                    settingsPage.monitorForm.loadMonitors();
                    settingsPage.monitorForm.loadProducts();
                    settingsPage.monitorForm.loadEnvironments();

                    // clear the form
                    settingsPage.monitorForm.resetForm();

                    notifications.success("Successfully saved your new monitor.");

                })
                .fail(function (response) {
                    notifications.errorFromServiceResponse(response);
                })
                .always (function () {
                    $("#modal-endpoint-uri-test").modal("hide");
                    settingsPage.monitorForm.formEnableSubmit();
                });

            }

        },

        // Deletes the currently-selected monitor.
        delete: function () {

            var monitorId = settingsPage.angularScope.monitor.monitorId;

            $.ajax({
                type: "delete",
                url: "/api/monitor/" + monitorId
            })
            .done(function (results) {

                // reload existing monitors
                settingsPage.monitorForm.loadMonitors();

                // clear the foorm
                settingsPage.monitorForm.resetForm();

                notifications.success("Successfully deleted the monitor.");

            })
            .fail(function (response) {
                notifications.errorFromServiceResponse(response);
            });

        },

        // Validates the form.
        isFormValidated: function () {

            $("#setting-monitor-endpoint-uri")[0].setCustomValidity(""); // remove any custom validity message that may have been added on a previous attempt

            // validate all fields
            if ($("#form-monitor")[0].checkValidity() === false) {
                return false
            }

            return true;

        },

        // Checks the status code to make it fall into one of these categories of: success, error, or warning.
        evaluateHttpStatus: function (statusCode) {
            if (statusCode >= 200 && statusCode < 300) return "success";
            else if (statusCode >= 400 && statusCode < 600) return "error";
            else return "warning";
        }

    }

};
