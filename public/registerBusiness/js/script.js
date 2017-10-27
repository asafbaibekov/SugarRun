$(window).ready(updateWidth);
$(window).resize(updateWidth);

function updateWidth() {
    $('#logo_box').css('width', $('#logo_box').height() + 4);
}
// function updateWidth() {
//     var parentWidth = $("#logo_box").parent().width();
//     var h3WithLogoboxWidth = $("#logo_box").width() + $("label + h3").width()
//     if (parentWidth/2 >= h3WithLogoboxWidth) {
//         $('#logo_box').css('width', $('#logo_box').height()+4);
//     } else {
//         $('#logo_box').css('height', $('#logo_box').width());
//         $('#logo_box').css('width', $('#logo_box').height()+4);
//     }
// }

// function updateWidth() {
//     var width = $("#logo_box").width(), height = $("#logo_box").height();
//     var a = $("#logo_box").parent().width();
//     var b = $("#logo_box").width() + $("label + h3").width()
//     if (a-b < height) {
//         $('#logo_box').css('height', $('#logo_box').width());
//     } else {
//         $('#logo_box').css('width', $('#logo_box').height()+4);
//     }
//     console.log(a-b < height);
//     return (a-b < height);
// }
$(function () {
    var prefixes = ["02", "03", "04", "08", "09", "050", "052", "053", "054", "055", "058"]
    for (var i = 0; i < prefixes.length; i++) {
        var element = prefixes[i];
        if (element != "03") {
            $('select#phone_prefix').append(`<option value="${element}">${element}</option>`);
        } else {
            $('select#phone_prefix').append(`<option value="${element}" selected="selected">${element}</option>`);
        }
    }
})
$(function () {
    $("#logo_file").change(function FChange() {
        var countFiles = $(this)[0].files.length;
        var imgPath = $(this)[0].value;
        var extn = imgPath.substring(imgPath.lastIndexOf('.') + 1).toLowerCase();
        var image_holder = $(".image-holder");
        image_holder.empty();

        if (extn == "gif" || extn == "png" || extn == "jpg" || extn == "jpeg") {
            if (typeof (FileReader) != "undefined") {
                var reader = new FileReader();
                reader.onload = function (e) {
                    $("#div_for_image").empty();
                    $("#div_for_image").append(`<img id="logo" src="${e.target.result}" style="object-fit: contain; height: 100%; width: 100%;">`)
                }
                reader.readAsDataURL($(this)[0].files[0]);
                $("img#camera-icon").css({
                    "display": "none"
                })
                $("div.hidden_holder").mouseenter(function () {
                    $("img#camera-icon").css("display", "inline");
                }).mouseleave(function () {
                    $("img#camera-icon").css("display", "none");
                });
            } else {
                alert("This browser does not support FileReader.");
            }
        } else {
            alert("Please select only images");
        }
    });

    $('#logo_file').on('dragover', function () {
        $("#logo_box").css({
            'background-color': 'white',
            'border': '2px dashed #000000'
        });
    });
    $('#logo_file').on('dragleave', function () {
        $("#logo_box").css({
            'background-color': '#f8f8f8',
            'border': '2px solid #DDDEDE'
        });
    });
    $('#logo_file').on('drop', function () {
        $("#logo_box").css({
            'background-color': '#f8f8f8',
            'border': '2px solid #DDDEDE'
        });
    });



    $("#register").submit(function (event) {

        // Stop form from submitting normally
        event.preventDefault();

        // Get some values from elements on the page:

        var password = $(this).find("input[name='password']").val();
        var verifyPassword = $(this).find("input[name='verifyPassword']").val();
        if (password != verifyPassword) {
            alert("הסיסמאות לא תואמות");
        }

        var formData = new FormData(this);
        var url = $(this).attr("action");
        $.ajax({
            type: 'POST',
            url: url,
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            success: function (data) {
                console.log(data);
                if (typeof data.redirect == 'string') {
                    window.location.href = data.redirect;
                } else {
                    console.log(data);
                    alert('data returned successfully');
                }
            },
            error: function (data) {
                console.log(data);
            }
        });
    });

})