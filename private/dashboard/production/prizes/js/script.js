$(function () {

    var x = ["first", "second", "third", "forth"];
    $('div.tab').each(function (index, element) {
        for (var i = 0; i < x.length; i++) {
            if ($(this).hasClass('active') && $(this).hasClass(x[i])) {
                $(`hr.${x[index]}, hr.${x[index+1]}`).toggleClass("hide", true);
            }
        }

    })
    x.forEach((element, index) => {
        $(`div.tab.${element}`).hover(function() {
            if ($(`div.tab`).hasClass(element)) {
                if (!($(this).hasClass('active'))) {
                    $(`hr.${x[index]}, hr.${x[index-1]}`).toggleClass("hide", true);
                }
            }
        }, function() {
            if ($(`div.tab`).hasClass(element)) {
                if (!($(this).hasClass('active'))) {
                    if (!($(`div.${x[index-1]}`).hasClass('active'))) {
                        $(`hr.${x[index-1]}`).toggleClass("hide", false);
                    }
                    $(`hr.${x[index]}`).toggleClass("hide", false);
                } else {
                    $(`hr.${x[index]}`).toggleClass("hide", true);
                }
            }
        })
    });

    function update() {
        $('.name').each(function () {
            var parentHeight = $(this).parent().height();
            $(this).css({
                "font-size": `${parentHeight / 4}px`
            })
        });
    }
    $(window).ready(update);
    $(window).resize(update);
});

$.ajax({
    type: "POST",
    url: "/fetchProfile",
    dataType: "json",
    success: function (response) {
        $('#accountName').html(response.businessName);
        $('#logo').attr('src', `data:image/png;base64,${response.logo}`);
        console.log(response);
    }
});

$.ajax({
    type: "POST",
    url: "/fetchPrizes",
    dataType: "json",
    success: function (response) {
        var size = 4;
        var result = response.reduce(function (previousValue, currentValue, currentIndex, array) {
            if (!(currentIndex % size)) {
                previousValue.push(response.slice(currentIndex, currentIndex + size));
            }
            return previousValue;
        }, [])
        for (var i = 0; i < result.length; i++) {
            var row = $('<div class="row" style="text-align: center"></div>')
            for (var j = 0; j < result[i].length; j++) {
                var col = $('<div class="col-sm-3 col-xs-12" style="float: right; overflow-x: hidden;"></div>')
                var square = $('<div class="square"><div>');
                var x = $('<div></div>');
                var first = $('<div style="height: 55%; width: 100%; background-color: white;"></div>');
                first.append($(`<img src="data:image/png;base64,${result[i][j].image}" style="object-fit: contain; height: 100%; width: 100%;">`));
                var second = $('<div style="height: 45%; position: absolute; bottom: 0; left: 0; right: 0; background-color: rgba(90,90,90,.5); font-size: 150%; display: flex; justify-content: center; align-items: center;"></div>');
                second.append($(`<label dir="auto" class="name" style="color: white; margin: 0;">${result[i][j].shortName}</label>`));
                row.append(col.append(square.append(x.append(first, second))));
            }
            $('#boxes').append(row);
        }
    }
});

// $.post("/fetchProfile", null,
//     function (data, textStatus, jqXHR) {
//         $('#accountName').html(data.businessName);
//         $('#logo').attr('src', `data:image/png;base64,${data.logo}`);
//         console.log(data);
//     },
//     "json"
// );

// $.post("/fetchPrizes", null,
//     function (data, textStatus, jqXHR) {
        
//     },
//     "json"
// );