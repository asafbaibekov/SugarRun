const express = require('express');
const app = express();
const port = 8000;
const fs = require('fs');
const freeRun = require('./freeRun');
const addressed = require('./addressed');
const parkRun = require('./parkRun')
const coordinate = require('./global').coordinate;
const success = require('./global').success;
const failure = require('./global').failure;
const sendMail = require('./global').sendMail;
const guid = require('./global').guid;
const multer = require('multer');
const upload = multer();
const path = require('path');
const createHash = require('sha.js');
// const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const pg = require('pg');
const pgSession = require('connect-pg-simple')(session);
const moment = require('moment-timezone');
const request = require('sync-request');
// const morgan = require('morgan');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    limit: '1mb',
    extended: true
}));
// app.use(cookieParser());
// app.use(morgan('dev'));

var client = new pg.Client({
    database: 'd8cenr4b0k8n10',
    user: 'kbwselcdiauwwy',
    password: '542c1050173c1938687cb8d160d575c0b8b0aa993a85f095b809a217fd054599',
    host: 'ec2-174-129-37-15.compute-1.amazonaws.com',
    post: 5432,
    ssl: true
})

app.use('/', express.static(__dirname + '/public/website'));
app.use('/businessplatform', express.static(__dirname + '/public/businessplatform'));
app.use('/register', express.static(__dirname + '/public/registerBusiness'));
app.use('/icon', express.static(__dirname + '/'));
app.use('/mail', express.static(__dirname + '/confirmMailPage'));
// app.use('/upload', express.static(__dirname + '/public/uploadFruit'));

app.use(session({
    store: new pgSession({
        pool: client,
        tableName: "session"
    }),
    secret:  "jrhfgiuerhfbjhfgauiehfbkrjhgaervbeo",//process.env.FOO_COOKIE_SECRET,
    resave: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000
    },
    saveUninitialized: false
}));

// app.listen(port, '127.0.0.1', function () {
//     console.log(`I'm running on port:`, port);
// });
client.connect(function (error) {
    if (error) {
        throw error;
    }
    var server = app.listen(port, require('os').networkInterfaces()["en0"][1]["address"], function () {
        console.log(`I'm running on: ${server.address().address}:${server.address().port}`);
    });
    console.log('Connected to postgres! \Getting schemas...');
});

app.get('/dashboard', function (req, res) {
    return res.redirect('/dashboard/prizes');
})

