const state = {
    // calculated sizes
    ratioWidth: null,
    ratioHeight: null,
    tileSize: null,
    median: null, // threshold for horizontal middle of screen
    speedDrop: null, // upper threshold for speed drop area (mobile)
    pauseArea: null, // lower threshold for pause area (mobile)

    // 
    isSpeedDrop: null, // speed drop state flag
    isPaused: null, // pause flag
    gameOn: null, // flag if game is running or not
    touchX: null, // x coordinate for touch start
    isMove: null,   // status of touch event

    rotateEnabled: null, // flag if rotation is possible or occupied by a keypress
    moveRequest: [], // directions are unshifted. active direction is always arr[0]
    moveDelay: null, // if 0 then it's ok to move. handled by game loop
    currentSteps: null, // the number of gravity steps (depending on speed drop or level)
    floatCount: null, // number of cycles left to float
    fallCountdown: null, // timer (int) before a new piece can start falling

    trend: null, // transition end event name
    anend: null, // animation end event name

    bag: null, // randomized array of pieces

    // stats
    level: null,
    score: null,
    lines: null,

    // flags to determine if stats should be updated
    levelUp: null,
    scoreUp: null,
    linesUp: null,

    time: null, // for game loop

    /*
        getNextPiece()
        draw next piece from the (top of the) bag (array)
        if bag is empty, fill it
    */
    getNextPiece: function() {
        // draw from bag
        let id = this.bag.shift();

        // if bag is empty: regenerate
        if(this.bag.length == 0) {
            this.generateBag();
        }

        return id;
    },

    /*
        generateBag()
        15-bag randomizer
        piece 5 has a slight dominance of 1 per 15
        this seems to be the case in Tetris DX for Game Boy Color
        although a disassembly of the random algorithm states otherwise:
            “After checking the disassembly, it essentially does
            ((DIVIDER_REGISTER-1)*4) % 0x1C to generate a new piece id,
            then will re-roll up to three times so long as
            (candidateRNG | lastRNG | lastPieceGenerated == lastPieceGenerated)”
        https://tetrisconcept.net/threads/questions-about-randomizers.1735/

        Sorry captain, ah duun't have the power!
    */
    generateBag: function() {
        this.bag = [1,2,3,4,5,6,7,1,2,3,4,5,6,7,5];

        // shuffle
        for (let i = this.bag.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            let temp = this.bag[i];
            this.bag[i] = this.bag[j];
            this.bag[j] = temp;
        }
    },

    /*
        incLine(num)
        increase line counter with [num]
        calculate score
        increase level if needed
    */
    incLine: function(num) {

        // inc lines
        this.lines[0] += num;
        this.lines[num] += num;
        this.linesUp = true;

        // calc score. if board is cleaned, 10x the score
        let lineScore = [40, 100, 300, 1200];
        let score = lineScore[num-1] * (this.level + 1);
        let factor = 10;
        for(let x=0; x<conf.tilesX; x++) {
            if(board.b[conf.tilesY-1][x] !== 0) {
                factor = 1;
                break;
            }
        }
        this.incScore(score*factor);

        // calc level increase        
        if(((this.lines[0]-num) % 10) + num >= 10) {
            this.incLevel();
        }
    },

    /*
        incLevel
        increase level up to 10
        update steps unless speed drop is active
    */
    incLevel: function() {
        if(this.level < 10) {
            this.level ++;

            if(!this.isSpeedDrop) {
                this.currentSteps = conf.levelSteps[this.level];
            }

            this.levelUp = true;
        }
    },

    /*
        incScore(num)
        increase score by (num)
    */
    incScore: function(num) {
        this.score += num;
        this.scoreUp = true;
    },

    /*
        createNumHTML(num)
        create an HTML representation of the number
        each int is wrapped in a span
        12 will be
            <span class="n1"></span><span class="n2"></span>
        And the visual number will be gorgeous!
    */
    createNumHTML: function(num) {
        let str = "";
        let arr = ("" + num).split("");
        for(let i in arr) {
            str += `<span class="n${arr[i]}"></span>`;
        }
        return str;
    },

    /*
        updateLines
        update the number of lines in the stats section
    */
    updateLines: function() {
        if(this.linesUp) {
            dom.lines.innerHTML = this.createNumHTML(this.lines[0]);
            this.linesUp = false;
            // calc stats
            for(let i=0; i<dom.clearStats.length; i++) {
                let val = "0%";
                if(this.lines[i+1] != 0) {
                    val = 100 * this.lines[i+1] / this.lines[0] + "%";
                }
                dom.clearStats[i].style["width"] = val;
            }
        }
    },

    /*
        updateLevel
        update the level number in the stats section
    */
    updateLevel: function() {
        if(this.levelUp) {
            dom.level.innerHTML = this.createNumHTML(this.level);
            this.levelUp = false;
        }
    },

    /*
        updateScore
        update the score in the stats section
    */
    updateScore: function() {
        if(this.scoreUp) {
            dom.score.innerHTML = this.createNumHTML(this.score);
            this.scoreUp = false;
        }
    },

    /*
        whichTransitionEndEvent()
        determine the correct transition end event for the current browser
    */
    whichTransitionEndEvent: function() {

        let t, el = document.createElement("fakeelement");

        let transitions = {
            "transition"      : "transitionend",
            "OTransition"     : "oTransitionEnd",
            "MozTransition"   : "transitionend",
            "WebkitTransition": "webkitTransitionEnd",
            "msTransition"    : "MSTransitionEnd"
        }

        // On some platforms, in particular some releases of Android 4.x,
        // the un-prefixed "animation" and "transition" properties are defined on the
        // style object but the events that fire will still be prefixed, so we need
        // to check if the un-prefixed events are useable, and if not remove them
        if (!('TransitionEvent' in window)) {
            delete transitions.transition;
        }

        for (t in transitions){
            if (el.style[t] !== undefined){
                return transitions[t];
            }
        }

    },

    /*
        whichAnimationEndEvent()
        determine the correct animation end event for the current browser
    */
    whichAnimationEndEvent: function() {
        let a, el = document.createElement("fakeelement");

        let animations = {
            'animation': 'animationend',
            'WebkitAnimation': 'webkitAnimationEnd',
            'MozAnimation': 'mozAnimationEnd',
            'OAnimation': 'oAnimationEnd',
            'msAnimation': 'MSAnimationEnd'
        }

        // On some platforms, in particular some releases of Android 4.x,
        // the un-prefixed "animation" and "transition" properties are defined on the
        // style object but the events that fire will still be prefixed, so we need
        // to check if the un-prefixed events are useable, and if not remove them
        if (!('AnimationEvent' in window)) {
            delete animations.animation;
        }

        for (a in animations){
            if (el.style[a] !== undefined){
                return animations[a];
            }
        }
    },
    /*
        addRotateRequest (dir)
        rotate piece in the desired direction if rotation is available
        only the first rotate keydown is processed
        a new rotation can only occur after a rotate keyup
    */
    addRotateRequest: function (dir) {
        if(this.gameOn) {
            if(this.rotateEnabled && !this.isPaused) {
                this.rotateEnabled = false;
                piece.rotate(dir);
            }
        }
    },

    /*
        cancelRotateRequest ()
        re-enable rotation
    */
    cancelRotateRequest: function() {
        this.rotateEnabled = true;
    },

    /*
        setMoveRequest
        override the moveRequest array
        used by mobile, that only accepts a single move request at a time
    */
    setMoveRequest: function (dir) {
        this.moveRequest = [dir];
    },

    /*
        clearMoveRequest
        clear move request array
        used by mobile
    */
    clearMoveRequest: function (dir) {
        this.moveRequest = [];
    },

    /*
        addMoveRequest (dir)
        add request to move in the specified direction
        the request is added to the start of the moveRequest array
        making it the nambar wahn priority
    */
    addMoveRequest: function (dir) {
        if(this.gameOn) {
            // if specific request is not previously added, then add
            let l = this.moveRequest.length;

            // if empty or (neither first nor last)
            if(l == 0 || (this.moveRequest[0] !== dir &&
                          this.moveRequest[l-1] !== dir)) {

                this.moveRequest.unshift(dir);
            }
        }
    },

    /*
        cancelMoveRequest (dir)
        removes the specified direction from the moveRequest array.
        The direction is either at the start or end of array,
        making use of both shift and pop
    */
    cancelMoveRequest: function (dir) {
        if (this.moveRequest.length > 0) {
            if (this.moveRequest[0] == dir) {
                this.moveRequest.shift();
            } else {
                this.moveRequest.pop();
            }
        }
    },

    /*
        activateSpeedDrop ()
        turn speed drop on, set current steps to the fastest
    */
    activateSpeedDrop: function (){
        if(this.gameOn) {
            this.currentSteps = 1; // maximum velocity
            this.isSpeedDrop = true;
        }
    },

    /*
        cancelSpeedDrop ()
        turn speed drop off, revert steps to level-dependent value
    */
    cancelSpeedDrop: function() {
        this.currentSteps = conf.levelSteps[this.level];
        this.isSpeedDrop = false;
    },

    /*
        togglePause()
        yup
        also shows/hides the board/piece when game is paused
    */
    togglePause: function() {
        if(this.gameOn) {
            this.isPaused = !this.isPaused;
            if(this.isPaused) {
                dom.ratio.addClass("pause");
            } else {
                dom.ratio.removeClass("pause");
            }
        }
    },

    /*
        newGame()
        prepares a new game
        (re)sets all the things
    */
    newGame: function() {

        board.init();
        piece.steps = 0;
        piece.new();
        state.fallCountdown = conf.fallCountdown;

        this.rotateEnabled = true;
        this.moveRequest = [];
        this.moveDelay = 0;
        this.floatCount = 0;

        this.level = 0;
        this.score = 0;
        this.lines = [0,0,0,0,0];

        this.levelUp = true;
        this.scoreUp = true;
        this.linesUp = true;
        this.currentSteps = conf.levelSteps[this.level];

        dom.parent.removeClass("showintro");
        dom.parent.removeClass("gameover");

        this.gameOn = true;
        if(this.isPaused) {
            this.togglePause();
        }
    },

    init: function() {
        this.isPaused = true;
        this.gameOn = false;
        this.isSpeedDrop = false;
        this.isMove = false;

        // set start time
        this.time = Date.now();

        this.trend = this.whichTransitionEndEvent();
        this.anend = this.whichAnimationEndEvent();

        this.generateBag();

        this.level = 0;
        this.score = 0;
        this.lines = [0,0,0,0,0];
        this.levelUp = true;
        this.scoreUp = true;
        this.linesUp = true;
 
    },
};