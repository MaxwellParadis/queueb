const express = require("express");
const cassandra = require("cassandra-driver");
const { v4: uuidv4 } = require("uuid");

const { sydb } = require("./db");

const app = express();
const port = process.env.PORT || 3014;

let pScore = [];
let hof = [];

let blockList = [
    [0, 1, 1, 0, 1, 1, 1, 3, 1, 1, 1, 1, 0, 1, 1, 0],
    [1, 1, 0, 0, 1, 1, 3, 1, 1, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 1, 1],
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
];

let dailyBlocks = [];

app.use(express.static("dist"));
app.use(express.json());

// ScyllaDB configuration
const client = new cassandra.Client({
    contactPoints: [process.env.SCYLLA_HOST || "localhost"],
    localDataCenter: "datacenter1", // Replace with your data center name
});

async function connectToScylla() {
    try {
        await client.connect();
        console.log("Connected to ScyllaDB");
        await sydb(client);
    } catch (err) {
        console.error("Failed to connect to ScyllaDB", err);
    }
}

function getDay(add) {
    const date = new Date();
    date.setDate(date.getDate() + add);
    const year = date.getFullYear() % 100; // Get the last two digits of the year
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed, pad to 2 digits
    const day = String(date.getDate()).padStart(2, "0"); // Pad day to 2 digits

    return parseInt(`${year}${month}${day}`, 10); // Concatenate and convert to a number
}

async function getBlocks(date) {
    const query = "SELECT * FROM qb.blocks WHERE day = ?";
    const params = [date];
    const options = { hints: ["int"] };

    let { rows } = await client.execute(query, params, options);

    return rows;
}

async function makeBlocks(date) {
    const randomInts = [];
    for (let i = 0; i < 25; i++) {
        const randInt = Math.floor(Math.random() * 18); // Generates a random integer between 0 and 50
        randomInts.push(randInt);
    }
    //return randomInts;

    let b = randomInts;
    const query = "INSERT INTO qb.blocks(day, blocks) VALUES(?,?);";
    const params = [date, b];
    const options = { hints: ["int", "list<int>"] };

    await client.execute(query, params, options);
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
  let query = "SELECT * FROM qb.scores WHERE day = ? ORDER BY score DESC LIMIT 10;";
  let params = [day];
  let options = {hints: ['int']};
  try {
    let {rows} = await client.execute(query, params, options);
    pScore = rows;
  } catch (err) {
    console.error('Prev Score Error:', err);
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
    await connectToScylla();

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
    console.log(dailyBlocks[0]);
    let data = {blocks: dailyBlocks, day: getDay(0)}
    res.send(data);
});

app.get("/api/scoreboard", async (req, res) => {
    let day = getDay(0);
    let query = "SELECT * FROM qb.scores WHERE day = ? ORDER BY score DESC LIMIT 10;";
    let params = [day];
    let options = {hints: ['int']};
    try {
      let {rows} = await client.execute(query, params, options);
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
    }
});

app.post("/api/score", async (req, res) => {
    const { username, count, score, cube } = req.body;
    const id = uuidv4();
    console.log(username, count, score);
    let day = getDay(0);
    let query = "INSERT INTO qb.scores(id, username, email, day, count, score, cube) VALUES(?,?,?,?,?,?,?)";
    let params = [id, username, "NA", day, count, score, cube];
    let options = { hints: ['uuid', 'text', 'text', 'int', 'int', 'int', 'text'] };
    try {
      await client.execute(query, params, options);
      console.log('Score written successfully');
    } catch (err) {
      console.error('Write error:', err);
      console.log('Failed to write data');
    }
    res.send("Score Recorded");
});

app.get("/api/test", async (req, res) => {
    try {
        const query = "SELECT release_version FROM system.local";
        const result = await client.execute(query);
        res.send(`ScyllaDB version: ${result.rows[0].release_version}`);
    } catch (err) {
        res.status(500).send(`Error querying ScyllaDB: ${err.message}`);
    }
});

app.listen(port, () => {
    console.log(`App running at http://localhost:${port}`);
});