app.post('/app', async function (request, response) {
    console.log(request.body);
    var json = request.body
    var query;

    if (json['method'] == "init") {
        var facebookID = json['facebookID'],
            accessToken = json['accessToken'];
        if (facebookID != null && accessToken == null) {
            return response.send(failure("'accessToken' required when inputing facebookID"));
        }
        try {
            query = (facebookID == null && accessToken == null) ? `SELECT addUser(null, null)` : `SELECT addUser('${facebookID}', '${accessToken}')`;
            var result = await client.query(query, []);
            var userID = result.rows[0]["adduser"]
            return response.send(success({
                userID: userID
            }));
        } catch (reason) {
            return response.send(failure(reason));
        }
    } else if (json['method'] == "userUpdate") {
        if (json['userID'] == null)
            return response.send(failure("'userID' required"));
        else if (json['facebookID'] == null)
            return response.send(failure("'facebookID' required"));
        else if (json['accessToken'] == null)
            return response.send(failure("'accessToken' required"));
        else {
            try {
                query = `SELECT updateUser(${json['userID']}, '${json['facebookID']}', '${json['accessToken']}')`;
                var result = await client.query(query, []);
                var userID = result.rows[0]['updateuser'];
                console.log(`userID: ${userID}`);
                response.send(success({
                    userID: userID
                }));
            } catch (reason) {
                return response.send(failure(reason));
            }
        }
    } else if (json['method'] == "parkRun") {
        var userID = json['userID'];
        var sessionID;
        try {
            query = `SELECT EXISTS (SELECT FROM Users where "userID" = '${userID}')`;
            var result = await client.query(query, []);
            if (result.rows[0]['exists'] === true) {
                query = `INSERT INTO Sessions ("userID", "startDate", "gameTypeID") VALUES ('${userID}', 'NOW()', (SELECT "gameTypeID" FROM GameTypes WHERE "typeName" = 'parkRun')) RETURNING "sessionID"`;
                var result = await client.query(query, []);
                sessionID = result.rows[0]['sessionID'];
                var res = await parkRun.parkRun(sessionID, client)
                return response.send(success({ result: res }));
            } else {
                return response.send(failure("'userID' is not exists"));
            }
        } catch (error) {
            return response.send(failure("can't connect to sql server"));
        }
    } else if (json['method'] == "freeRun") {
        if (json['userID'] == null)
            return response.send(failure("'userID' required"));
        else if (json['center'] == null)
            return response.send(failure("'center' required"));
        else if (json['center']['latitude'] == null)
            return response.send(failure("'center' with 'latitude' required"));
        else if (json['center']['longitude'] == null)
            return response.send(failure("'center' with 'longitude' required"));
        else {
            var userID = json['userID'],
                center = json['center'],
                distance = 600,
                numberOfFruits = 5,
                withAccuracy = true,
                minDistance = 50;
            var sessionID;
            try {
                query = `SELECT EXISTS (SELECT FROM Users where "userID" = '${userID}')`;
                var result = await client.query(query, []);
                if (result.rows[0]['exists'] === true) {
                    query = `INSERT INTO Sessions ("userID", "startDate", "gameTypeID") VALUES ('${userID}', NOW(), (SELECT "gameTypeID" FROM GameTypes WHERE "typeName" = 'freeRun')) RETURNING "sessionID"`;
                    var result = await client.query(query, []);
                    sessionID = result.rows[0]['sessionID'];
                    var res = await freeRun.freeRunGame(center, minDistance, distance, numberOfFruits, sessionID, withAccuracy, client);
                    return response.send(success(res));
                } else {
                    return response.send(failure("'userID' is not exists"));
                }
            } catch (error) {
                return response.send(failure("can't connect to sql server"));
            }
        }
    } else if (json['method'] == "search") {
        var userID = json['userID'];
        /* check if userID exists in the database
         * if true: save userID action in database with the name of the method
         * else: response.send({error: 'UserID Not Found'});
         */
        if (json['toSearch'] == null) {
            return response.send(failure("'toSearch' required"));
        } else if (json['currentLocation'] == null) {
            return response.send(failure("'currentLocation' required"));
        } else if (json['currentLocation']['latitude'] == null || json['currentLocation']['longitude'] == null) {
            return response.send(failure("'latitude' and 'longitude' required"));
        }
        var toSearch = json['toSearch'];
        var currentLocation = json['currentLocation'];
        var out = addressed.search(userID, toSearch, currentLocation, 5000);
        return response.send(success(out));
    } else if (json['method'] == "addressed") {
        if (json['userID'] == null)
            return response.send(failure("'userID' required"));
        else if (json['start'] == null)
            return response.send(failure("'start' required"));
        else if (json['start']['latitude'] == null && json['start']['longitude'] == null)
            return response.send(failure("'start' with 'latitude' and 'longitude' required"));
        else if (json['end'] == null)
            return response.send(failure("'end' required"));
        else if (json['end']['place_id'] == null && (json['end']['latitude'] == null && json['end']['longitude'] == null))
            return response.send(failure("'end' with 'place_id' or 'latitude' and 'longitude' required"));
        else if (json['end']['place_id'] != null && !(json['end']['latitude'] == null && json['end']['longitude'] == null)) {
            return response.send(failure("'end' with 'place_id' or 'latitude' and 'longitude' required"));
        } else {
            var userID = json['userID'],
                start = json['start'],
                end = json['end'],
                sessionID;
            try {
                query = `SELECT EXISTS (SELECT FROM Users where "userID" = '${userID}')`;
                var result = await client.query(query, []);
                if (result.rows[0]['exists'] === true) {
                    query = `INSERT INTO Sessions ("userID", "startDate", "gameTypeID") VALUES ('${userID}', NOW(), (SELECT "gameTypeID" FROM GameTypes WHERE "typeName" = 'addressed')) RETURNING "sessionID"`;
                    var result = await client.query(query, []);
                    sessionID = result.rows[0]['sessionID'];
                    var res = await addressed.addressedGame(start, end, sessionID, client);
                    return response.send(success({
                        result: res
                    }));
                } else {
                    return response.send(failure("'userID' is not exists"));
                }
            } catch (error) {
                return response.send(failure("can't connect to sql server"));
            }
        }
    } else if (json['method'] == "collectAnnotation") {
        var sessionID = json['sessionID'];
        var location = json['coordinate'];
        var fruitID = json['fruitID'];
        if (sessionID == null)
            return response.send(failure("'sessionID' required"));
        else if (location == null)
            return response.send(failure("'center' required"));
        else if (location.latitude == null)
            return response.send(failure("'center' with 'latitude' required"));
        else if (location.longitude == null)
            return response.send(failure("'center' with 'longitude' required"));
        else if (fruitID == null)
            return response.send(failure("'fruitID' required"));
        else {
            var gameTypeID;
            try {
                query = `WITH markAnnotation AS (
                            INSERT INTO markedAnnotationsForUserInSession ("sessionID", "latitude", "longitude", "fruitID") VALUES (${sessionID}, ${location.latitude}, ${location.longitude}, ${fruitID}) RETURNING "sessionID", "fruitID"
                        ), addFruit AS (
                            INSERT INTO inventoryFruitsForUser ("userID", "fruitID") SELECT s."userID", ma."fruitID" FROM markAnnotation ma INNER JOIN sessions s on (ma."sessionID" = s."sessionID")
                        )
                        SELECT "gameTypeID" FROM sessions WHERE "sessionID" = (SELECT "sessionID" FROM markAnnotation)`;
                var result = await client.query(query, []);
                gameTypeID = result.rows[0]['gameTypeID'];
            } catch (error) {
                return response.send(failure("can't connect to sql server"));
            }
            if (gameTypeID == 1) {
                var center = json['center'],
                    distance = 600,
                    numberOfFruits = 5,
                    withAccuracy = true,
                    minDistance = 50;
                var res = freeRun.freeRunGame(center, minDistance, distance, numberOfFruits, sessionID, withAccuracy);
                return response.send(success(res));
            }
            else if (gameTypeID == 2) {} // addressed
            else if (gameTypeID == 3) {} // parkRun
            return response.send(success());
        }
    } else if (json['method'] == "getPrizes") {
        var userID = json['userID'];
        var forUser = json['forUser'];
        if (userID == null)
            return response.send(failure("'userID' required"));
        else if (forUser == null)
            return response.send(failure("'forUser' required"));
        else if (typeof forUser != "boolean")
            return response.send(failure("'forUser' should be boolean"));
        else {
            try {
                var out = [];
                if (forUser) {
                    // return all prizes of the user, even if they are not active.
                    query = `SELECT Prizes.* FROM Prizes INNER JOIN PrizesForUsers ON Prizes."prizeID" = PrizesForUsers."prizeID" INNER JOIN Users ON PrizesForUsers."userID" = ${userID}`;
                    var result = await client.query(query, []);
                    for (var i = 0; i < result.rows.length; i++) {
                        var expiredDate = new Date(result.rows[i].expiredDate)
                        var date = expiredDate.toLocaleDateString()
                        var time = expiredDate.toLocaleTimeString()
                        out.push({
                            prizeName: result.rows[i].shortName,
                            description: result.rows[i].description,
                            prizeID: result.rows[i].prizeID,
                            businessID: result.rows[i].businessID,
                            expiredDate: {
                                date: date,
                                time: time
                            },
                            image: result.rows[i].image.toString('UTF-8')
                        })
                    }
                    return response.send(success(out));
                } else {
                    query = `SELECT * FROM Prizes WHERE "expiredDate" > NOW()`;
                    var result = await client.query(query, []);
                    for (var i = 0; i < result.rows.length; i++) {
                        var expiredDate = moment.tz(result.rows[i].expiredDate, "Asia/Jerusalem");
                        out.push({
                            prizeName: result.rows[i].shortName,
                            description: result.rows[i].description,
                            prizeID: result.rows[i].prizeID,
                            businessID: result.rows[i].businessID,
                            expiredDate: {
                                date: expiredDate.format('DD/MM/YYYY'),
                                time: expiredDate.format('HH:mm:ss')
                            },
                            image: result.rows[i].image.toString('UTF-8')
                        })
                    }
                    return response.send(success(out));
                }
            } catch(error) {
                return response.send(failure(error));
            }
        }
    } else if (json['method'] == "fruitsForPrizes") {
        var userID = json['userID'];
        var prizeID = json['prizeID'];
        if (userID == null)
            return response.send(failure("'userID' required"));
        else if (prizeID == null)
            return response.send(failure("'prizeID' required"));
        else {
            try {
                query = `SELECT ffp."prizeID", ffp."amount", f.*  FROM fruitsforprize ffp INNER JOIN fruits f ON (ffp."fruitID" = f."fruitID") WHERE ffp."prizeID" = ${prizeID} AND ffp."amount" > 0 ORDER BY "fruitID"`
                var result = await client.query(query, []);
                var fruitsForPrizes = [];
                for (var i = 0; i < result.rows.length; i++) {
                    fruitsForPrizes.push({
                        amount: result.rows[i].amount,
                        userAmount: 0,
                        fruitID: result.rows[i].fruitID,
                        image: result.rows[i].image.toString('UTF-8')
                    });
                }
                query = `select "userID", "fruitID", COUNT("fruitID") as "amount" from inventoryfruitsforuser where "userID" = 1 group by "fruitID", "userID"`;
                var result = await client.query(query, []);
                for (var i = 0; i < fruitsForPrizes.length; i++) {
                    for (var j = 0; j < result.rows.length; j++) {
                        if (fruitsForPrizes[i].fruitID == result.rows[j].fruitID) {
                            fruitsForPrizes[i].userAmount = result.rows[j].amount
                        }
                    }
                }
                var canBuy = true;
                for (var i = 0; i < fruitsForPrizes.length; i++) {
                    if (fruitsForPrizes[i].userAmount < fruitsForPrizes[i].amount) {
                        canBuy = false;
                        break;
                    }
                }
                return response.send(success({
                    fruitsForPrizes: fruitsForPrizes,
                    canBuy: canBuy
                }));
            } catch (error) {
                return response.send(failure(error));
            }
        }
    } else if (json['method'] == "bayPrize") {
        var prizeID = json.prizeID;
        var userID = json.userID;
        if (userID == null)
            return response.send(failure("'userID' required"));
        else if (prizeID == null)
            return response.send(failure("'prizeID' required"));
        else {
            var query = `with parameters as (
                            select ${userID} as "userID", ${prizeID} as "prizeID"
                        ), prize_enum as (
                            select id, "prizeID", "fruitID", row_number() over (partition by "prizeID", "fruitID" order by id) as fruitnum
                            from fruitsForPrize
                        ), inventory_enum as (
                            select id as invid, "userID", "fruitID", row_number() over (partition by "userID","fruitID" order by id) as fruitnum 
                            from inventoryfruitsforuser
                        ), prizeAmount as (
                            select p."prizeID", p."fruitID", count(p."fruitID")
                            from fruitsForPrize p
                            where "prizeID" = ${prizeID}
                            group by 1, 2
                        ), userAmount as (
                            select u."userID", u."fruitID", count(u."fruitID")
                            from inventoryfruitsforuser u
                            where "userID" = ${userID}
                            group by 1, 2
                        ), checkPrize as (
                            select *, pa.count <= ua.count enough from prizeAmount pa
                            left join userAmount ua on (pa."fruitID" = ua."fruitID")
                        ), enoughForPrize as (
                            select true = ALL(array_agg(enough)) allEnough from checkPrize
                        ), toDelete as (
                            select *
                            from prize_enum p
                            inner join inventory_enum i on (i."fruitID" = p."fruitID" and i.fruitnum = p.fruitnum)
                            inner join parameters params on (i."userID" = params."userID" and p."prizeID" = params."prizeID")
                            inner join enoughForPrize on (allEnough = true)
                            ), insertPrizeForUser as (
                            insert into prizesForUsers ("prizeID", "userID")
                            select "prizeID", "userID" from parameters
                            join enoughForPrize e on (e.allEnough = true)
                        ), deleteIt as (
                            DELETE FROM inventoryfruitsforuser z
                            USING (
                                select * from toDelete
                            ) a
                            where a.invid = z.id
                        )
                        select * from enoughForPrize;`
            try {
                var result = await client.query(query, []);
                console.log(result);
                if (result.rows[0].allenough === true) {
                    // return the barcode.
                }
                return response.send(success());
            } catch(error) {

            }
        }
    } else if (json['method'] == "saveData") {
        var sessionID = json['sessionID'];
        var steps = json['steps'];
        var time = json['time'];
        var distance = json['distance'];
        if (sessionID == null)
            return response.send(failure("'sessionID' required"));
        else if (steps == null)
            return response.send(failure("'steps' required"));
        else if (time == null)
            return response.send(failure("'time' required"));
        else if (distance == null)
            return response.send(failure("'distance' required"));
        else {
            var query = `UPDATE sessions SET "steps" = ${steps}, "seconds" = ${time}, "distance" = ${distance} WHERE "sessionID" = ${sessionID}`
            try {
                var result = await client.query(query, []);
                return response.send(success());
            } catch (error) {
                return response.send(failure());
            }
        }
    } else if (json['method'] == "profileData") {
        var userID = json['userID']
        if (userID == null)
            return response.send(failure("'userID' required"));
        else {
            try {
                var query = `select sum(steps) steps, sum(seconds) seconds, sum(distance) distance from sessions where "userID" = ${userID}; select * from users where "userID" = ${userID};`
                var result = await client.query(query, []);
                // var out = [];
                var steps = result.rows[0].steps;
                var seconds = result.rows[0].seconds;
                var distance = result.rows[0].distance;
                // get accessToken of the user
                // if he has one
                // request facebook data
                // otherwise he is a guest user

                response.send(success({
                    steps: steps,
                    seconds: seconds,
                    distance: distance
                }));
            } catch(error) {
                response.send(failure());
            }
        }
    } else if (json['method'] == "myScores") {
        var userID = json['userID'];
        if (userID == null) {
            return response.send(failure("'userID' required"));
        } else {
            try {
                var query = `select * from sessions where "userID" = ${userID};`
                var result = await client.query(query, []);
                var out = [];
                
                for (var i = 0; i < result.rows.length; i++) {
                    var sessionID = result.rows[i]["sessionID"];
                    
                    var startDate = moment.tz(result.rows[i]["startDate"], "Asia/Jerusalem");
                    
                    var gameTypeID = result.rows[i]["gameTypeID"];
                    var steps = result.rows[i]["steps"];
                    var seconds = result.rows[i]["seconds"];
                    var distance = result.rows[i]["distance"];
                    // var date = startDate.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' });
                    out.push({
                        sessionID: sessionID,
                        startDate: {
                            fulldate: startDate.format('DD/MM/YYYY HH:mm:ss ZZ'),
                            day: startDate.format('DD'),
                            month: startDate.format('MM'),
                            year: startDate.format('YYYY'),
                            hour: startDate.format('HH')
                        },
                        gameTypeID: gameTypeID,
                        steps: steps,
                        seconds: seconds,
                        distance: distance
                    });
                }
                response.send(success(out));
            } catch(error) {
                response.send(failure());
            }
        }
    } else if (json['method'] == "fruitsForSession") {
        var sessionID = json['sessionID'];
        if (sessionID == null)
            return response.send(failure("'sessionID' required"));
        try {
            var query = `SELECT m.*, f."name", f."image", f."businessID" from markedannotationsforuserinsession m INNER JOIN fruits f on m."fruitID" = f."fruitID" WHERE m."sessionID" = ${sessionID}`;
            var result = await client.query(query, []);
            var fruitsWithLocation = [];
            var countPerFruit = [];
            for (var i = 0; i < result.rows.length; i++) {
                fruitsWithLocation.push({
                    location: coordinate(result.rows[i].latitude, result.rows[i].longitude),
                    fruit: {
                        fruitID: result.rows[i].fruitID,
                        name: result.rows[i].name,
                        image: result.rows[i].image.toString('UTF-8'),
                        businessID: result.rows[i].businessID
                    }
                });
            }

            function contains(a, obj) {
                for (var i = 0; i < a.length; i++) {
                    if (a[i] === obj) {
                        return true;
                    }
                }
                return false;
            }
            var fruitIDsExists = [];
            for (var i = 0; i < fruitsWithLocation.length; i++) {
                var fruitID = fruitsWithLocation[i].fruit.fruitID
                if (contains(fruitIDsExists, fruitID)) {
                    for (var j = 0, flag = true; j < fruitIDsExists.length && flag; j++) {
                        if (countPerFruit[j].fruit.fruitID == fruitID) {
                            countPerFruit[j].count += 1;
                            flag = false;
                        }
                    }
                } else {
                    fruitIDsExists.push(fruitsWithLocation[i].fruit.fruitID);
                    countPerFruit.push({
                        fruit: fruitsWithLocation[i].fruit,
                        count: 1,
                    });
                }
            }
            response.send(success({
                fruitsWithLocation: fruitsWithLocation,
                countPerFruit: countPerFruit
            }));
        } catch(error) {
            response.send(failure());
        }
    } else if (json['method'] == "friendsScores") {

    } else {
        return response.send(failure("'method' required"));
    }
});

