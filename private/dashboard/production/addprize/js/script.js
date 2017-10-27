// $(function () {

//     var x = ["first", "second", "third", "forth"];
//     $('div.tab').each(function (index, element) {
//         for (var i = 0; i < x.length; i++) {
//             if ($(this).hasClass('active') && $(this).hasClass(x[i])) {
//                 $(`hr.${x[index]}, hr.${x[index+1]}`).toggleClass("hide", true);
//             }
//         }

//     })
//     x.forEach((element, index) => {
//         $(`div.tab.${element}`).hover(function() {
//             if ($(`div.tab`).hasClass(element)) {
//                 $(`hr.${x[index]}, hr.${x[index-1]}`).toggleClass("hide", true);
//                 // if ($(this).hasClass('active')) {
//                 // }
//                 // if (!($(this).hasClass('active'))) {
//                 //     $(`hr.${x[index]}, hr.${x[index-1]}`).toggleClass("hide", true);
//                 // }
//             }
//         }, function() {
//             if ($(`div.tab`).hasClass(element)) {
//                 if ($(`hr.${x[index]}`).hasClass('active'))
//                 // if ($(this).hasClass('active')) {
//                 //     $(`hr.${x[index]}, hr.${x[index-1]}`).toggleClass("hide", false);
//                 // } else {
//                 //     $(`hr.${x[index]}, hr.${x[index-1]}`).toggleClass("hide", true);
//                 // }

//                 if (!($(this).hasClass('active'))) {
//                     // if (!($(`div.${x[index-1]}`).hasClass('active'))) {
//                     //     $(`hr.${x[index-1]}`).toggleClass("hide", false);
//                     // }
//                     // $(`hr.${x[index]}`).toggleClass("hide", false);
//                 } else {
//                     // $(`hr.${x[index]}`).toggleClass("hide", true);
//                 }
//             }
//         })
//     });
// });


$.ajax({
    type: "POST",
    url: "/fetchProfile",
    dataType: "json",
    success: function (response) {
        $('#accountName').html(response.businessName);
        $('#logo').attr('src', `data:image/png;base64,${response.logo}`);
    }
});

