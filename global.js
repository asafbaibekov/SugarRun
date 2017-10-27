const geolib = require('geolib');
const nodemailer = require('nodemailer');
const handlebars = require("handlebars");
const fs = require('fs');
const path = require('path');
const googleMapsKey = "AIzaSyDHHjR54MtHUyZxUrrKgBAdVYb7ej7_jyc";
/**
 * Get two params with numbers
 * return JSON incloud coordinate with latitude and longitude
 * @param {Number} latitude 
 * @param {Number} longitude
 * @returns JSON incloud coordinate with latitude and longitude
 */
function coordinate(latitude, longitude) {
    return {
        latitude: latitude,
        longitude: longitude
    };
}

/**
 * if one of the types is include in the results array he will not be in the final results
 * @param {[*]} results - to be filtered
 * @param {[*]} types - to filter with
 * @returns {[*]} results that filtered already from the unwanted types
 */
function filterTypes(results, withoutTypes) {
    var newResults = [];
    for (var i = 0; i < results.length; i++) {
        var flag = true;
        for (var j = 0; j < results[i]['types'].length; j++) {
            var isTypesNotExists = []
            for (var k = 0; k < withoutTypes.length; k++)
                isTypesNotExists.push(results[i]['types'].includes(withoutTypes[k]));
            for (var k = 0; k < isTypesNotExists.length; k++)
                if (isTypesNotExists[k])
                    flag = false;
        }
        if (flag)
            newResults.push(results[i]);
    }
    return newResults;
}

/**
 * 
 * @param {JSON} center - Coordinate
 * @param {Number} radius - The distance in meters
 */
function randomGeo(center, radius) {
    var y0 = center.latitude;
    var x0 = center.longitude;
    var rd = radius / 111300; //about 111300 meters in one degree

    var u = Math.random();
    var v = Math.random();

    var w = rd * Math.sqrt(u);
    var t = 2 * Math.PI * v;
    var x = w * Math.cos(t);
    var y = w * Math.sin(t);

    //Adjust the x-coordinate for the shrinking of the east-west distances
    var xp = x / Math.cos(y0);

    var newCoordinate = coordinate(y + y0, x + x0);

    var distance = geolib.getDistanceSimple({
        latitude: center.latitude,
        longitude: center.longitude
    }, {
        latitude: newCoordinate.latitude,
        longitude: newCoordinate.longitude
    });
    return {
        coordinate: newCoordinate,
        distance: distance
    };
}


/**
 * 
 * @param {String | JSON} discription 
 */
function failure(discription) {
    return {
        status: "failed",
        discription: discription
    };
}

function success(content) {
    if (content == null) {
        return {
            status: "success"
        };
    }
    return {
        status: "success",
        content: content
    };
}

function sendMail(sendTo, sub, stringLink) {
    // create reusable transporter object using the default SMTP transport
    var transporter = nodemailer.createTransport({
        // host: 'smtp.example.com',
        // port: 465,
        // secure: true, // secure:true for port 465, secure:false for port 587
        service: "gmail",
        auth: {
            user: 'sugarrunapp@gmail.com',
            pass: 'SugarRun1234'
        }
    });
    // Open template file
    var source = fs.readFileSync(path.join(__dirname, '/confirmMailPage/email_conformation.hbs'), 'utf8');
    // Create email generator
    var template = handlebars.compile(source);
    var mailOptions = {
        from: '"SugarRun Team" <sugarrunapp@gmail.com>', // sender address
        to: sendTo, // list of receivers seperated by ', ' inside the string
        subject: sub, // Subject line
        // text: content //, // plain text body
        html: template({
            link: stringLink
        }), // html body
        attachments: [{
            path: './confirmMailPage/images/mail_title.png',
            cid: 'mailtitle' //same cid value as in the html img src
        }]
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            throw error;
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
    });
    // fs.readFile('./confirmMailPage/index.html', {encoding: 'utf8'}, function(err, html) {

    // })

    // setup email data with unicode symbols
    // fs.readFile('./confirmMailPage/index.html', {encoding: 'utf8'}, function(err, data){
    //     var template = handlebars.compile(data);
    //     var bitmap = fs.readFileSync('./confirmMailPage/images/mail_title.png');
    //     var htmlToSend = template({
    //         base64Image: "data:image/svg;base64," + new Buffer(bitmap).toString('base64'),
    //         link: stringLink
    //     });
    //     var mailOptions = {
    //         from: '"SugarRun Team" <sugarrunapp@gmail.com>', // sender address
    //         to: sendTo, // list of receivers seperated by ', ' inside the string
    //         subject: sub, // Subject line
    //         // text: content //, // plain text body
    //         html: htmlToSend, // html body
    //     };
    //     transporter.sendMail(mailOptions, (error, info) => {
    //         if (error) {
    //             throw error;
    //         }
    //         console.log('Message %s sent: %s', info.messageId, info.response);
    //     });
    // });


    // var template = handlebars.compile(html);
    // var result = template({
    //     "confirmlink": stringLink
    // });


}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

module.exports = {
    success,
    coordinate,
    filterTypes,
    randomGeo,
    failure,
    sendMail,
    guid,
    googleMapsKey
};