app.post('/insertFruit', upload.array('pic', 1), function (request, response) {
    if (request.files[0] == null)
        return response.send(failure("file isn't found"));
    var base64 = request.files[0]['buffer'].toString('base64');
    var name = request.files[0]['originalname'].split('.')[0];
    console.log(`name: ${name}`);
    console.log(`base64: ${base64}`);
    query = `INSERT INTO Fruits ("name", "image") VALUES ('${name /*TEXT NOT NULL*/}', '${base64 /*BYTEA NOT NULL*/}')`
    client.query(query, [])
        .then(result => {
            console.log(result.rows);
            return response.send(success(result.rows));
        })
        .catch(reason => {
            return response.send(failure(reason));
        })
});

app.post('/waitlist', async function (request, response) {
    console.log(request.body);
    var json = request.body;
    var out = {};

    var businessName = json["businessName"];
    var phoneNumber = json["phoneNumber"];
    var email = json["email"];
    var errors = {};
    // var errors = [];
    if (businessName == "" || businessName == null) {
        errors["0"] = "'businessName' is empty";
    }
    if (phoneNumber == "" || phoneNumber == null) {
        errors["1"] = "'phoneNumber' is empty";
    } else if (!(/^\+?(972|0)(\-)?0?(([23489]{1}\d{7})|[5]{1}\d{8})$/.test(phoneNumber))) {
        errors["1"] = "'phoneNumber' is not valid";
    }
    if (email == "" || email == null) {
        errors["2"] = "'email' is empty";
    } else if (!(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email))) {
        errors["2"] = "'email' is not valid";
    }
    if (!(Object.keys(errors).length === 0 && errors.constructor === Object)) { // if the json 'errors' is not empty
        return response.send(failure(errors));
    }
    try {
        var query = `INSERT INTO BusinessesWaitingList ("businessName", "phoneNumber", "email") VALUES ('${businessName}', '${phoneNumber}', '${email}')`;
        var result = await client.query(query, []);
    } catch (error) {
        return response.send(failure({
            "3": "error on saving, try again"
        }));
    }

    /**
     * enter the details to sql database
     * response to the user a file or notification that the user registered successfully and we will contact him soon.
     */

    return response.send(success());
});

