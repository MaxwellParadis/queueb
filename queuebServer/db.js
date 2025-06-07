//DB SETUP
async function mdb(pool, dbn) {
    let db =
        `CREATE DATABASE IF NOT EXISTS ${dbn};`;
    let users =
        `CREATE TABLE IF NOT EXISTS ${dbn}.users (id CHAR(36) PRIMARY KEY, username VARCHAR(30), email VARCHAR(99));`;
    let scores =
        `CREATE TABLE IF NOT EXISTS ${dbn}.scores (id CHAR(36) PRIMARY KEY, username VARCHAR(30), email VARCHAR(99), day INT, count INT, score INT, cube JSON);`;
    let blocks =
        `CREATE TABLE IF NOT EXISTS ${dbn}.blocks (day INT PRIMARY KEY, blocks JSON);`;
    //let drop = "DROP TABLE qb.blocks;"

    let queries = [ db, users, blocks, scores];

    async function executeQueries() {
      let conn;
      try {
        conn = await pool.getConnection();
      } catch(err) {
        console.error('Write error:', err);
      }
      if(conn) for (const query of queries) {
          try {
              await conn.query(query);
              console.log('Data written successfully');
            } catch (err) {
              console.error('Write error:', err);
              console.log('Failed to write data');
          }
      }
      if (conn) conn.release();
    }
    await executeQueries();
}

module.exports = { mdb };




// try {
//     await client.execute(query, params, { prepare: true });
//     res.status(200).send('Data written successfully');
//   } catch (err) {
//     console.error('Write error:', err);
//     res.status(500).send('Failed to write data');
// }
