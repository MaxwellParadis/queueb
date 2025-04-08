<script lang="ts">
    import { onMount } from "svelte";
    import axios from "axios";

    let username: string = "PLACEHOLDER";

    let dev = true;

    let checkGo = false;

    let showRules = false;

    let start: boolean = false;

    let promptInput: string;

    let locked: boolean = false;

    let score: number = 0;
    let gameEnding: boolean = false;
    let gameOver: boolean = false;

    let fdef: any[] = [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3];
    let cdef: any[] = [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3];
    let mdef: any[] = [3, 1, 1, 1, 1, 3, 3, 3, 3, 1, 1, 1, 1, 3];
    let cubeDefault: any[] = [
        [...fdef],
        [...cdef],
        [...cdef],
        [...cdef],
        [...cdef],
        [...mdef],
        [...mdef],
        [...mdef],
        [...mdef],
        [...cdef],
        [...cdef],
        [...cdef],
        [...cdef],
        [...fdef],
    ];

    let cube: any[] = [...cubeDefault];
    let futureCube: any[] = [...cube];

    //let block:any[] = [[0,0,1,0, 0,0,3,0, 1,1,1,1, 0,1,1,1],[0,1,0,0, 1,1,0,0, 1,1,3,1, 1,1,0,0],[1,1,1,0, 1,1,1,1, 0,3,0,0, 0,1,0,0],[0,0,1,1, 1,3,1,1, 0,0,1,1, 0,0,1,0]]
    let blocks: any[] = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    let defBlock: any[] = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    let root: any[] = [7, 7];
    let current: number = 0;

    let block: any[] = [defBlock, defBlock, defBlock, defBlock];

    let rotation: number = 0;

    let colors: any[] = [
        "255,255,0",
        "255,0,255",
        "0,255,255",
        "255,0,0",
        "0,0,255",
        "255,0,255",
        "0,255,0",
        "255,191,0",
        "128,255,0",
        "0,128,255",
        "0,255,128",
        "0,255,64",
        "191,0,255",
        "0,255,192",
        "255,128,128",
        "128,0,255",
        "255,128,0",
        "128,255,255",
    ];

    let sbs: any[] = [];
    let scoreboard = {now: sbs, prev: sbs, hof: sbs };

    export let daily: any[] = Array.from({ length: 25 }, (_, index) => index);

    function makeRot(b: any) {
        let rotated = [];
        for (let col = 0; col < 4; col++) {
            for (let row = 3; row >= 0; row--) {
                //console.log(b);
                rotated.push(b[row * 4 + col]);
            }
        }
        return rotated;
    }

    function genBlock(b: any) {
        let rotations = [b]; // Start with the original block (0-degree rotation)
        let rotated90 = makeRot(b);
        rotations.push(rotated90); // 90-degree rotation
        let rotated180 = makeRot(rotated90);
        rotations.push(rotated180); // 180-degree rotation
        let rotated270 = makeRot(rotated180);
        rotations.push(rotated270); // 270-degree rotation
        //console.log(rotations);
        return rotations;
    }

    async function gameSetup() {
        await axios.get('/api/blocks').then((res) => {
            blocks = res.data;
            //console.log(blocks);
        })
        .catch((error) => {
            if(error.code != 'ERR_INVALID_URL') console.error('Error fetching data:', error);
        });

        let cacheData = localStorage.getItem("gameState");
        let cacheGame = cacheData
            ? JSON.parse(cacheData)
            : {
                  daily: Array.from({ length: 25 }, (_, index) => index),
              };
        if (cacheGame.daily.join("") == daily.join("")) {
            //playing = cacheGame.playing; gameOver instead of playing
            cube = cacheGame.cube || cube;
            current = cacheGame.current || 0;
            gameOver = cacheGame.gameOver || false;
            if (gameOver) score = cacheGame.score || 0;
        }
        //console.log(current, blocks[current]);
        block = genBlock(blocks[current]);
    }

    let makeCube = (x: number) => {
        let c = colors[x % 100];
        let a = 1 - x / 1400;
        let val = "background-color: rgba(255, 255, 255, .9)";
        if (x == 3) val = "background-color: rgba(255, 255, 255, .5)";
        if (x > 99) val = `background-color: rgba(${c}, ${a})`;
        return val;
    };

    let onEnter = (pI: string) => {
        username = pI;
        localStorage.setItem("username", username);
        start = true;
    };

    let nudgeY = (n: number) => {
        root[0] = root[0] + n;
        if (root[0] > 10) root[0] = 10;
        if (root[0] < 0) root[0] = 0;
    };

    let nudgeX = (n: number) => {
        root[1] = root[1] + n;
        if (root[1] > 10) root[1] = 10;
        if (root[1] < 0) root[1] = 0;
    };

    let rotate = (n: number) => {
        rotation = rotation + n;
        if (rotation < 0) rotation = 3;
        if (rotation > 3) rotation = 0;
    };

    let place = (n: number) => {
        let checkPlace = true;
        let placeCube: any[] = [];
        if (locked) {
            locked = false;
        } else {
            placeCube = cube.map((row) => [...row]);
            block[rotation].forEach((v: number, i: number) => {
                let x = 0;
                let y = 0;
                if ([4, 5, 6, 7].includes(i)) x = 1;
                if ([1, 5, 9, 13].includes(i)) y = 1;
                if ([8, 9, 10, 11].includes(i)) x = 2;
                if ([2, 6, 10, 14].includes(i)) y = 2;
                if ([12, 13, 14, 15].includes(i)) x = 3;
                if ([3, 7, 11, 15].includes(i)) y = 3;
                let r = root[0] + x;
                let c = root[1] + y;
                if (v != 0) {
                    if (cube[r][c] > 9) checkPlace = false;
                    //console.log(cube[r][c]);
                    placeCube[r][c] = placeCube[r][c] * v * 100 + current;
                    //console.log(futureCube[r][c] * v * 100);
                    //console.log(r,c);
                }
            });
            if (checkPlace) {
                futureCube = placeCube;
                locked = true;
            } else {
                locked = false;
            }
        }
    };

    let commit = (n: number) => {
        locked = false;
        cube = [];
        cube = [...futureCube];
        root = [7, 7];
        current++;
        block = genBlock(blocks[current]);
        let gameState = {
            cube: cube,
            current: current,
            gameOver: gameOver,
            daily: daily,
            score: score,
        };
        localStorage.setItem("gameState", JSON.stringify(gameState));
    };

    let endGame = () => {
        locked = true;
        gameOver = true;
        let total = cube.flat().reduce((acc, num) => acc + num, 0);
        score = total;
        let gameState = {
            cube: cube,
            current: current,
            gameOver: gameOver,
            daily: daily,
            score: score,
        };
        localStorage.setItem("gameState", JSON.stringify(gameState));
        let data = {
            "username": username,
            "count": current,
            "score": score,
            "cube": JSON.stringify(cube),
        }
        axios.post('/api/score', data).then((res) => {
            console.log(res.data);
        })
        .catch((error) => {
            console.error('Error fetching data:', error);
        });
    };

    let reset = () => {
        cube = cubeDefault;
        current = 0;
        gameOver = false;
        score = 0;


        let gameState = {
            cube: cube,
            current: current,
            gameOver: gameOver,
            daily: daily,
            score: score,
        };
        localStorage.setItem("gameState", JSON.stringify(gameState));
        gameSetup();
    };

    axios.get('/api/scoreboard').then((res) => {
        scoreboard = res.data;
    })
    .catch((error) => {
        if(error.code != 'ERR_INVALID_URL') console.error('Error fetching scoreboard:', error);
    });

    onMount(() => {
        username = localStorage.getItem("username") || "";
        if (username.length > 2) promptInput = username;

        gameSetup();
    });
