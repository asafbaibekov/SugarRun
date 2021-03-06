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
            success: function(response, status, r) {
                console.log('success');
                if (response.redirect) {
                    window.location.href = response.redirect;
                }
            },
            error: function(xhr) {
                var status = xhr.status;
                if (status == 400) {
                    // unfiled details in username / pass
                    $('#error').fadeTo(100, 1, function(){ });
                    $("#login").addClass('error');
                }
                else if (status == 404) {
                    // username & pass not found
                    $('#error').fadeTo(100, 1, function(){ });
                    $("#login").addClass('error');
                } else if (status == 500) {
                    // server's error
                }
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
                    // $('.waitlist #fill-details').hide(); $('.waitlist #confirmed').show(); $('.waitlist #confirmed').hide(); $('.waitlist #fill-details').show();
                    // $('.waitlist #fill-details').fadeOut(600, function(){ }); $('.waitlist #confirmed').fadeIn(600, function(){ }); $('.waitlist #confirmed').fadeOut(600, function(){ }); $('.waitlist #fill-details').fadeIn(600, function(){ });
                    $('.waitlist #fill-details').fadeOut(300, function(){ 
                        $('.waitlist #confirmed').fadeIn(200, function(){ });
                    });
                }
            }
        });
    });
    $('.waitlist input#businessName').keypress(event, function() {
        $(this).removeClass("error")
    });
    $('.waitlist input#phoneNumber').keypress(event, function() {
        $(this).removeClass("error")
    });
    $('.waitlist input#email').keypress(event, function() {
        $(this).removeClass("error")
    });

    $('.login input[type=text]').keypress(event, function() {
        $(this).parent().removeClass("error");
        $('#error').fadeTo(100, 0, function(){ });
    });
    $('.login input[type=password]').keypress(event, function() {
        $(this).parent().removeClass("error");
        $('#error').fadeTo(100, 0, function(){ });
    });
});