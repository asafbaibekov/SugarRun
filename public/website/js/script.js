$(document).on('click', '.navbar-collapse a, .navbar-brand', function (event) {
    var hash = this.hash;
    console.log(hash);
    if (hash === "#Home" || hash === "#About" || hash === "#Download") {
        event.preventDefault();
        $(".navbar-collapse").collapse('hide');
        $(".navbar-toggle").removeClass("active");
        $('html, body').animate({
            scrollTop: $($.attr(this, 'href')).offset().top
        }, 500);
    }
});

$(document).on('click', '.navbar-toggle', function (event) {
    if ($(".navbar-toggle").hasClass("active")) {
        $(".navbar-toggle").removeClass("active");
    } else {
        $(".navbar-toggle").addClass("active");
    }
});