var geolib = require('geolib');
var request = require('sync-request');
var coordinate = require('./global').coordinate;
var filterTypes = require('./global').filterTypes;
var randomGeo = require('./global').randomGeo;
const failure = require('./global').failure;
var fruits = require('./fruits');

// Not Accurate /////////////////////////////////////////////////

/**
 * 
 * @param {JSON} point - is coordinate is valid
 * @param {JSON} center - the coordinate that the circles coming from
 * @param {Number} minDistance - the small circle radius
 * @param {Number} maxDistance - the big circle radius
 */
function isValidPoint(center, point, minDistance, maxDistance) {
    var close = geolib.isPointInCircle(
        { latitude: point.latitude, longitude: point.longitude }, // coordinate to check
        { latitude: center.latitude, longitude: center.longitude }, // center
        minDistance // minimum radius
    );
    var far = geolib.isPointInCircle(
        { latitude: point.latitude, longitude: point.longitude }, // coordinate to check
        { latitude: center.latitude, longitude: center.longitude }, // center
        maxDistance // maximum radius
    );
    var distance = geolib.getDistanceSimple(
        { latitude: center.latitude, longitude: center.longitude },
        { latitude: point.latitude, longitude: point.longitude });
    
    if (!close && far) {
        return { valid: true };
    }
    else if (!close && !far) {
        return {
            valid: false,
            desciption: "to far",
            distance: distance
        };
    } else {
        return {
            valid: false,
            desciption: "to close",
            distance: distance
        };
    }
}

/**
 * checks if all the array of points is valid
 * get an array of coordinates and minimum distance between every coordinate
 * if the distance between one of the elements in the array is lower then the other
 * @method isValidPoints
 * @param {[JSON]} points 
 * @param {JSON} point 
 * @param {Number} minDistance 
 * @param {Number} maxDistance
 * @returns {JSON} if there are no lower distances then minDistance so the point isn't valid
 */
function isValidPoints(center, points, minDistance, maxDistance) {
    var distanceForPoints = {
        center: center,
        toPoint: []
    };
    for (var i = 0; i < points.length; i++) {
        var json = isValidPoint(points[i], center, minDistance, maxDistance);
        var distance = geolib.getDistanceSimple(
        { latitude: center.latitude, longitude: center.longitude },
        { latitude: points[i].latitude, longitude: points[i].longitude });
        if (!json.valid) {
            return {
                valid: false,
                wrongPoint: points[i],
                indexOfWrongPoint: i
            };
        } else {
            distanceForPoints.toPoint.push({
                'point': points[i],
                'index': i,
                'distance': distance
            });
        }
    }
    return distanceForPoints;
}

/**
 * 
 * @param {coordinate} center 
 * @param {coordinate} point 
 * @param {any} sqlAccess 
 */
async function makeAPointToValid(center, point, sqlAccess) {
    var url = `https://maps.googleapis.com/maps/api/directions/json?origin=${center.latitude},${center.longitude}&destination=${point.latitude},${point.longitude}&mode=walking`
    var res = request('GET', url);
    var json = JSON.parse(res.getBody('utf-8'));
    if (json['status'] == "OK") {
        var lat = json['routes'][0]['legs'][0]['end_location']['lat'];
        var lng = json['routes'][0]['legs'][0]['end_location']['lng'];
        try {
            return {
                status: "OK",
                distance: json['routes'][0]['legs'][0]['distance']['value'],
                duration: json['routes'][0]['legs'][0]['duration']['value'],
                coordinate: {
                    lat: lat,
                    lng: lng
                }
            }
        } catch (error) {
            return {
                status: "error",
                reason: error
            }
        }
    } else {
        return {
            reason: json
        }
    }
}

/**
 * 
 * @param {JSON} center - Coordinate
 * @param {JSON} point - Coordinate to check
 * @param {Number} minDistance - in meters, not radius
 * @param {Number} maxDistance - in meters, not radius
 */