app.post('/login', async function (request, response) {
    console.log(request.body);
    var json = request.body;

    var userID = json["userID"];
    var password = json["password"];

    var errors = {};
    if (userID == "" || userID == null) {
        errors["1"] = "'userID' is empty";
    }
    if (password == "" || password == null) {
        errors["2"] = "'password' is empty";
    }
    if (!(Object.keys(errors).length === 0 && errors.constructor === Object)) { // if the json 'errors' is not empty
        return response.send(failure(errors));
    }
    var sha256 = createHash('sha256');
    var hashedPassword = sha256.update(password, 'utf8').digest('hex');
    var query = `SELECT "userID" FROM Businesses WHERE "userID" = '${userID}' AND "hashedPassword" = '${hashedPassword}'`; //HASHED PASSWORD AND USER ID ARE EQUAL OTHERWISE USER NOT EXISTS
    try {
        var result = await client.query(query, []);
        request.session.userID = result.rows[0]["userID"];
    } catch (error) {
        console.log(error);
        return response.status(500).send();
    }
    return response.status(200).send({
        userID: userID,
        password: hashedPassword
    });
})

app.post('/registerBusiness', upload.single('pic'), async function (request, response) {
    console.log(request.body);
    console.log(request.file);

    var json = request.body;

    var logo = request.file;
    var businessName = json["businessName"];
    var phoneNumber = json["prefix"] + json["phoneNumber"];
    var email = json["email"];
    var password = json["password"];
    var verifyPassword = json["verifyPassword"];

    var errors = {};
    if (request.file == null) {
        errors["0"] = "'logo' image is empty";
    }
    if (businessName == "" || businessName == null) {
        errors["1"] = "'businessName' is empty";
    }
    if (phoneNumber == "" || phoneNumber == null) {
        errors["2"] = "'phoneNumber' is empty";
    } else if (!(/^\+?(972|0)(\-)?0?(([23489]{1}\d{7})|[5]{1}\d{8})$/.test(phoneNumber))) {
        errors["2"] = "'phoneNumber' is not valid";
    }
    if (email == "" || email == null) {
        errors["3"] = "'email' is empty";
    } else if (!(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email))) {
        errors["3"] = "'email' is not valid";
    }
    if (password == "" || password == null) {
        errors["4"] = "'password' is empty";
    }
    if (verifyPassword == "" || verifyPassword == null) {
        errors["5"] = "'verifyPassword' is empty";
    }
    if (password != verifyPassword) {
        errors["6"] = "'password' and 'verifyPassword' are not maching";
    }
    if (!(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{6,}$/.test(password))) {
        errors["7"] = "'password' is not valid";
    }
    if (!(Object.keys(errors).length === 0 && errors.constructor === Object)) { // if the json 'errors' is not empty
        return response.send(failure(errors));
    }
    try {
        var sha256 = createHash('sha256');
        var hashedPassword = sha256.update(password, 'utf8').digest('hex');
        var uniqeID = guid()//sha256.update(email, 'utf8').digest('hex');
        var query = `INSERT INTO Businesses ("businessName", "email", "phoneNumber", "hashedPassword", "logo", "activeEmail", "emailConfirmationHash") VALUES ('${businessName}', '${email}', '${phoneNumber}', '${hashedPassword}', '${logo['buffer'].toString('base64')}', FALSE, '${uniqeID}')`;
        var result = await client.query(query, []);
    } catch (error) {
        console.log(error);
        return response.send(failure({
            "8": "error on saving, try again"
        }));
    }

    var linkToConfirm = `http://${request.headers.host}/confirm/${uniqeID}`;
    sendMail(email, 'SugarRun - email confirmation', linkToConfirm); // `click on the link to confirm your account at SugarRun\n${}`
    return response.send({
        redirect: '/businessplatform'
    });
})

