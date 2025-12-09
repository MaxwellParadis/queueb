const express = require("express");
const mariadb = require("mariadb");
const { v4: uuidv4 } = require("uuid");

const { mdb } = require("./db");

const app = express();
const port = process.env.PORT || 3000;

let pScore = [];
let hof = [];

let blockList = [
    [0, 1, 1, 0, 1, 1, 1, 3, 1, 1, 1, 1, 0, 1, 1, 0],
    [1, 1, 0, 0, 1, 1, 3, 1, 1, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 1, 0, 1, 1, 3, 1, 0, 0, 1, 0, 0, 0, 1, 1],
    [1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 3, 1],
    [0, 0, 1, 0, 0, 1, 1, 0, 0, 3, 1, 0, 1, 1, 1, 1],
    [1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 3, 1, 1, 1, 1],
    [1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 3, 1, 0, 1, 0, 0],
    [1, 1, 0, 0, 1, 0, 0, 1, 3, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 3, 0],
    [0, 0, 1, 0, 0, 0, 3, 0, 1, 1, 1, 1, 0, 1, 1, 1],
    [3, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1],
    [0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 3, 0],
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 3, 1, 1],
    [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 3, 1, 1, 1, 0, 0],
    [1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 3, 1, 1, 0],
    [1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 3, 1, 0, 0, 1, 0],
    [0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 3, 1, 1, 0, 1, 0],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 3, 0, 1, 0, 1, 0],
    [3, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1],
    [1, 1, 3, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
    [0, 1, 1, 0, 0, 3, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0],
    [1, 0, 0, 1, 3, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0],
    [1, 1, 1, 3, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1],
    [1, 3, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1],
    [1, 1, 1, 3, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0],
    [0, 0, 0, 1, 1, 1, 3, 1, 1, 0, 0, 0, 1, 1, 1, 0],
    [1, 1, 0, 0, 1, 3, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1],
    [1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 3],
    [1, 3, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1],
    [1, 1, 0, 3, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0],
    [0, 0, 0, 1, 1, 1, 3, 1, 0, 0, 0, 1, 1, 1, 1, 1],
    [0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 0, 0],
    [1, 0, 0, 1, 1, 3, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]
];

let dailyBlocks = [];

app.use(express.static("dist"));
app.use(express.json());

require('dotenv').config();
const dbn = process.env.QDB || 'qb';

const pool = mariadb.createPool({
  host: process.env.DBH,
  user: process.env.DBU || 'root',
  password: process.env.DBP,
  connectionLimit: 5,
  bigIntAsNumber: true
});

function getDay(add) {
    const date = new Date();
    date.setDate(date.getDate() + add);
    const year = date.getFullYear() % 100; // Get the last two digits of the year
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed, pad to 2 digits
    const day = String(date.getDate()).padStart(2, "0"); // Pad day to 2 digits

    return parseInt(`${year}${month}${day}`, 10); // Concatenate and convert to a number
}

async function getBlocks(date) {
  const query = `SELECT * FROM ${dbn}.blocks WHERE day = ?`;
  const params = [date];
  //const options = { hints: ["int"] };
  let conn;
  let rows = [];
  try {
    conn = await pool.getConnection();
    rows = await conn.query(query, params);
  } catch (err){
    console.log(err);
  } finally {
    if (conn) conn.release();
  }
  return rows;
}

async function makeBlocks(date) {
    const randomInts = [];
    for (let i = 0; i < 25; i++) {
        const randInt = Math.floor(Math.random() * (blockList.length - 1)); // Generates a random integer between 0 and 50
        randomInts.push(randInt);
    }
    //return randomInts;

    let b = JSON.stringify(randomInts);
    const query = `INSERT INTO ${dbn}.blocks(day, blocks) VALUES(?,?);`;
    const params = [date, b];
    //const options = { hints: ["int", "list<int>"] };
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(query, params);
  } catch (err) {
    console.error("Database error:", err);
  } finally {
    if (conn) conn.release();
  }
}

async function initBlocks() {
    let blocks = await getBlocks(getDay(0));
    if (!blocks[0]) {
        await makeBlocks(getDay(0));
        blocks = await getBlocks(getDay(0));
    }

    let blocks1 = await getBlocks(getDay(1));
    if (!blocks1[0]) await makeBlocks(getDay(1));

    let blockIds = blocks[0].blocks;
    dailyBlocks = blockIds.map((n) => blockList[n]);
    //console.log(dailyBlocks);
}

