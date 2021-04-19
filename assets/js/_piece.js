const piece = {

    id: null,
    x: null,
    y: null,
    steps: 0,

    /*
        new(id, y, x)
        sets up a new piece
        if id is not defined, draw a new id from the random bag
        if coordinates are not defined, place the piece on the top of the board
    */
    new: function(id, y, x) {

        if(id === undefined) {
            this.id = state.getNextPiece();
        } else {
            this.id = id;
        }

        if(x !== undefined && y !== undefined) {
            this.x = x;
            this.y = y;
        } else {
            this.x = Math.round(conf.tilesX / 2);
            this.y = 0;
        }

        // if piece does not fit: game over, but show piece
        if(!board.hasSpace(this.id, this.x, this.y, this.steps)) {
            // game over
            state.isPaused = true;
            state.gameOn = false;
            dom.parent.addClass("showintro");
            dom.parent.addClass("gameover");
            state.trackPlayEnded();
            state.trackPlayDuration();
        }

        dom.current.innerHTML = this.createPieceHTML(this.id);
        this.updatePosition();

        dom.next.innerHTML = this.createPieceHTML(state.bag[0]);

    },

    /*
        updatePosition()
        set correct position on the current piece container
    */
    updatePosition: function() {
        dom.current.style["left"] = this.x * state.tileSize + "px";
        dom.current.style["top"] = (this.y + this.steps/state.currentSteps) * state.tileSize + "px";
    },

    /*
        createPieceHTML(id)
        create the markup for a given piece, as defined in def.p
    */
    createPieceHTML: function(id) {
        let str = '';
        for(let a in def.p[id].pp) {
            let pp = def.p[id].pp[a];
            str += `<div class="${def.p[id].css} x${pp.x} y${pp.y}"></div>`;
        }
        return str;
    },

    /*
        drop()
        drop current piece on the board
        update internal and external board
    */
    drop: function() {
        let p = def.p[this.id];

        for(let i in p.pp) {
            let pp = p.pp[i];
            board.plot(p.css, this.x + pp.x, this.y + pp.y);
        }

        // remove visual piece
        dom.current.innerHTML = "";
    },

    /*
        rotateLeft()
        rotate piece left (counter-clockwise)
    */
    rotateLeft: function() {
        this.rotate(def.dirLeft);
    },

    /*
        rotateRight()
        rotate piece right (clockwise)
    */
    rotateRight: function() {
        this.rotate(def.dirRight);
    },

    /*
        rotate(dir)
        rotate piece in the desired direction.
        If rotation is impossible, then the piece is nudged 1px to either
        side and rotation is attempted again.
        If this is still impossible, then the piece is nudged 2px to
        either side.

        Nudge nudge, say no more, say no more..
    */
    rotate: function(dir) {

        for(let nudge=0; nudge<3; nudge++) {
            if(board.hasSpace(def.r[this.id][dir], this.x + nudge, this.y, this.steps)) {
                this.new(def.r[this.id][dir], this.y, this.x + nudge);
                return;
            }
            if(board.hasSpace(def.r[this.id][dir], this.x - nudge, this.y, this.steps)) {
                this.new(def.r[this.id][dir], this.y, this.x - nudge);
                return;
            }
        }
    },

    /*
        moveLeft()
        move the piece one square to the left
    */
    moveLeft: function() {
        return this.move(def.movementLeft);
    },

    /*
        moveRight()
        move the piece one square to the right
    */
    moveRight: function() {
        return this.move(def.movementRight);
    },

    /*
        move(dx)
        attempt to move the piece dx squares
        updates the position if successful
        returns true or false
    */
    move: function(dx) {
        if(board.hasSpace(this.id, this.x + dx, this.y, this.steps)) {
            this.x += dx;
            this.updatePosition();
            return true;
        } else {
            return false;
        }
    },

    /*
        fall()
        attempt to fall one step
        calculates y position if the piece intersects with a new line
    */
    fall: function() {
        let falling = false;
        if(this.steps > 0) {
            // piece is already occupying the next tiles. no need to check
            falling = true;
        } else {
            // check if ok to fall another line
            if (board.hasSpace(this.id, this.x, this.y+1)) {
                falling = true;
                if(state.isSpeedDrop) {
                    state.incScore(1);
                }
            }
        }

        if (falling) {
            if(++this.steps >= state.currentSteps) {
                // reached the next line
                this.steps = 0;
                this.y++;
            }

            this.updatePosition();
        }

        return falling;
    },
};