</script>

<div class="queueb">
    {#if !start}
        <div class="fullscreen-prompt">
            <div class="prompt-content">
                <div class="footer">
                    <img
                        style="height: 1.5em; margin: 1.7em 2px 2px 2px"
                        src="/PBS_LOGO_NT.svg"
                        alt="LOGO"
                    />
                    <h1 class="prompt-text">QueueB Beta</h1>
                </div>

                <p class="prompt-text">
                    Welcome! QueueB is a daily spacial puzzle game. Each day you
                    will recieve a unique queue of blocks and you must decide
                    where to place them to maximize your score. Future Updates
                    will add a scoreboard, additional unique blocks, and more!
                </p>

                <button
                    class="prompt-input"
                    on:click={() => (showRules = !showRules)}
                >
                    {#if showRules}
                        <p class="prompt-text">
                            Rules: Nudge and rotate each block you are given
                            into position. Each square on a block you place is
                            worth 100pts. Your blocks cannot overlap and
                            placement will be prevented. The dark grey squares
                            multiply squares placed on them by 3x. Blocks may
                            have a unique square which also has a 3x multiplier.
                            These multipliers can stack to score higher! Click
                        </p>
                    {:else}
                        <div class="prompt-text">Touch Here to See Rules</div>
                    {/if}
                </button>

                <h1 class="prompt-text">Your Username</h1>

                <input
                    type="text"
                    maxlength="12"
                    placeholder="INPUT NAME HERE"
                    bind:value={promptInput}
                    class="prompt-input"
                />
                <button
                    disabled={promptInput == undefined ||
                        promptInput.length < 3}
                    class="prompt-input prompt-button"
                    on:click={() => onEnter(promptInput)}
                >
                    ENTER
                </button>

                <a href="https://studio.paradisbend.com">
                    <p class="prompt-text">Created By Paradis Bend Studio</p>
                </a>
            </div>
        </div>
    {/if}

    <h1>Welcome {username}</h1>

    <div class="cubeGrid" style="--col-count: {cube[0].length}">
        {#each cube as c, index}
            {#each c as x, i}
                <div class="cube" style={makeCube(x)}>
                    {#if root[0] == index && root[1] == i && !gameEnding && !gameOver && start}
                        <div class="activeBlock">
                            {#each block[rotation] as b}
                                <div
                                    class="{b > 0 ? 'blocks' : 'noblocks'} {b ==
                                    3
                                        ? 'b2'
                                        : null}"
                                    style={b > 0
                                        ? `background-color: rgba(${colors[current]}, 0.7)`
                                        : ""}
                                >
                                    {#if b == 2}{/if}
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/each}
        {/each}
    </div>

    {#if gameOver}
        <h1>Score: {score}</h1>
        <h1>Thanks For Playing!</h1>
    {/if}

    <div class="controls">
        <div class="controlRow">
            <button
                class="control"
                on:click={() => rotate(-1)}
                disabled={locked}>Rotate L</button
            >
            <button
                class="control"
                on:click={() => nudgeY(-1)}
                disabled={locked}>Up</button
            >
            <button class="control" on:click={() => rotate(1)} disabled={locked}
                >Rotate R</button
            >
        </div>
        <div class="controlRow">
            <button
                class="control"
                on:click={() => nudgeX(-1)}
                disabled={locked}>Left</button
            >
            <button class="control" on:click={() => nudgeY(1)} disabled={locked}
                >Down</button
            >
            <button class="control" on:click={() => nudgeX(1)} disabled={locked}
                >Right</button
            >
        </div>
        <div class="controlRow">
            <button
                class="control"
                disabled={gameOver}
                on:click={() => place(0)}
                >{!locked ? "Place" : "Pick Up"}</button
            >
            <button
                class="control"
                disabled={!locked || gameOver}
                on:click={() => commit(0)}>Confirm</button
            >
        </div>
        <div class="controlRow">
            <button
                class="control"
                disabled={gameOver}
                on:click={() => (gameEnding = !gameEnding)}
                >Queueb out: {current}</button
            >
            <button
                class="control"
                disabled={!gameEnding || gameOver}
                on:click={endGame}>Score Your Game</button
            >
        </div>
        <div class="controlRow">
            <button class="control" on:click={reset}>Dev Reset</button>
        </div>
    </div>

    <div class='scores'>
        <div class="fifty">
            <h2>Todays Top 10</h2>
            <div>
                <div class='scoreTile underline'>
                    <div class="username">Player</div>
                    <div class="score">Count</div>
                    <div class="score">Score</div>
                </div>
                {#each scoreboard.now as sc}
                    <div class='scoreTile'>
                        <div class="username">{sc.username}</div>
                        <div class="score">{sc.count}</div>
                        <div class="score">{sc.score}</div>
                    </div>
                {/each}
            </div>
        </div>

        <div class="fifty">
            <h2>Last Top 10</h2>
            <div>
                <div class='scoreTile underline'>
                    <div class="username">Player</div>
                    <div class="score">Count</div>
                    <div class="score">Score</div>
                </div>
                {#each scoreboard.prev as sc}
                    <div class='scoreTile'>
                        <div class="username">{sc.username}</div>
                        <div class="score">{sc.count}</div>
                        <div class="score">{sc.score}</div>
                    </div>
                {/each}
            </div>
        </div>
    </div>

    <div class="scores hof">
        <h2>Hall Of Fame</h2>
        <div class='scoreTile underline hof2'>
            <div class="username">Player</div>
            <div class="score">Date</div>
            <div class="score">Count</div>
            <div class="score">Score</div>
        </div>
        {#each scoreboard.hof as sc}
            <div class='scoreTile hof2'>
                <div class="username">{sc.username}</div>
                <div class="score">{sc.day}</div>
                <div class="score">{sc.count}</div>
                <div class="score">{sc.score}</div>
            </div>
        {/each}
        <p>**WIP - Hall of Fame Updates Daily**</p>
    </div>

    <div class="footer">
        <img
            style="height: 1rem; margin: 1rem 2px 2px 2px"
            src="/PBS_LOGO_NT.svg"
            alt="LOGO"
        />
        <a href="https://studio.paradisbend.com">
            <p>Paradis Bend Studio | QueueB</p>
        </a>
    </div>
</div>

<style>
    h1,
    p, .scores{
        font-family: "Roboto", sans-serif;
        text-align: center;
        color: white;
    }

    .queueb {
        margin: auto;
        width: 30rem;
        max-width: 100vw;
        text-align: center;
    }

    .cubeGrid {
        display: grid;
        grid-template-columns: repeat(var(--col-count), minmax(1rem, 1fr));
        width: 100%;
        gap: 0;
    }

    .cube {
        border: 1px solid rgb(88, 88, 88);
        background-color: rgba(255, 255, 255, 0.7);
        max-width: 2.2rem;
        height: 2rem;
        position: relative;
        overflow: visible;
    }

    .activeBlock {
        display: grid;
        grid-template-columns: repeat(4, minmax(1rem, 1fr));
        width: 100%;
        gap: 0;
        position: relative;
        overflow: auto;
        z-index: 9998;
        width: 420%;
        height: 420%;
    }

    .blocks {
        z-index: 9999;
        width: 100%;
        height: 100%;
    }

    .noblocks {
        z-index: 9999;
        width: 100%;
        height: 100%;
    }

    .b2 {
        outline: 8px solid rgba(1, 1, 1, 0.208);
        outline-offset: -12px;
    }

    .controls {
        display: flex;
        flex-direction: column;
        width: 100%;
        margin: 1.5rem 0;
    }

    .controlRow {
        display: flex;
        flex-direction: row;
        justify-content: center;
        text-align: center;
    }

    .control {
        flex-grow: 1;
        width: 8rem;
        height: 3rem;
    }

    .footer {
        display: flex;
        justify-content: center;
    }

    .fullscreen-prompt {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.7); /* Semi-transparent background */
        display: flex;
        justify-content: center;
        z-index: 1000; /* Ensure it's on top of other elements */
    }

    .prompt-content {
        display: flex;
        flex-direction: column;
        background: white;
        width: 80vw;
        padding: 2rem;
        margin: 1rem;
        margin-bottom: auto;
        border-radius: 10px;
        text-align: center;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-height: 70vh;
        overflow-y: auto;
    }

    .prompt-text {
        color: rgb(40, 60, 80);
    }

    .prompt-input {
        color: rgb(40, 60, 80);
        border: 1px solid rgb(55, 83, 124);
        margin-bottom: 1rem;
        padding: 0.5rem 1rem;
        border-radius: 5px;
        cursor: pointer;
        min-width: 50vw;
    }

    .prompt-button {
        background-color: rgb(40, 60, 80);
        color: white;
    }

    .prompt-button:disabled {
        background-color: grey;
    }

    button:hover {
        background-color: rgba(0, 0, 0, 0.1);
        color: white;
    }

    .scores {
        display: flex;
        flex-direction: row;
        flex-basis: auto;
        width: 100%;
        padding-bottom: 5em;
        margin-bottom: 5em;
        justify-content: space-around;
    }

    .fifty {
        display: flex;
        flex-direction: column;
        text-align: center;
    }

    .scoreTile {
        display: flex;
        flex-direction: row;
        width: 80vw;
        max-width: 12em;
    }
    .score {
        text-align: right;
        width: 30%;
    }
    .username {
        flex-grow: 3;
        text-align: left;
    }
    .underline {
        border-bottom: 2px solid #ccc;
    }

    .hof{
        flex-direction: column;
    }

    .hof2{
        width: 90%;
        max-width: 90%;
        align-self: center;

    }
</style>
