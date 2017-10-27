const geolib = require('geolib');
const coordinate = require('./global').coordinate;
const failure = require('./global').failure;
const request = require('sync-request');
const fruits = require('./fruits');
const googlePolyline = require('google-polyline');
const googleMapsKey = require('./global').googleMapsKey;

function route() {
    var coordinates = [];
    url = encodeURI(`https://maps.googleapis.com/maps/api/directions/json?origin=32.049385,34.824159&destination=32.049317,34.823360&waypoints=32.050940,34.826146|32.052221,34.824703|32.050465,34.823419&mode=walking&key=${googleMapsKey}`);
    var res = request('GET', url);
    var json = JSON.parse(res.getBody('utf-8'));
    if (json['status'] == "OK") {
        var encodedPoints = json['routes'][0]['overview_polyline']['points'];
        var points = googlePolyline.decode(encodedPoints);

        var coordinates = [];
        for (var i = 0; i < points.length; i++) {
            coordinates.push(coordinate(points[i][0], points[i][1]));
        }
        return coordinates;
    }
    return false;
}

async function filterRoute(points, minDistanceBetweemFruits, sqlAccess) {
    var newRoute = [];
    var startCoordinate = points[0];
    try {
        var result = await fruits.getFruits(sqlAccess, points.length);
        for (var i = 1; i < points.length; i++) {
            var randomFruit = result[Math.floor(Math.random() * result.length)];
            if (startCoordinate) {
                var distance = geolib.getDistanceSimple(
                    { latitude: startCoordinate.latitude, longitude: startCoordinate.longitude },
                    { latitude: points[i].latitude, longitude: points[i].longitude }
                );
                if (distance > minDistanceBetweemFruits) {
                    newRoute.push({
                        latitude: points[i].latitude,
                        longitude: points[i].longitude,
                        fruit: randomFruit
                    });
                    startCoordinate = points[i];
                }
            }
        }
        return newRoute;
    } catch (error) {
        return failure("can't load fruits from database");
    }
}

async function parkRun(sessionID ,sqlAccess) {
    var theRoute = route();
    if (theRoute === false) {
        return failure("can't find a route");
    }
    var filteredRoute;
    try {
        filteredRoute = await filterRoute(theRoute, 50, sqlAccess);
        return {
            sessionID: sessionID,
            points: filteredRoute
        };
    } catch (err) {
        return failure("can't filter the route");
    }
}

module.exports = {
    parkRun
};