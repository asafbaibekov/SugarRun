async function getFruits(sqlAccess) {
    var query = `SELECT * FROM Fruits ORDER BY "fruitID"`;
    try {
        var result = await sqlAccess.query(query, []);
    } catch (error) {
        return {
            status: "error",
            reason: error
        }
    }
    var jsonFruits = result.rows;
    var fruitsToReturn = [];
    for (var i = 0; i < jsonFruits.length; i++) {
        fruitsToReturn.push({
            fruitID: jsonFruits[i]['fruitID'],
            name: jsonFruits[i]['name'],
            image: jsonFruits[i]['image'].toString('UTF-8')
        })
    }
    return fruitsToReturn;
}

module.exports = { getFruits }