$.ajax({
    type: "POST",
    url: "/fetchFruits",
    cache: true,
    dataType: "json",
    success: function (response) {
        console.log(response);
        for (var i = 0; i < response.length; i++) {
            var item = $('<div class="col-md-6 col-sm-12 col-xs-12" style="float: right; padding: 0;"></div>');
            var container = $('<div class="container-fluid" style="height: 100%;"></div>');
            var row = $(`<div class="row fruits-container" fruitid="${response[i].fruitID}" count="0" style="height: 100%; display: flex; align-items: center;"></div>`);

            var imagediv = $('<div style="padding: 20px 20px 20px 0; width: 33%;"></div>');
            var image = $('<div style="position: relative; background-color: #444444; float: right; width: 100%; height: 0; padding-top: 100%; border-radius: 100%; overflow-x: hidden;"></div>');
            imagediv.append(image.append(`<img style="position: absolute; top: 0; left: 0; bottom: 0; right: 0; margin: auto;" src="data:image/jpeg;base64,${response[i].image}">`))

            var controllers = $('<div style="width: 67%; margin-left: 5%; display: flex; align-items: center; justify-content: center;"></div>');
            controllers.append( $('<div class="minus" style="width: 20%; margin: 10px;"><img src="../../images/minus_icon.svg"></div>'),
                                $('<label class="fruitsNumber" for="" style="margin:0; color: #9E339A; font-size:140%; margin: 10px;">0</label>'),
                                $('<div class="plus" style="width: 20%; margin: 10px;"><img src="../../images/plus_icon.svg"></div>'));
            item.append(container.append(row.append(imagediv, controllers)));
            $('#fruits').append(item);
        }
        $('.minus').click(function () {
            var count = $(this).parent().parent().attr('count');
            var intCount = parseInt(count);
            if (!isNaN(intCount)) {
                intCount--;
            }
            if (intCount >= 0) {
                $(this).parent().parent().attr('count', intCount);
                $(this).parent().children('.fruitsNumber').text(intCount);
            }
        });
        $('.plus').click(function () {
            var count = $(this).parent().parent().attr('count');
            var intCount = parseInt(count);
            if (!isNaN(intCount)) {
                intCount++;
            }
            $(this).parent().parent().attr('count', intCount);
            $(this).parent().children('.fruitsNumber').text(intCount);
        });
        
        var intervalPlus;
        var countPlus = 0;
        $(".plus").mouseup(function () {
            // Clear timeout
            clearInterval(intervalPlus);
            return false;
        }).mousedown(function () {
            // Set timeout
            var element = $(this);
            countPlus = 0;
            intervalPlus = setInterval(function () {
                countPlus++;
                var countfruits = element.parent().parent().attr('count');
                var intCount = parseInt(countfruits);
                if (!isNaN(intCount)) {
                    intCount++;
                    element.parent().parent().attr('count', intCount);
                    element.parent().children('.fruitsNumber').text(intCount);
                }
                if (countPlus == 2) {
                    clearInterval(intervalPlus);
                    intervalPlus = setInterval(function () {
                        countPlus++;
                        var countfruits = element.parent().parent().attr('count');
                        var intCount = parseInt(countfruits);
                        if (!isNaN(intCount)) {
                            intCount++;
                            element.parent().parent().attr('count', intCount);
                            element.parent().children('.fruitsNumber').text(intCount);
                        }
                    }, 100)
                }
            }, 500);
            return false;
        });

        var intervalMinus;
        var countMinus = 0;
        $(".minus").mouseup(function () {
            // Clear timeout
            clearInterval(intervalMinus);
            return false;
        }).mousedown(function () {
            // Set timeout
            var element = $(this);
            countMinus = 0;
            intervalMinus = setInterval(function () {
                countMinus++;
                var countfruits = element.parent().parent().attr('count');
                var intCount = parseInt(countfruits);
                if (!isNaN(intCount)) {
                    intCount--;
                }
                if (intCount >= 0) {
                    element.parent().parent().attr('count', intCount);
                    element.parent().children('.fruitsNumber').text(intCount);
                }
                if (countMinus == 2) {
                    clearInterval(intervalMinus);
                    intervalMinus = setInterval(function () {
                        countMinus++;
                        var countfruits = element.parent().parent().attr('count');
                        var intCount = parseInt(countfruits);
                        if (!isNaN(intCount)) {
                            intCount--;
                        }
                        if (intCount >= 0) {
                            element.parent().parent().attr('count', intCount);
                            element.parent().children('.fruitsNumber').text(intCount);
                        }
                    }, 100)
                }
            }, 500);
            return false;
        });
    }
});

$(function() {
    $("#addprize").submit(function (event) {
        event.preventDefault();
        var formData = new FormData(this);
        var fruits = [];
        $('.fruits-container').each(function(index, element) {
            fruits.push({
                fruitid: $(this).attr("fruitid"),
                count: $(this).attr("count")
            });
        });
        formData.append("fruits", JSON.stringify(fruits));
        formData.set("expiredDate", $("#datepicker").datepicker("getDate").toString().substring(0,24));
        console.log("formData: " + formData);
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
                    alert('data returned successfully');
                }
            },
            error: function (data) {
                console.log(data);
            }
        });
    });
    $("#image_file").change(function FChange() {
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

    $('#image_file').on('dragover', function () {
        $("#logo_box").css({
            'background-color': 'white',
            'border': '2px dashed #000000'
        });
    });
    $('#image_file').on('dragleave', function () {
        $("#logo_box").css({
            'background-color': '#f8f8f8',
            'border': '2px solid #DDDEDE'
        });
    });
    $('#image_file').on('drop', function () {
        $("#logo_box").css({
            'background-color': '#f8f8f8',
            'border': '2px solid #DDDEDE'
        });
    });
    $("#datepicker").datepicker({
        minDate: 0,
        dateFormat: 'dd/mm/yy',
        dayNames: ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"],
        dayNamesMin: ["א", "ב", "ג", "ד", "ה", "ו", "ש"],
        monthNames: [ "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר" ]
    });
    
})