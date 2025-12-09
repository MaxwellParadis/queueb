<script lang="ts">
    import { onMount } from "svelte";
    import axios from "axios";

    let authAPI = "https://authserver.paradisbend.com"

    let username:string = '';

    let userAuth = {hasAuth: false};

    let anonymous = true;
    let signup = false;

    let dev = true;

    let checkGo = false;

    let showRules = false;

    let start: boolean = false;

    let promptInput: string;
    let password:string = "";
    let message:string;
    let vpass:string = "";
    let email:string = "";

    let locked: boolean = false;

    let shareBoard: boolean = false;
    let sbi: number = 0;
    let shareTarget: string = 'now';
    //let shareBlock: any[] = [];

    let score: number = 0;
    let streak:number = 0;
    let gameEnding: boolean = false;
    let gameOver: boolean = false;
    let day: number = 100000;

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
            blocks = res.data.blocks;
            day = res.data.day;
            //console.log(day);
        })
        .catch((error) => {
            if(error.code != 'ERR_INVALID_URL') console.error('Error fetching data:', error);
        });

        let cacheData = localStorage.getItem("gameState");
        let cacheGame = cacheData
            ? JSON.parse(cacheData)
            : {
                  daily: Array.from({ length: 25 }, (_, index) => index),
                  day: 100000,
              };
        if (cacheGame.day == day) {
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
        //console.log(x);
        let c = colors[x % 100];
        let a = 1 - x / 1400;
        let val = "background-color: rgba(255, 255, 255, .9)";
        if (x == 3) val = "background-color: rgba(255, 255, 255, .5)";
        if (x > 99) val = `background-color: rgba(${c}, ${a})`;
        return val;
    };

    let onShare = (i: number, x: string) => {
        if(sbi == i && shareTarget == x && shareBoard) {
          shareBoard = false;
        }else{
          sbi = i;
          shareTarget = x;
          shareBoard = true;
          //console.log(sbi, shareTarget);
          //console.log(scoreboard[shareTarget][sbi].cube);
        }
    }

     async function onSignup(uname) {
        username = uname
        try {
        const res = await axios.post(`${authAPI}/signup`, {
            username,
            email,
            password
        });
        signup = false;
        message = res.data.message;
        } catch (err) {
        message = err.response?.data?.error || "Signup failed";
        }
    }

    async function onLogin(uname) {
        username = uname
        try {
            const res = await axios.post(`${authAPI}/login`, {
                username,
                password
            });

            // Save tokens
            localStorage.setItem("accessToken", res.data.accessToken);
            localStorage.setItem("refreshToken", res.data.refreshToken);

            userAuth.accessToken = res.data.accessToken;
            userAuth.hasAuth = true;

            message = "Logged in!";

            const streakRes = await axios.post('/api/streak', { username }, {
                validateStatus: () => true
            });

            if (streakRes.status === 200) streak = Number(streakRes.data.streak);

            onEnter(username)
        } catch (err) {
            message =  err.response?.data?.error || "Login failed";
        }
    }

    // async function authRefresh(){
    //     try {
    //         const res = await axios.post(`${authAPI}/refresh`, {
    //             headers: {
    //                 "x-refresh-token": localStorage.getItem("refreshToken")
    //             }
    //         });
    //
    //         // Save tokens
    //         localStorage.setItem("accessToken", res.data.accessToken);
    //
    //         userAuth.accessToken = res.data.accessToken;
    //         userAuth.hasAuth = true;
    //
    //         message = "Logged in!";
    //         onEnter(username)
    //     } catch (err) {
    //         message = err.response?.data?.error || "Login failed";
    //     }
    // }

    // async function authCheck(setup: boolean){
    //     try {
    //         let res = await axios.get(`${authAPI}/protected`, {
    //             headers: {
    //                 Authorization: "Bearer " + userAuth.accessToken
    //             }
    //         });
    //         userAuth.username = res.data.user.username;
    //         username = userAuth.username
    //         userAuth.hasAuth = true;
    //     } catch (err) {
    //         const status = err.response?.status;
    //         if (status === 403) {
    //             const refreshed = await tryRefresh();
    //             if (!refreshed.ok) {
    //                 message = refreshed.error;
    //                 return; // cannot recover → stop
    //             }
    //
    //             // Retry original request now that token is refreshed
    //             const retry = await axios.get(`${authAPI}/protected`, {
    //                 headers: {
    //                     Authorization: "Bearer " + userAuth.accessToken
    //                 }
    //             });
    //
    //             const user = retry.data.user;
    //             userAuth.username = user.username;
    //             userAuth.hasAuth = true;
    //             username = user.username;
    //
    //         } else {
    //             // Unknown error
    //             message = err.response?.data?.error || "Authentication failed";
    //             return;
    //         }
    //     }
    //
    //
    //
    //     try {
    //         const res = await axios.post('/api/streak', { username });
    //         streak = res.data.streak;
    //         //console.log("streak:", streak);
    //     } catch (err) {
    //         console.error("Error fetching streak:", err);
    //     }
    //
    //     if(setup) gameSetup();
    // }

    async function authCheck(setup = false) {
        // 1. Protected request (never throws for HTTP errors)
        const res = await axios.get(`${authAPI}/protected`, {
            headers: { Authorization: "Bearer " + userAuth.accessToken },
            validateStatus: () => true
        });

        //console.log(res);
        let success = (res.status === 200);

        if (res.status === 401 || res.status === 403) {
            const refresh = await axios.post(`${authAPI}/refresh`, {token: localStorage.getItem("refreshToken")}, {
                validateStatus: () => true
            });

            if (refresh.status === 200) {
                const newAccess = refresh.data.accessToken;
                localStorage.setItem("accessToken", newAccess);
                userAuth.accessToken = newAccess;
                success = true
            }else{
                message = 'Session Expired!'
                onLogout();
                console.log(refresh);
            }
        }

        if(success){
            console.log(res.data)
            userAuth.username = res.data.user?.username || '';
            userAuth.hasAuth = true;
            username = userAuth.username;

            const streakRes = await axios.post('/api/streak', { username }, {
                validateStatus: () => true
            });

            if (streakRes.status === 200) streak = Number(streakRes.data.streak);
        }

        if (setup) gameSetup();
    }


    function onLogout(){
        localStorage.setItem("accessToken", null);
        localStorage.setItem("refreshToken", null);
        userAuth = {}
        userAuth.hasAuth = false;
        username = '';
        promptInput = username;
    }

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
            day: day,
        };
        localStorage.setItem("gameState", JSON.stringify(gameState));
    };

    let endGame = () => {
        locked = true;
        gameOver = true;
        let total = cube.flat().reduce((acc, num) => acc + num, 0);
        score = total;
        streak = streak + 1;
        score = score + (10 * streak);
        let gameState = {
            cube: cube,
            current: current,
            gameOver: gameOver,
            daily: daily,
            score: score,
            day: day,
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
        day = 0;


        let gameState = {
            cube: cube,
            current: current,
            gameOver: gameOver,
            daily: daily,
            score: score,
            day: day,
        };
        localStorage.setItem("gameState", JSON.stringify(gameState));
        gameSetup();
    };

    axios.get('/api/scoreboard').then((res) => {
        scoreboard = res.data;
        console.log(scoreboard);
    })
    .catch((error) => {
        if(error.code != 'ERR_INVALID_URL') console.error('Error fetching scoreboard:', error);
    });

    onMount(() => {
        username = localStorage.getItem("username") || "";
        userAuth.accessToken = localStorage.getItem('accessToken') || null;

        if(userAuth.accessToken !== null && userAuth.accessToken.length > 4) {
            authCheck(true);
        } else {
            if(username.length > 2) promptInput = username;
            gameSetup();
        }

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
                    <h1 class="prompt-text">QUEUEB</h1>
                </div>

                <p class="prompt-text">
                    Welcome! QueueB is a daily spacial puzzle game. Each day everyone
                    recieves the daily queue of blocks and you must decide
                    where to place them to maximize your score!  Future updates will
                    include an all time top scores chart and a 1 vs 1 challenge mode where
                    you can take turns with a friend competing for the most points on a shared
                    board!  Logged in Play can now can build Daily Streaks scoring 10 points for each day of your current streak!
                </p>

                <button
                    class="prompt-input"
                    on:click={() => (showRules = !showRules)}
                >
                    {#if showRules}
                        <p class="prompt-text">
                            Nudge and rotate each block you are given
                            into position.  Once satisfied with a blocks location
                            click Place and then Confirm!  Each square on the blocks
                            you confirm will be added to the board scoring at least
                            100pts. Your blocks cannot be placed on colored squares that you already
                            occupy and placement will be prevented. The dark grey squares
                            on the board multiply your colored block squares by 3x when stacked.
                            Blocks may also have a unique multiplier square which also rewards 3x.
                            When the unique block square is placed on a grey board square, these
                            two multipliers can stack for 9x points!  You must balance
                            maximizing the number of blocks you place on the board with the
                            position of those multiplier squares on both the board and your blocks
                            to get the most points!  Once you can no longer place any blocks click
                            Review Board and then Score Your Game!
                        </p>
                    {:else}
                        <div class="prompt-text">How To Play? Touch Here!</div>
                    {/if}
                </button>

                {#if !userAuth.hasAuth}
                    <button class='prompt-input' on:click={()=> anonymous = !anonymous}>
                        <h1 class="prompt-text">{anonymous ? 'Click for Login' : 'Play with #Username'}</h1>
                    </button>
                {/if}

                {#if anonymous && !userAuth.hasAuth}
                    <input
                        type="text"
                        maxlength="12"
                        placeholder="INPUT NAME HERE"
                        bind:value={promptInput}
                        class="prompt-input"
                    />
                    <button disabled={promptInput == undefined || promptInput.length < 3} class="prompt-input prompt-button" on:click={() => onEnter('#' + promptInput.replace(/[^A-Za-z0-9]/g, ""))}>
                        ENTER
                    </button>
                {:else if userAuth.hasAuth}
                    <button class="prompt-input prompt-button" on:click={() => onLogout()}>
                        Logout
                    </button>
                    <button class="prompt-input prompt-button" on:click={() => onEnter(userAuth.username)}>
                        Play as {userAuth.username}
                    </button>
                    <h4 style="color: rgb(40,60,80)">{streak > 0 ? `${streak} Day Streak!`: null}</h4>
                {:else}
                    <button class='prompt-input' on:click={() => signup = !signup}>
                        <b style="color: rgb(40,60,80)">{ signup ? 'Click for Login' : 'Click to Sign Up'}</b>
                    </button>
                    <input
                        type="text"
                        maxlength="12"
                        placeholder="INPUT USERNAME"
                        bind:value={promptInput}
                        class="prompt-input"
                    />
                    <input
                        type="password"
                        maxlength="24"
                        placeholder="PASSWORD"
                        bind:value={password}
                        class="prompt-input"
                    />
                    {#if signup}
                        <input
                            type="password"
                            maxlength="24"
                            placeholder="CONFIRM PASSWORD"
                            bind:value={vpass}
                            class={password == vpass ? "prompt-input" : "rborder prompt-input"}
                        />
                        <input
                            type="text"
                            maxlength="254"
                            placeholder="INPUT EMAIL"
                            bind:value={email}
                            class="prompt-input"
                        />
                    {/if}
                    <button disabled={promptInput.length < 3 || (vpass !== password && signup) || password == 0 || (email < 4 && signup)} class="prompt-input prompt-button" on:click={() => (signup ? onSignup : onLogin)(promptInput.replace(/[^A-Za-z0-9]/g, ""))}>
                        { signup ? 'SUBMIT' : 'LOGIN'}
                    </button>
                {/if}
                <h4 style="color: rgb(40,60,80)">
                {message} <br>
                {message == 'User created' ? `Click the Verification link sent to ${email} then login!` : null}
                </h4>

                <a href="https://studio.paradisbend.com" class="footer">
                    <img style="height: 3em" src="/XMAS.svg" alt="LOGO"/>
                    <p class="prompt-text">Created By Paradis Bend Studio</p>
                    <img style="height: 3em" src="/XMAS.svg" alt="LOGO"/>
                </a>
            </div>
        </div>
    {/if}

    {#if username != undefined || start == false}
        <div class="header" style="text-align: center">
            <div class="footer">
                <img style="height: 2.9em; margin: 1em 2px 0px 0px;" src="/PBS_LOGO_NT.svg" alt="LOGO"/>
                <h1 style="transform: scaleY(2); display: inline-block;">QUEUEB</h1>
            </div>
            <h3 style="margin: .5em">Good Luck {username}!</h3>
        </div>
    {/if}

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
                >{gameEnding ? 'Keep Playing':'Review Board'}: {current}</button
            >
            <button
                class="control"
                disabled={!gameEnding || gameOver}
                on:click={endGame}>Score Your Game</button
            >
        </div>
    </div>

    {#if userAuth && userAuth.hasAuth == true}
        <h2>{username}'s Current Streak: {streak}</h2>
    {/if}

    <div class='scores'>
        <div class="fifty">
            <h2>Todays Top 10</h2>
            <div>
                <div class='scoreTile underline'>
                    <div class="username">Player</div>
                    <div class="score">Count</div>
                    <div class="score">Score</div>
                </div>
                {#each scoreboard.now as sc, i}
                    <div class='scoreTile'
                        tabindex="0"
                        role="button"
                        style="cursor: pointer;"
                        on:click={()=>onShare(i,'now')}
                        on:keydown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            onShare(i,'now');
                        }
                    }}>
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
                {#each scoreboard.prev as sc, i}
                    <div class='scoreTile'
                        tabindex="0"
                        role="button"
                        style="cursor: pointer;"
                        on:click={()=>onShare(i,'prev')}
                        on:keydown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            onShare(i,'prev');
                        }
                    }}>
                        <div class="username">{sc.username}</div>
                        <div class="score">{sc.count}</div>
                        <div class="score">{sc.score}</div>
                    </div>
                {/each}
            </div>
        </div>
    </div>

    {#if gameOver}
        <div tabindex="0"
          role="button"
          style="cursor: pointer;"
          on:click={() => { if (shareBoard) onShare(sbi, shareTarget); }}
          on:keydown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && shareBoard) {
              onShare(sbi, shareTarget);
            }
          }}>
            <h3>{shareBoard ? 'Click Here to Hide Board Below!' : 'Click Someones Score To View Their Board!'}</h3>
        </div>
    {/if}

    {#if gameOver && shareBoard && scoreboard[shareTarget].length > 0}
        <h2>{`${scoreboard[shareTarget][sbi].username}'s #${sbi+1} Board ${shareTarget == 'now' ? 'Today' : 'Yesterday'}: ${scoreboard[shareTarget][sbi].count} Blocks`}</h2>
        <div class="cubeGrid" style="--col-count: {cube[0].length}">
            {#each scoreboard[shareTarget][sbi].cube as c, index}
                {#each c as x, i}
                    <div class="cube" style={makeCube(x)}></div>
                {/each}
            {/each}
        </div>
    {/if}

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
    h1,h2,h3,h4,b,p, .scores{
        font-family: "Roboto", sans-serif;
        text-align: center;
        color: white;
    }

    .header{
        background-color: rgba(0,0,0,.5);
        border:1px solid rgba(0,0,0,.5);
        margin-bottom: 4px;
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
        height: 4rem;
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
        padding-bottom: 2em;
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
    .rborder {
        border:1px solid red;
        color: red
    }
</style>
