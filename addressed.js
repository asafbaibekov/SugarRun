var geolib = require('geolib');
var request = require('sync-request');
var googlePolyline = require('google-polyline');
var fruits = require('./fruits');
var coordinate = require('./global').coordinate;
var filterTypes = require('./global').filterTypes;
const failure = require('./global').failure;
const googleMapsKey = require('./global').googleMapsKey;

function search(userID, toSearch, currentLocation, radius) {
    var out = {
        userID: userID,
        results: []
    }
    var url = encodeURI(`https://maps.googleapis.com/maps/api/place/autocomplete/json?key=${googleMapsKey}&input=${toSearch}&location=${currentLocation.latitude},${currentLocation.longitude}&radius=${radius}`);
    var res = request('GET', url);
    var json = JSON.parse(res.getBody('utf-8'));
    if (json['status'] == "OK") {
        var predictions = json['predictions'];
        for (var i = 0; i < predictions.length; i++) {
            var terms = [];
            for (var j = 0; j < predictions[i]['terms'].length; j++) {
                terms.push(predictions[i]['terms'][j]['value']);
            }
            var result = {
                description: predictions[i].description,
                place_id: predictions[i].place_id,
                main_text: predictions[i]['structured_formatting']['main_text'],
                secondary_text: predictions[i]['structured_formatting']['secondary_text'],
                terms: terms,
                types: predictions[i]['types']
            }
            out.results.push(result);
        }
        out.results = filterTypes(out.results, ['transit_station', 'car_wash']);
        return out;
    }
    return {}
}

/**
 * 
 * @param {String} placeID 
 * @returns {JSON}
 */
function coordinateByPlaceID(placeID) {
    var url = encodeURI(`https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyBIz58g-1hYPpU_FPmdX0gwhiEU87QCdAo&place_id=${placeID}&language=iw`);
    var res = request('GET', url);
    var json = JSON.parse(res.getBody('utf-8'));
    var out = {
        address_components: [],
        location: {}
    }
    if (json['status'] == "OK") {
        out.address_components = json['results'][0]['address_components'];
        out.location.latitude = json['results'][0]['geometry']['location']['lat'];
        out.location.longitude = json['results'][0]['geometry']['location']['lng'];
        return out;
    }
    return false;
}

function route(start, end) {
    var origin = '';
    var destination = '';
    
    if (typeof start == 'string')
        origin = start;
    else if (typeof(start) == 'object') 
        origin = `${start.latitude},${start.longitude}`;
    var url;
    if (end['place_id'] != null) {
        url = encodeURI(`https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=place_id:${end['place_id']}&mode=walking&key=${googleMapsKey}`);
    } else if (end['latitude'] != null && end['longitude'] != null) {
        var destination = `${end['latitude']},${end['longitude']}`
        url = encodeURI(`https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=walking`);
    }
    else {
        return false
    }
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
    return false
}

/**
 * @param {JSON} start
 * @param {[JSON]} points 
 * @param {Number} minDistanceBetweemFruits
 */
async function filterRoute(start, points, minDistanceBetweemFruits, sqlAccess) {
    var newRoute = [];
    var startCoordinate = start
    try {
        var result = await fruits.getFruits(sqlAccess, points.length);
        for (var i = 0; i < points.length; i++) {
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
async function addressedGame(start, end, sessionID, sqlAccess) {
    var theRoute = route(start, end);
    if (theRoute === false) {
        return failure("can't find a route");
    }
    var filteredRoute;
    try {
        filteredRoute = await filterRoute(start, theRoute, 50, sqlAccess);
        return {
            sessionID: sessionID,
            points: filteredRoute
        };
    } catch (err) {
        return failure("can't filter the route");
    }
}

module.exports = {
    search,
    coordinateByPlaceID,
    route,
    filterRoute,
    addressedGame
};