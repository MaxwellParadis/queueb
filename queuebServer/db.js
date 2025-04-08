//DB SETUP
async function sydb(client) {
    let keyspace =
        "CREATE KEYSPACE IF NOT EXISTS qb WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};";
    let users =
        "CREATE TABLE IF NOT EXISTS qb.users (id UUID PRIMARY KEY, username TEXT, email TEXT);";
    let scores =
        "CREATE TABLE IF NOT EXISTS qb.scores (id UUID, username TEXT, email TEXT, day INT, count INT, score INT, cube TEXT, PRIMARY KEY (day, score, username, id));";
    let blocks =
        "CREATE TABLE IF NOT EXISTS qb.blocks (day INT PRIMARY KEY, blocks list<int>);";
    //let drop = "DROP TABLE qb.scores;"

    let queries = [keyspace, users, blocks, scores];

    async function executeQueries() {
        for (const query of queries) {
            try {
                await client.execute(query);
                console.log("Data written successfully");
            } catch (err) {
                console.error("Write error:", err);
                console.log("Failed to write data");
            }
        }
    }
    await executeQueries();
}

module.exports = { sydb };

// try {
//     await client.execute(query, params, { prepare: true });
//     res.status(200).send('Data written successfully');
//   } catch (err) {
//     console.error('Write error:', err);
//     res.status(500).send('Failed to write data');
// }