async function isValidAndAccuratePoint(center, point, minDistance, maxDistance, sqlAccess) {
    var googleMapsRequests = 0;
    var validPoint = await makeAPointToValid(center, point, sqlAccess)
    if (validPoint.status == "OK") {
        return {
            status: validPoint.status,
            valid: validPoint.distance > minDistance && validPoint.distance < maxDistance,
            distance: validPoint.distance,
            duration: validPoint.duration,
            coordinate: validPoint.coordinate,
            googleMapsRequests: ++googleMapsRequests
        };
    } else {
        return validPoint;
    }
}

/**
 * 
 * @param {JSON} center - will be a coordinate
 * @param {Number} minDistance - the minimum distance between center and the closest fruit in meters
 * @param {Number} maxDistance - the maximum distance between center and the farest fruit in meters
 * @param {Number} numFruits  - number of fruits in the map
 */
async function validPoints(center, minDistance, maxDistance, numFruits, sqlAccess) {
    var jsonFruits;
    try {
        jsonFruits = await fruits.getFruits(sqlAccess);
    } catch (error) {
        return failure(error);
    }
    var out = {
        pointsAround: [],
        validPointsNotAround: [],
        numberOfRequests: 0
    }
    var googleMapsRequests = 0;
    var numPointsCreated = 0;
    var points = [];
    var notAround = [];
    while (numPointsCreated < numFruits) {
        try {
            var randomCoordinate = randomGeo(center, maxDistance).coordinate;
            var json = await isValidAndAccuratePoint(center, randomCoordinate, minDistance, maxDistance, sqlAccess);
            googleMapsRequests += json.googleMapsRequests;
            out.numberOfRequests += googleMapsRequests;
            if (json.valid == true) {
                var randomFruit = jsonFruits[Math.floor(Math.random() * jsonFruits.length)];
                points.push({
                    latitude: json.coordinate.lat,
                    longitude: json.coordinate.lng,
                    fruit: randomFruit
                });
                numPointsCreated++;
            } else {
                notAround.push({
                    latitude: json.coordinate.lat,
                    longitude: json.coordinate.lng
                });
            }
        } catch (error) {
            continue;
        }
    }
    out.pointsAround = points;
    out.validPointsNotAround = notAround;
    return out;
}

async function notAccuratePoints(center, minDistance, maxDistance, numFruits, sqlAccess) {
    var jsonFruits;
    try {
        jsonFruits = await fruits.getFruits(sqlAccess);
    } catch (error) {
        return {
            status: "error",
            reason: error
        };
    }
    var pointsAroundArray = []
    for (var i = 0; i < numFruits; i++) {
        var randomFruit = jsonFruits[Math.floor(Math.random() * jsonFruits.length)];
        var randomCoordinate = randomGeo(center, maxDistance);
        if (randomCoordinate.distance > minDistance && randomCoordinate.distance < maxDistance) {
            pointsAroundArray.push({
                coordinate: randomCoordinate.coordinate,
                distanceFromCenter: randomCoordinate.distance,
                fruit: randomFruit
            });
        }
    }
    return pointsAroundArray;
}

async function freeRunGame(center, minDistance, distance, numberOfFruits, sessionID, withAccuracy, sqlAccess) {
    if (withAccuracy === true) {
        var points;
        try {
            points = await validPoints(center, minDistance, distance, numberOfFruits, sqlAccess);
        } catch (error) {
            return failure(error);
        }
        var pointsAroundArray = points.pointsAround;
        var notAround = points.validPointsNotAround;
        var numberOfRequests = points.numberOfRequests
        return {
            sessionID: sessionID,
            centerPoint: center,
            pointsAround: pointsAroundArray,
            numberOfRequests: numberOfRequests
        };
    } else {
        var points;
        try {
            points = await notAccuratePoints(center, minDistance, distance, numberOfFruits, sqlAccess);
        } catch (err) {
            return err;
        }
        return {
            sessionID: sessionID,
            centerPoint: center,
            pointsAround: points
        };
    }
}

module.exports = { freeRunGame, validPoints, notAccuratePoints };