/***********************************************************************************************************************
 *
 * SETTINGS PAGE
 *
 **********************************************************************************************************************/

app.controller ("SettingsController", ["$scope", function ($scope) {

    // add local properties
    $scope.user = {};
    $scope.isUserFormSubmitDisabled = false;

    $scope.monitors = [];
    $scope.products = [];
    $scope.environments = [];
    $scope.isMonitorFormSubmitDisabled = false;

    // add local methods
    $scope.saveUser = settingsPage.userForm.saveUser;

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

    },

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

        initializeForm: function () {

            $("#setting-user-phone").mask("000-000-0000");
            $("#setting-user-phone").val($("#setting-user-phone").masked());

            settingsPage.userForm.formEnableSubmit();

        },

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
                return false
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
                        return false
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

        testMonitor: function () {

        }

    }

};
