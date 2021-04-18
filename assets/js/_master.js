const master = {
    raf: null,

    init: function() {

        // determine the correct raf
        this.raf = (window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.msRequestAnimationFrame).bind(window);

        dom.init();
        state.init();

        this.useCharset();
        this.initResizeHandler();
        this.handleKeyboardEvents();
        this.handleTouch();
        this.handleClick();

        this.raf(this.run.bind(this));
    },

    /*
        run()
        game loop with fixed frequency
    */
    run: function() {
        let time = Date.now();
        if(time - state.time > conf.repeatDelay) {
            state.time = time;

            if(!state.isPaused) {

                // handle move requests
                // moveDelay prevents pieces from being moved too fast.
                // exception for mobile: piece is moved with the swipe speed.
                // if piece cannot be moved in the desired direction,
                // a moveRequest is set, moving the piece as soon as it is
                // possible
                state.moveDelay--;
                if(state.moveRequest.length > 0 && state.moveDelay < 0) {
                    if(piece.move(state.moveRequest[0])) {
                        // reset move delay after a successful move
                        state.moveDelay = 2;
                        state.touchX += state.moveRequest[0] * state.tileSize;
                    }
                }

                if(--state.fallCountdown > 0) {
                    // a small delay before a new piece starts falling
                } else if(piece.fall()) {
                    // as long a sthe piece is falling, reset floatCount
                    state.floatCount = 0;
                } else {
                    // piece didn't fall
                    // start floating unless already floating
                    if(state.floatCount == 0) {
                        // start floating
                        if(state.isSpeedDrop) {
                            state.floatCount = conf.floatCountSpeedDrop;
                        } else {
                            state.floatCount = conf.floatCountStart;
                        }
                    } else {
                        // floating is already activated
                        if(--state.floatCount == 0) {
                            // drop the piece
                            piece.drop();
                            // pause run
                            state.isPaused = true;

                            if(!board.clearLines()) {
                                // no lines were cleared. continue.
                                // pause off
                                state.isPaused = false;
                                // new piece
                                piece.new();
                                state.fallCountdown = conf.fallCountdown;

                            }
                        }
                    }
                }
            }
            state.updateLines();
            state.updateLevel();
            state.updateScore();
        }
        this.raf(this.run.bind(this));

    },

    /*
        initResizeHandler
        set up event handler for viewport resize
    */
    initResizeHandler: function() {
        this.handleResize();
        window.onresize = this.handleResize.bind(this);
    },

    /*
        handleResize()
        handle viewport size change
    */
    handleResize: function() {
        this.calculateSizes();
        this.upateRuntimeCSS();
        piece.updatePosition();
    },

    /*
        handleClick()
        handle click events (start button)
    */
    handleClick: function() {
        dom.playButton.addEventListener("click", function(e){
            state.newGame();
        }.bind(this));
    },

    /*
        handleTouch()
        handle touch events
    */
    handleTouch: function() {
        let touchY, dx;

        dom.ctrl.addEventListener("touchstart", function(e){
            e.preventDefault();
            state.touchX = Math.round(e.targetTouches[0].clientX);
            touchY = Math.round(e.targetTouches[0].clientY);

            if(touchY < state.pauseArea) {
                state.togglePause();
            } else {
                state.isMove = false;

                if(touchY > state.speedDrop) {
                    // turn speed drop on
                    state.activateSpeedDrop();
                }
            }
        });

        dom.ctrl.addEventListener("touchmove", function(e){
            e.preventDefault();
            if(!state.isPaused) {
                dx = e.targetTouches[0].clientX - state.touchX;

                if(!state.isSpeedDrop) {

                    if(Math.abs(dx) > state.tileSize) {
                        state.isMove = true;

                        let dir = dx<0?-1:1;

                        if(!state.isPaused && piece.move(dir)) {
                            state.touchX += dir * state.tileSize;
                        } else {
                            // move could not be done. flag request to move
                            state.setMoveRequest(dir);
                        }
                    } else {
                        state.clearMoveRequest();
                    }
                }
            }
        });

        dom.ctrl.addEventListener("touchend", function(e){
            e.preventDefault();

            if(touchY > state.pauseArea) {
                if(!state.isSpeedDrop && !state.isMove) {
                    // rotate
                    if(!state.isPaused) {
                        if(state.touchX < state.median) {
                            piece.rotateLeft();
                        } else {
                            piece.rotateRight();
                        }
                    }
                }
                state.clearMoveRequest();
                state.cancelSpeedDrop();
                state.isMove = false;
            }
        });
    },

    /*
        handleKeyboardEvents()
    */
    handleKeyboardEvents: function() {

        window.addEventListener("keydown", function(e){

            // handle first occurrence of key, ignore key repeat
            if(!e.repeat) {

                switch(e.keyCode) {

                    case def.keyS:
                    case def.keyDown:
                        // turn speed drop on
                        state.activateSpeedDrop();
                        break;

                    case def.keyA:
                    case def.keyLeft:
                        // add request to move left
                        state.addMoveRequest(def.movementLeft);
                        break;

                    case def.keyD:
                    case def.keyRight:
                        // add request to move right
                        state.addMoveRequest(def.movementRight);
                        break;

                    case def.keyI:
                        // request to rotate left
                        state.addRotateRequest(def.dirLeft);
                        break;

                    case def.keyW:
                    case def.keyUp:
                    case def.keyO:
                        // request to rotate right
                        state.addRotateRequest(def.dirRight);
                        break;

                    case def.keyP:
                        // toggle pause on/off
                        state.togglePause();
                        break;

                    case def.keyEnter:
                        state.newGame();
                        break;
                }
            }
        }.bind(this));

        window.addEventListener("keyup", function(e){

            switch(e.keyCode) {

                case def.keyS:
                case def.keyDown:
                    // turn speed drop off
                    state.cancelSpeedDrop();
                    break;

                case def.keyA:
                case def.keyLeft:
                    // cancel request to move left
                    state.cancelMoveRequest(def.movementLeft);
                    break;
                case def.keyD:
                case def.keyRight:
                    // cancel request to move right
                    state.cancelMoveRequest(def.movementRight);
                    break;

                // re-enable rotation
                case def.keyW:
                case def.keyUp:
                case def.keyI:
                case def.keyO:
                    state.cancelRotateRequest();
                    break;

            }
        });
    },

    /*
        calculateSizes()
        The HTML elements cannot be completely responsive. This leads to
        decimals and rounded values, making it harder to calculate exact
        coordinates, and leading to glitches in positioning/overlapping.

        We need to calculate reliable integer values for each tile, and
        further determine the size and position of the ratio element and
        other sections.

        This is done at startup and whenever the viewport size is altered
    */
    calculateSizes: function() {

        let tileSize = Math.floor(window.innerWidth / conf.aspectWidth);

        let ratioWidth = tileSize * conf.aspectWidth;
        let ratioHeight = tileSize * conf.aspectHeight + conf.aspectHeightAdditional;

        if (ratioHeight > window.innerHeight) {
            tileSize = Math.floor((window.innerHeight - conf.aspectHeightAdditional) / conf.aspectHeight);

            ratioWidth = tileSize * conf.aspectWidth;
            ratioHeight = tileSize * conf.aspectHeight + conf.aspectHeightAdditional;
        }

        state.ratioWidth = ratioWidth;
        state.ratioHeight = ratioHeight;
        state.tileSize = tileSize;

        state.ratioLeft = Math.floor((window.innerWidth - state.ratioWidth) / 2);
        state.ratioTop = Math.floor((window.innerHeight - state.ratioHeight) / 2);

        state.sectionLeft = Math.floor(state.tileSize / 2);

        // calc thresholds for control areas (rotate l/r + speed drop)
        state.median = Math.round(window.innerWidth / 2);
        state.speedDrop = Math.round(window.innerHeight * 0.85);
        state.pauseArea = Math.round(window.innerHeight * 0.15);

        log("screen: " + window.innerWidth + "x" + window.innerHeight +
            " .ratio: " + state.ratioWidth + "x" + state.ratioHeight +
            " t:" + tileSize);
    },

    /*
        upateRuntimeCSS()
        generate CSS rules for tiles, pieces and misc sections of the game.
        This is generated at startup and whenever the viewport size is altered
    */
    upateRuntimeCSS: function() {
        let str = '';

        str += '.ratio {';
        str += `width:${state.ratioWidth}px;`;
        str += `height:${state.ratioHeight}px;`;
        str += `left:${state.ratioLeft}px;`;
        str += `top:${state.ratioTop}px;`;
        str += '}';

        str += 'section.next {';
        str += `width:${conf.tilesX * state.tileSize}px;`;
        str += `height:${3 * state.tileSize}px;`;
        str += `left:${state.sectionLeft}px;`;
        str += '}';

        str += 'section.board {';
        str += `width:${conf.tilesX * state.tileSize}px;`;
        str += `height:${conf.tilesY * state.tileSize}px;`;
        str += `left:${state.sectionLeft}px;`;
        str += `top:${state.tileSize*3 + 3}px;`;
        str += '}';

        str += 'section.stats {';
        str += `width:${conf.tilesX * state.tileSize}px;`;
        str += `height:${2 * state.tileSize}px;`;
        str += `left:${state.sectionLeft}px;`;
        str += `top:${state.tileSize*3 + 3 + state.tileSize*18 + 3}px;`;
        str += '}';

        str += '.board .lines li div, .tile {';
        str += `width:${state.tileSize}px;`;
        str += `height:${state.tileSize}px;`;
        str += '}';

        str += '.board .lines li {';
        str += `height:${state.tileSize}px;`;
        str += '}';

        // width of one number in stats
        str += '.stats span {';
        str += `width:${Math.floor(conf.tilesX * state.tileSize / 22)}px;`;
        str += '}';

        // width of stats labels (50% of board width)
        str += '.stats b {';
        str += `width:${Math.floor(conf.tilesX * state.tileSize / 2)}px;`;
        str += '}';

        dom.runtimeStyle.innerHTML = str;
    },

    /*
        useCharset()
        replace text with png charset
    */
    useCharset: function() {
        dom.charset.each(function(i,el){
            let txt = el.innerHTML;
            txt = txt.split("").map(function(a){
                // check speziales
                switch(a) {
                    case ".": a="dot";break;
                    case "!": a="exc";break;
                    case ":": a="col";break;
                    case "-": a="hyp";break;
                    case "1": a="n1";break;
                    case "2": a="n2";break;
                    case "3": a="n3";break;
                    case "4": a="n4";break;
                    case "5": a="n5";break;
                    case "6": a="n6";break;
                    case "7": a="n7";break;
                    case "8": a="n8";break;
                    case "9": a="n9";break;
                    case "0": a="n0";break;
                    case "(": a="hrt";break;
                    case ")": a="smi";break;
                    case "W": a="kw";break; // key w
                    case "A": a="ka";break;
                    case "S": a="ks";break;
                    case "D": a="kd";break;
                    case "P": a="kp";break;
                    case "I": a="ki";break;
                    case "O": a="ko";break;
                    case "Z": a="kal";break; // key arrow left
                    case "X": a="kar";break; // key arrow right
                    case "C": a="kau";break; // key arrow up
                    case "V": a="kad";break; // key arrow down
                    case "B": a="ken";break; // key enter
                    case " ": a="spc";break; // space
                }
                return `<span class="${a}"></span>`;
            }).join("");
            el.innerHTML = txt;
        });
    },    
};