var generate = function (idLength) {
    var ALPHABET = '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var rtn = '';
    for (var i = 0; i < idLength; i++) {
        rtn += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }
    return rtn;
}

// problem when click again on the link in the mail
// what happend is the user get's new userID but it is not updating on the database
// to solve it, i should check if the emailConfirmationHash is exists on the database.
app.get('/confirm/:emailConfirmationHash', async function (request, response) {
    var checkHash = request.params.emailConfirmationHash;
    try {
        var query;
        var userID = generate(5);
        query = `SELECT EXISTS (SELECT FROM Businesses WHERE "userID" = '${userID}')`;
        var result = await client.query(query, []);
        while (result.rows[0]['exists'] === true) {
            userID = generate(5);
            query = `SELECT EXISTS (SELECT FROM Businesses WHERE "userID" = '${userID}')`;
            result = await client.query(query, []);
            console.log(result.rows[0]);
        }
        query = `SELECT confirmEmail('${checkHash}', '${userID}')`
        result = await client.query(query, []);
        return response.send(`your user id is: ${userID}\nCopy and save it`);
    } catch (error) {
        console.log(error);
        return response.send("Error has been occurred");
    }
});

app.use("/images", express.static(__dirname + '/private/dashboard/images'));

var auth = async function (request, response, next) {
    var userID = request.session.userID;
    if (typeof request.session.userID === 'string') {
        try {
            var query = `SELECT EXISTS (SELECT "userID" FROM Businesses WHERE "userID" = '${userID}')`;
            var result = await client.query(query, []);
            if (result.rows[0]['exists'] === true) {
                return next(false);
            }
        } catch (error) {
            return response.sendStatus(500);
        }
    } else {
        return next(true);
        // return response.sendStatus(401);
    }
}

