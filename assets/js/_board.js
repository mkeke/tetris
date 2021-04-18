const board = {

    // internal representation of the board
    b: [],

    init: function() {
        // fill internal board with space
        this.b = [];
        for(let y=0; y<conf.tilesY; y++) {
            this.b.push([]);
            for(let x=0; x<conf.tilesX; x++) {
                this.b[y].push(def.space);
            }
        }

        // generate HTML
        let str = this.generateLine(conf.tilesY);
        dom.board.innerHTML = str;
    },

    /*
        generateLine(num)
        generates HTML string for [num] lines
        default num is 1
    */
    generateLine: function(num) {
        if(num === undefined) {
            num = 1;
        }
        let str = "<li>" + "<div></div>".repeat(conf.tilesX) + "</li>";
        return str.repeat(num);
    },

    /*
        plot(type, x, y)
        plots a certain type to a specific coordinate on the board
        updates both internal and visual structure
        type is the associated css class name as defined in def.p[id].css
        (p1, p2, .., p7)
    */
    plot: function(type, x, y) {
        this.b[y][x] = type;
        dom.board.find("li")[y].find("div")[x].className = type;
    },

    /*
        hasSpace(id, x, y, dy)
        check if piece <id> can be placed at [x,y] with a possible step offset
        returns true or false
    */
    hasSpace: function(id, x, y, step) {
        // foreach pp: check boundaries + board
        // first collision: return false
        // return true;

        let pps = def.p[id].pp;

        let steps = step>0?2:1;
        for(let i=0; i<steps; i++) {
            for(let a in pps) {
                let pp = pps[a];
                if(
                    x + pp.x < 0 ||                 // too far left
                    x + pp.x >= conf.tilesX ||      // too far right
                    /* y + pp.y + i < 0 || */            // too far up
                    y + pp.y + i >= conf.tilesY ||  // too far down
                    (
                        y + pp.y + i >= 0 &&
                    this.b[y+pp.y+i][x+pp.x] !== def.space // seat's taken
                        )

                ) {
                    return false;
                }
            }
        }

        return true;
    },

    /*
        clearLines()

        Internally:
        1. find line numbers affected by piece drop
        2. identify completed lines
        3. remove lines, add new lines to the top

        Visually (chain of transitionEnd events):
        1. set white color on lines (flashup)
        2. hide tiles
        3. set transparent color on lines (flashdown)
        4. set line height 0px
        5. detach LIs from UL
        6. prepend new LIs to UL
        7. start earthquake animation if cleared more than 1 line
    */
    clearLines: function() {

        // 1. find line numbers affected by piece drop
        let nums = {};
        for(let i in def.p[piece.id].pp) {
            nums[piece.y+def.p[piece.id].pp[i].y] = true;
        }

        // 2. identify completed lines
        for(let y in nums) {
            for(let x in this.b[y]) {
                if(this.b[y][x] == def.space) {
                    // delete incomplete line from hash
                    delete(nums[y]);
                    break;
                }
            }
        }

        // convert keys to int, sort by numeric ascending
        nums = Object.keys(nums)
               .map(function(a){return parseInt(a)})
               .sort(function(a,b) { return a-b });

        // 3. remove lines, add new lines
        for(let i in nums) {
            // remove line
            this.b.splice(nums[i], 1);
            // add line to the top
            this.b.unshift([]);
            for(let x=0; x<conf.tilesX; x++) {
                this.b[0].push(def.space);
            }
        }

        // add lines to dom.clearLines
        dom.clearLines = [];
        for(let i in nums) {
            dom.clearLines.push(dom.board.find("li")[nums[i]]);
        }

        // and now for the visuals

        if(dom.clearLines.length > 0) {
            state.incLine(nums.length);

            // trigger transitionend after flash-up.
            // only attach it to the first of n elements
            // because all transitions finish at the same time.
            dom.clearLines[0].addEventListener(state.trend, this.flashUpEnded.bind(this));

            // trigger the first transition (flash-up)
            for(let i in dom.clearLines) {
                dom.clearLines[i].addClass("flashup");
            }

        }

        return nums.length > 0;
    },

    /*
        flashUpEnded()
        transition end event handler
        white color flash is done.
        Remove event listener and set up the next
    */
    flashUpEnded: function(e) {
        dom.clearLines[0].removeEventListener(state.trend,this.flashUpEnded.bind(this));
        dom.clearLines[0].addEventListener(state.trend,this.flashDownEnded.bind(this));

        for(let i in dom.clearLines) {
            dom.clearLines[i].addClass("flashdown");
        }
    },

    /*
        flashDownEnded()
        transition end event handler
        flash down is done.
        remove event listener and set up the next
    */
    flashDownEnded: function() {
        dom.clearLines[0].removeEventListener(state.trend,this.flashDownEnded.bind(this));
        dom.clearLines[0].addEventListener(state.trend, this.collapsedEnded.bind(this));

        for(let i in dom.clearLines) {
            dom.clearLines[i].addClass("collapse");
        }
    },

    /*
        collapsedEnded()
        transition end event handler
        collapse transition is done
        detach the lines from DOM
        prepend new lines
        refresh DOM pointer
        add earthquake animations if > 1 lines
        resume game
        new piece
    */
    collapsedEnded: function() {
        dom.clearLines[0].removeEventListener(state.trend, this.collapsedEnded.bind(this));

        // detach elements
        let n = dom.clearLines.length;
        for(let i in dom.clearLines) {
            dom.clearLines[i].detach();
        }
        // add n lines to top
        for(let i=0; i<n; i++) {
            dom.board.prepend(this.generateLine());
        }
        // refresh DOM pointer to board
        dom.board = dom.parent.find("section.board ul.lines");

        // trigger quake animations
        switch(n) {
            // "Little Earthquakes" - Tori Amos, 1992
            case 2:
                dom.ratio.addEventListener(state.anend, this.diquakeEnded.bind(this));
                dom.ratio.addClass("diquake");
                break;
            case 3:
                dom.ratio.addEventListener(state.anend, this.triquakeEnded.bind(this));
                dom.ratio.addClass("triquake");
                break;
            case 4:
                dom.ratio.addEventListener(state.anend, this.quadEnded.bind(this));
                dom.ratio.addClass("quad");
                break;
        }

        // pause off
        state.isPaused = false;
        // new piece
        piece.new();
        state.fallCountdown = conf.fallCountdown;
    },

    /*
        diquakeEnded()
        animation end event handler
        remove the animation trigger class, getting ready for another one
    */
    diquakeEnded: function() {
        dom.ratio.removeEventListener(state.anend, this.diquakeEnded.bind(this));
        dom.ratio.removeClass("diquake");
    },
    /*
        triquakeEnded()
        animation end event handler
        remove the animation trigger class, getting ready for another one
    */
    triquakeEnded: function() {
        dom.ratio.removeEventListener(state.anend, this.triquakeEnded.bind(this));
        dom.ratio.removeClass("triquake");
    },
    /*
        quadEnded()
        animation end event handler
        remove the animation trigger class, getting ready for another one
    */
    quadEnded: function() {
        dom.ratio.removeEventListener(state.anend, this.quadEnded.bind(this));
        dom.ratio.removeClass("quad");
    }

};