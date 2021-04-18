const dom = {
    runtimeStyle: null,
    parent: null,
    ratio: null,
    next: null,
    board: null,
    stats: null,
    lines: null,
    level: null,
    score: null,
    clearStats: null,
    ctrl: null,
    charset: null,
    playButton: null,

    clearLines: null,

    init: function() {
        this.runtimeStyle = z("style.runtime");
        this.parent = z(".fullscreen");
        this.ratio = this.parent.find(".ratio");
        this.next = this.parent.find("section.next .tile");
        this.board = this.parent.find("section.board ul.lines");

        this.stats = this.parent.find("section.stats");
        this.lines = this.stats.find(".lines p");
        this.level = this.stats.find(".level p");
        this.score = this.stats.find(".score p");
        this.clearStats = this.stats.find("ul li");

        this.current = this.parent.find(".current");
        this.ctrl = this.parent.find(".control");
        this.charset = z("p.charset");
        this.playButton = z(".intro .play");

        this.clearLines = [];
    }
};