var shouldRedirect = function(toRedirect, request, response, next) {
    if (toRedirect === true) {
        return response.redirect('/businessplatform');
    }
    else {
        next();
    }
}

app.use("/dashboard/prizes", auth, shouldRedirect, express.static(__dirname + '/private/dashboard/production/prizes'));

app.use("/dashboard/addprize", auth, shouldRedirect, express.static(__dirname + '/private/dashboard/production/addprize'));

app.use("/fetchFruits", auth, async function(request, response) {
    try {
        var userID = request.session.userID;
        var query = `SELECT * FROM Fruits WHERE "businessID" = 0 OR "businessID" = (SELECT "businessID" FROM Businesses WHERE "userID" = '${userID}') ORDER BY "fruitID"`
        // return global fruits and business fruits.
        var result = await client.query(query, []);
        var out = [];
        for (var i = 0; i < result.rows.length; i++) {
            out.push({
                fruitID: result.rows[i].fruitID,
                image: result.rows[i].image.toString('UTF-8')
            })
        }
        return response.status(200).send(out);
    } catch (error) {
        return response.sendStatus(500);
    }
})

app.use("/fetchProfile", auth, async function (request, response) {
    
    try {
        var userID = request.session.userID;
        var query = `SELECT "businessName", "logo" FROM Businesses WHERE "userID" = '${userID}'`
        var result = await client.query(query, []);
        var out = {
            businessName: result.rows[0].businessName,
            logo: result.rows[0].logo.toString('UTF-8')
        }
        // var query = `SELECT * FROM Fruits ORDER BY "fruitID"`
        // var result = await client.query(query, []);
        // console.log(result.rows[0]);
        // console.log(result.rows[0]['image'].toString('UTF-8'));
        return response.status(200).send(out);
    } catch (error) {
        return response.sendStatus(500);
    }
    
})

