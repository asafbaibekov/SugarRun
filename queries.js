const pg = require('pg');
const readline = require('readline')
const fs = require('fs');
const moment = require('moment-timezone');

var client = new pg.Client({
    database: 'd8cenr4b0k8n10',
    user: 'kbwselcdiauwwy',
    password: '542c1050173c1938687cb8d160d575c0b8b0aa993a85f095b809a217fd054599',
    host: 'ec2-174-129-37-15.compute-1.amazonaws.com',
    post: 5432,
    ssl: true
})

client.connect(function (error) {
    if (error) {
        throw error;
    }
    console.log('Connected to postgres! Getting schemas...');
    recorsiveReadLine();
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
function recorsiveReadLine() {
    rl.question(
        "enter input\n", async (answer) => {
            try {
                if (answer == "CTUsers") {
                    var query = 'CREATE TABLE Users ("userID" serial NOT NULL, "accessToken" TEXT NULL, "facebookID" TEXT NULL)';
                    var result = await client.query(query, [])
                    console.log("Users Table Created");
                } else if (answer == "DTUsers") {
                    var query = 'DROP TABLE Users'
                    var result = await client.query(query, []);
                    console.log("Users table Droped");
                } else if (answer == "CTPrizes") {
                    var query = 'CREATE TABLE Prizes ("prizeID" serial NOT NULL, "businessID" integer NOT NULL, "image" BYTEA NOT NULL, "description" TEXT NULL, "shortName" TEXT NOT NULL, "expiredDate" TIMESTAMPTZ NULL)';
                    var result = await client.query(query, []);
                    console.log("Prizes Table Created");
                } else if (answer == "DTPrizes") {
                    var query = 'DROP TABLE Prizes'
                    var result = await client.query(query, []);
                    console.log("Prizes Table Droped");
                } else if (answer == "CTPrizesForUsers") {
                    var query = `CREATE TABLE PrizesForUsers ("userID" integer NOT NULL, "prizeID" integer NOT NULL)`;
                    var result = await client.query(query, []);
                    console.log("PrizesForUsers Table Created");
                } else if (answer == "DTPrizesForUsers") {
                    var query = `DROP TABLE PrizesForUsers`;
                    var result = await client.query(query, []);
                    console.log("PrizesForUsers Table Droped");
                } else if (answer == "CTFruits") {
                    var query = `CREATE TABLE Fruits ("fruitID" serial NOT NULL, "name" TEXT NOT NULL, "image" BYTEA NOT NULL)`;
                    var result = await client.query(query, []);
                    console.log("Fruits table created");
                } else if (answer == "DTFruits") {
                    var query = `DROP TABLE Fruits`;
                    var result = await client.query(query, []);
                    console.log("Fruits Table Droped");
                } else if (answer == "CTBusinesses") {
                    var query = 'CREATE TABLE Businesses ("businessID" serial NOT NULL, "userID" TEXT NULL, "businessName" TEXT NOT NULL, "email" TEXT NOT NULL, "phoneNumber" TEXT NOT NULL, "hashedPassword" TEXT NOT NULL, "logo" BYTEA NULL, "activeEmail" Boolean NOT NULL, "emailConfirmationHash" TEXT NULL)';
                    var result = await client.query(query, []);
                    console.log("Businesses Table Created");
                } else if (answer == "DTBusinesses") {
                    var query = 'DROP TABLE Businesses'
                    var result = await client.query(query, []);
                    console.log("Businesses Table droped");
                } else if (answer == "CTGameTypes") {
                    var query = 'CREATE TABLE GameTypes ("gameTypeID" serial NOT NULL, "typeName" TEXT NOT NULL, "typeIcon" BYTEA NULL)'
                } else if (answer == "DTGameTypes") {
                    var query = 'DROP TABLE GameTypes'
                } else if (answer == "CTSessions") {
                    var query = 'CREATE TABLE Sessions ("sessionID" serial NOT NULL, "userID" INTEGER NOT NULL, "startDate" TIMESTAMPTZ NOT NULL, "gameTypeID" INTEGER NOT NULL, "steps" INTEGER DEFAULT 0, "seconds" INTEGER DEFAULT 0, "distance" DOUBLE PRECISION DEFAULT 0)'
                    var result = await client.query(query, []);
                    console.log("Sessions Table Created");
                } else if (answer == "DTSessions") {
                    var query = 'DROP TABLE Sessions' // INSERT INTO GameTypes ("typeName") VALUES ('freeRun')
                    var result = await client.query(query, []);
                    console.log("Sessions Table Droped");
                } else if (answer == "CTMarkedAnnotationsForUserInSession") {
                    var query = 'CREATE TABLE markedAnnotationsForUserInSession ("sessionID" INTEGER NOT NULL, "latitude" NUMERIC NOT NULL, "longitude" NUMERIC NOT NULL, "fruitID" INTEGER NOT NULL)'
                    var result = await client.query(query, []);
                    console.log("markedAnnotationsForUserInSession Table Created");
                } else if (answer == "DTMarkedAnnotationsForUserInSession") {
                    var query = 'DROP TABLE markedAnnotationsForUserInSession'
                    var result = await client.query(query, []);
                    console.log("markedAnnotationsForUserInSession Table Droped");
                } else if (answer == "CTFruitsForPrize") {
                    var query = 'CREATE TABLE fruitsForPrize (id serial, "prizeID" INTEGER NOT NULL, "fruitID" INTEGER NOT NULL, "amount" INTEGER NOT NULL)';
                    var result = await client.query(query, []);
                    console.log("fruitsForPrize Table Created");
                } else if (answer == "DTFruitsForPrize") {
                    var query = 'DROP TABLE fruitsForPrize';
                    var result = await client.query(query, []);
                    console.log("fruitsForPrize Table Droped");
                } else if (answer == "CTInventoryFruitsForUser") {
                    var query = 'CREATE TABLE InventoryFruitsForUser (id serial, "userID" INTEGER NOT NULL, "fruitID" INTEGER NOT NULL)';
                    var result = await client.query(query, []);
                    console.log("InventoryFruitsForUser Table Created");
                } else if (answer == 'DTInventoryFruitsForUser') {
                    var query = 'DROP TABLE InventoryFruitsForUser';
                    var result = await client.query(query, []);
                    console.log("InventoryFruitsForUser Table Droped");
                } else if (answer == "CFaddUser") {
                    var query = `CREATE OR REPLACE FUNCTION addUser(facebookID TEXT, accessToken TEXT) RETURNS INTEGER AS $$
                                    DECLARE userID INTEGER;
                                    BEGIN
                                        IF (facebookID IS NOT NULL AND accessToken IS NOT NULL) THEN
                                            IF (SELECT EXISTS (SELECT FROM Users WHERE "facebookID" = facebookID)) THEN
                                                UPDATE Users SET "accessToken" = accessToken WHERE "facebookID" = facebookID RETURNING "userID" INTO userID;
                                            ELSE
                                                INSERT INTO Users ("facebookID", "accessToken") VALUES (facebookID, accessToken) RETURNING "userID" INTO userID;
                                            END IF;
                                        ELSE
                                            INSERT INTO Users ("facebookID", "accessToken") VALUES (null, null) RETURNING "userID" INTO userID;
                                        END IF;
                                        RETURN userID;
                                    END;
                                $$ LANGUAGE plpgsql;`
                    var result = await client.query(query, []);
                    console.log("addUser Function Created Or Replaced");
                } else if (answer == "CFupdateUser") {
                    var query = `CREATE OR REPLACE FUNCTION updateUser(userID INTEGER, facebookID TEXT, accessToken Text) RETURNS INTEGER AS $$
                                    DECLARE UserIDtoReturn INTEGER;
                                    BEGIN
                                        IF (userID IS NOT NULL AND facebookID IS NOT NULL AND accessToken IS NOT NULL) THEN
                                            IF (SELECT EXISTS (SELECT FROM Users WHERE "facebookID" = facebookID)) THEN
                                                IF ((SELECT "userID" FROM Users WHERE "facebookID" = facebookID) != userID) THEN
                                                    DELETE FROM users WHERE "userID" = userID;
                                                    DELETE FROM markedAnnotationsForUserInSession WHERE "sessionID" IN (SELECT "sessionID" FROM sessions WHERE sessions."userID" = userID);
                                                    DELETE FROM sessions WHERE "userID" = userID;
                                                    DELETE FROM prizesForUsers WHERE "userID" = userID;
                                                END IF;
                                                UPDATE Users SET "accessToken" = accessToken WHERE "facebookID" = facebookID RETURNING "userID" INTO UserIDtoReturn;
                                            ELSE
                                                UPDATE Users SET "facebookID" = facebookID, "accessToken" = accessToken WHERE "userID" = userID RETURNING "userID" INTO UserIDtoReturn;
                                            END IF;
                                        END IF;
                                        RETURN UserIDtoReturn;
                                    END;
                               $$ LANGUAGE plpgsql;`
                    var result = await client.query(query, []);
                    console.log("updateUser Function Created Or Replaced");
                } else if (answer == "CFaddPrize") {
                    var query = `CREATE OR REPLACE FUNCTION addPrize(userID TEXT, shortName TEXT, description TEXT, expiredDate TIMESTAMPTZ, image BYTEA, fruits INTEGER[]) RETURNS BOOLEAN AS $$
                                    DECLARE isAdded BOOLEAN DEFAULT FALSE;
                                    DECLARE businessID INTEGER;
                                    DECLARE prizeID INTEGER;
                                    BEGIN
                                        IF (userID IS NOT NULL AND shortName IS NOT NULL AND image IS NOT NULL AND fruits IS NOT NULL) THEN
                                            IF (SELECT EXISTS (SELECT FROM Businesses WHERE "userID" = userID)) THEN
                                                SELECT "businessID" FROM Businesses WHERE "userID" = userID INTO businessID;
                                                INSERT INTO Prizes ("businessID", "shortName", "description", "expiredDate", "image") VALUES (businessID, shortName, description, expiredDate, image) RETURNING "prizeID" INTO prizeID;
                                                WITH x AS (SELECT prizeID as "prizeID", fruits AS "fruits")
                                                INSERT INTO fruitsforprize ("prizeID", "fruitID") SELECT x."prizeID", unnest(x."fruits") FROM x;
                                                isAdded = TRUE;
                                            END IF;
                                        END IF;
                                        RETURN isAdded;
                                    END;
                                $$ LANGUAGE plpgsql;`
                                // INSERT INTO fruitsForPrize ("prizeID", "fruitID", "amount") SELECT prizeID AS "prizeID", f.* FROM json_to_recordset(fruits) AS f("fruitid" INTEGER, "count" INTEGER) INNER JOIN fruits ON (f."fruitid" = fruits."fruitID");
                    var result = await client.query(query, []);
                    console.log("addPrize Function Created Or Replaced");
                } else if (answer == "CFconfirmEmail") {
                    var query = `CREATE OR REPLACE FUNCTION confirmEmail(emailConfirmationHash TEXT, userID TEXT) RETURNS BOOLEAN AS $$
                                    DECLARE isChanged BOOLEAN DEFAULT FALSE;
                                    BEGIN
                                        IF (emailConfirmationHash IS NOT NULL AND userID IS NOT NULL) THEN
                                            SELECT EXISTS (SELECT FROM Businesses WHERE "emailConfirmationHash" = emailConfirmationHash) INTO isChanged;
                                            IF (isChanged) THEN
                                                UPDATE Businesses SET "emailConfirmationHash" = NULL, "activeEmail" = TRUE, "userID" = userID WHERE "emailConfirmationHash" = emailConfirmationHash;
                                            END IF;
                                        END IF;
                                        RETURN isChanged;
                                    END;
                                $$ LANGUAGE plpgsql;`
                    var result = await client.query(query, []);
                    console.log("confirmEmail Function Created Or Replaced");
                } else if (answer == "CTBusinessesWaitingList") {
                    var query = 'CREATE TABLE BusinessesWaitingList ("businessID" serial NOT NULL, "businessName" TEXT NOT NULL, "phoneNumber" TEXT NOT NULL, "email" TEXT NOT NULL)';
                    var result = await client.query(query, []);
                    console.log("BusinessesWaitingList Table Created");
                } else if (answer == "DTBusinessesWaitingList") {
                    var query = 'DROP TABLE BusinessesWaitingList';
                    var result = await client.query(query, []);
                    console.log("BusinessesWaitingList Table Droped");
                } else if (answer != "") {
                    var result = await client.query(answer, []);
                    console.log(result.rows);
                }
                recorsiveReadLine();
            } catch (error) {
                console.log(error);
            }
        }
    )
}