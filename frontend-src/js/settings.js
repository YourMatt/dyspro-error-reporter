/***********************************************************************************************************************
 *
 * SETTINGS PAGE
 *
 **********************************************************************************************************************/

app.controller ("SettingsController", ["$scope", function ($scope) {

    // add local properties
    $scope.user = {};
    $scope.isFormSubmitDisabled = true;

    // add local methods
    $scope.saveUser = settingsPage.saveUser;

    // initialize the page
    settingsPage.init($scope);

}]);

var settingsPage = {

    angularScope: null,
    userId: 0,
    originalEmailAddress: "", // used for validating the current password - will always be checked against the currently-saved email and not the changed input value

    init: function (angularScope) {
        settingsPage.angularScope = angularScope;
        settingsPage.userId = $("userid", "#account-metadata").text();

        settingsPage.loadUser();

    },

    updateAngularValue: function (command) {
        command();
        var phase = settingsPage.angularScope.$root.$$phase;
        if (phase !== "$apply" && phase !== "$digest")
            settingsPage.angularScope.$apply();
    },

    formEnableSubmit: function () {
        settingsPage.updateAngularValue(function () { settingsPage.angularScope.isFormSubmitDisabled = false; });
    },
    formDisableSubmit: function () {
        settingsPage.updateAngularValue(function () { settingsPage.angularScope.isFormSubmitDisabled = true; });
    },

    initializeForm: function() {

        $("#setting-user-phone").mask("000-000-0000");
        $("#setting-user-phone").val($("#setting-user-phone").masked());

        settingsPage.formEnableSubmit();

    },

    getUserDataForSave: function(user) {

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

        $.ajax("/api/user/" + settingsPage.userId)
        .done(function (results) {
            settingsPage.originalEmailAddress = results.email;
            settingsPage.updateAngularValue(function () { settingsPage.angularScope.user = results; });
            settingsPage.initializeForm();
        })
        .fail(function (response) {
            notifications.errorFromServiceResponse(response);
        });

    },

    saveUser: function () {

        if (!settingsPage.isFormUserValidated()) return;

        settingsPage.formDisableSubmit();

        $.ajax({
            type: "put",
            url: "/api/user/" + settingsPage.userId,
            data: settingsPage.getUserDataForSave(settingsPage.angularScope.user)
        })
        .done(function (results) {
            $("#setting-user-password-current").val("");
            $("#setting-user-password-new").val("");
            settingsPage.originalEmailAddress = $("#setting-user-email").val();
            notifications.success("Successfully saved your user information.");
        })
        .fail(function (response) {
            notifications.errorFromServiceResponse(response);
        })
        .always(function () {
            settingsPage.formEnableSubmit();
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
                    email: settingsPage.originalEmailAddress,
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
            return;
        }

        return true;

    }

};