app.use("/fetchPrizes", auth, async function (request, response) {
    
    var userID = request.session.userID;
    query = `SELECT Prizes.* FROM Prizes INNER JOIN Businesses ON (Businesses."businessID" = Prizes."businessID") WHERE Businesses."userID" = '${userID}'`;    
    var result = await client.query(query, []);
    var out = [];
    for (var i = 0; i < result.rows.length; i++) {
        out.push({
            shortName: result.rows[i].shortName,
            image: result.rows[i].image.toString('UTF-8')
        });
    }
    console.log(out);
    response.send(out);
})

app.use("/insertPrize", upload.single('pic'), async function (request, response) {
    try {
        // businessID image description shortName expiredDate
        console.log(request);
        var json = request.body;
        var userID = request.session.userID;
        var prizeName = json['prizeName'];
        var description = json['description'];
        var expiredDate = json['expiredDate']
        var image = request.file['buffer'];
        var fruits = JSON.parse(json['fruits']); // to validate if it's json or not, if it isn't it throws an exeption.
        fruits = JSON.stringify(fruits);

        var errors = {};
        if (userID == null) {
            return response.send(failure("'userID' required"));
        }
        else {
            if (prizeName === "")
                errors["0"] = "'prizeName' is empty";
            if (description === "")
                errors["1"] = "'description' is empty";
            if (expiredDate === null)
                errors["2"] = "'datepicker' is empty";
            if (image === null)
                errors["3"] = "'image' is empty";
            if (fruits === null)
                errors["4"] = "'fruits' is empty";
            if (!(Object.keys(errors).length === 0 && errors.constructor === Object)) { // if the json 'errors' is not empty
                return response.send(failure(errors));
            } else {
                var query = `SELECT addPrize('${userID}', '${prizeName}' , '${description}', '${expiredDate}'::timestamp, '${image.toString('base64')}', '${fruits}')`; // '${fruits}'::json
                // SELECT Businesses.*, Prizes.* FROM Prizes INNER JOIN Businesses ON Businesses."businessID" = Prizes."businessID"
                var result = await client.query(query, []);
                console.log(`result isAdded: ${result.rows}`)
                return response.status(200).send();
            }
        }
    } catch(error) {
        if (error.name == "SyntaxError") {
            return response.status(400).send();
        }
        return response.status(500).send();
    }
});

app.get('/logout', function (request, response) {
    request.session.destroy();
    response.send("logout success!");
});