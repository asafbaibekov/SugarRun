$(function() {
    $("#login").submit(function(event) {
        
        // Stop form from submitting normally
        event.preventDefault();

        // Get some values from elements on the page:
        var $form = $(this);
        var userID = $form.find("input[name='userID']").val();
        var password = $form.find("input[name='password']").val();
        // alert(`userID: ${userID}, password: ${password}`);
        var url = $form.attr("action");
        $.ajax({
            type: "POST",
            url: url,
            data: {
                userID: userID,
                password: password
            },
            success: function(result, status) {
                console.log(result);
            }
        });
    });
    $("#waitlist").submit(function(event) {
        // Stop form from submitting normally
        event.preventDefault();
        console.log("/waitlist");
        // Get some values from elements on the page:
        var $form = $(this);
        var businessName = $form.find("input[name='businessName']").val();
        var phoneNumber = $form.find("input[name='phoneNumber']").val();
        var email = $form.find("input[name='email']").val();
        // alert(`userID: ${userID}, password: ${password}`);
        var url = $form.attr("action");
        $.ajax({
            type: "POST",
            url: url,
            data: {
                businessName: businessName,
                phoneNumber: phoneNumber,
                email: email
            },
            success: function(result, status) {
                console.log(JSON.stringify(result));
                if (result["status"] == "failed") {
                    var discription = result["discription"];
                    if (discription["0"] != null) {
                        $(".waitlist #businessName").addClass("error");
                    } else {
                        $(".waitlist #businessName").removeClass("error");
                    }
                    if (discription["1"] != null) {
                        $(".waitlist #phoneNumber").addClass("error");
                    } else {
                        $(".waitlist #phoneNumber").removeClass("error");
                    }
                    if (discription["2"] != null) {
                        $(".waitlist #email").addClass("error");
                    } else {
                        $(".waitlist #email").removeClass("error");
                    }
                } else {
                    $(".waitlist input").removeClass("error");
                    // Thanks for registering to our service, we'll be in contant with you soon
                    // $(".waitlist")
                }
            }
        });
    });
    $('.waitlist input#businessName').keypress(event, function() {
        $(this).hasClass("error") ? $(this).removeClass("error") : void 0;
    });
    $('.waitlist input#phoneNumber').keypress(event, function() {
        $(this).hasClass("error") ? $(this).removeClass("error") : void 0;
    });
    $('.waitlist input#email').keypress(event, function() {
        $(this).hasClass("error") ? $(this).removeClass("error") : void 0;
    });
});