async function prevScore(){
  let day = getDay(-1);
  let query = `SELECT * FROM ${dbn}.scores WHERE day = ? ORDER BY score DESC LIMIT 10;`;
  let params = [day];
  //let options = {hints: ['int']};
  let conn;
  try {
    conn = await pool.getConnection();
    let rows = await conn.query(query, params);
    pScore = rows;
  } catch (err) {
    console.error('Prev Score Error:', err);
  } finally {
    if (conn) conn.release();
  }
  // let hoQuery = "SELECT * FROM qb.scores ORDER BY score DESC LIMIT 10;";
  // try {
  //   let {rows} = await client.execute(hoQuery);
  //   hof = rows;
  // } catch (err) {
  //   console.error('HoF Score Error:', err);
  // }
}

async function initServer() {
    await mdb(pool, dbn);

    initBlocks();
    prevScore();
}

initServer();

setInterval(
    () => {
        initBlocks();
        prevScore();
    },
    60 * 60 * 1000,
);

app.get("/", (req, res) => {
    res.sendFile(path.resolve(__dirname, "dist", "index.html"));
});

app.get("/api/blocks", (req, res) => {
    //console.log(dailyBlocks[0]);
    let data = {blocks: dailyBlocks, day: getDay(0)}
    res.send(data);
});

app.get("/api/scoreboard", async (req, res) => {
    let day = getDay(0);
    let query = `SELECT * FROM ${dbn}.scores WHERE day = ? ORDER BY score DESC LIMIT 10;`;
    let params = [day];
    //let options = {hints: ['int']};
    let conn;
    try {
      conn = await pool.getConnection();
      let rows = await conn.query(query, params);
      //console.log(rows);
      let data = {
        'now': rows,
        'prev': pScore,
        'hof': hof,
      }
      res.json(data);
    } catch (err) {
      console.error('Write error:', err);
      console.log('Failed to write data');
      res.status(500).send("Failed to retrieve data: " + err.message);
    } finally{
      if (conn) conn.release();
    }
});

app.post("/api/score", async (req, res) => {
    const { username, count, score, cube } = req.body;
    const id = uuidv4();
    console.log(username, count, score);
    let day = getDay(0);
    let query = `INSERT INTO ${dbn}.scores(id, username, email, day, count, score, cube) VALUES(?,?,?,?,?,?,?)`;
    let params = [id, username, "NA", day, count, score, cube];
    //let options = { hints: ['uuid', 'text', 'text', 'int', 'int', 'int', 'text'] };
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(query, params);
      console.log('Score written successfully');
    } catch (err) {
      console.error('Write error:', err);
      console.log('Failed to write data');
    } finally {
      if (conn) conn.release();
    }
    res.send("Score Recorded");
});

app.post("/api/streak", async (req, res) => {
    let conn;
    let query = `SELECT
    COALESCE(SUM(is_consecutive), 0) +
    (SELECT COUNT(*) FROM ${dbn}.scores WHERE username = ? AND day = ?) AS streak
    FROM (
      SELECT
      IF(STR_TO_DATE(day, '%y%m%d') = @expected, 1, 0) AS is_consecutive,
          @expected := IF(STR_TO_DATE(day, '%y%m%d') = @expected,
                          DATE_SUB(@expected, INTERVAL 1 DAY),
                          @expected)
          FROM ${dbn}.scores
          CROSS JOIN (SELECT @expected := STR_TO_DATE(?, '%y%m%d')) init
          WHERE username = ?
          AND day <= ?
          ORDER BY day DESC
    ) t
    WHERE is_consecutive = 1;`;
    try {
      let d0 = getDay(0)
      let d1 = getDay(-1)
      let u = req.body.username
      let params = [u, d0, d1, u, d1];
      conn = await pool.getConnection();
      let rows = await conn.query(query, params);
      //console.log(rows);
      let data = {
        'streak': rows[0].streak
      }
      res.json(data);
    } catch (err) {
      console.error('Write error:', err);
      console.log('Failed to write data');
      res.status(500).send("Failed to retrieve data: " + err.message);
    } finally {
      if (conn) conn.release();
    }
});

// app.get("/api/test", async (req, res) => {
//     try {
//         const query = "SELECT release_version FROM system.local";
//         const result = await client.execute(query);
//         res.send(`ScyllaDB version: ${result.rows[0].release_version}`);
//     } catch (err) {
//         res.status(500).send(`Error querying ScyllaDB: ${err.message}`);
//     }
// });

app.listen(port, () => {
    console.log(`App running at http://localhost:${port}`);
});
