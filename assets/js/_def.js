const def = {

    // internal board value
    space: 0,

    /*
        piece definition
        index 0 is not used
        dot marks the origo

        1 (O)       2 (I)               3 (L)           4 (J)
         ___ ___                         ___ ___ ___     ___ ___ ___
        | . |   |                       |   | . |   |   |   | . |   |
        |___|___|    ___ ___ ___ ___    |___|___|___|   |___|___|___|
        |   |   |   |   | . |   |   |   |   |                   |   |
        |___|___|   |___|___|___|___|   |___|                   |___|

        5 (S)           6 (Z)           7 (T)
             ___ ___     ___ ___         ___ ___ ___
            | . |   |   |   | . |       |   | . |   |
         ___|___|___|   |___|___|___    |___|___|___|
        |   |   |           |   |   |       |   |
        |___|___|           |___|___|       |___|

        index 8-25 are rotated variants of the first 7

        honk if u love ascii art <3
    */
    p: [
        {},
        { css: 'p1', pp: [{x: 0,y: 0}, {x: 1,y: 0}, {x: 0,y: 1}, {x: 1,y: 1}] },
        { css: 'p2', pp: [{x:-1,y: 0}, {x: 0,y: 0}, {x: 1,y: 0}, {x: 2,y: 0}] },
        { css: 'p3', pp: [{x:-1,y: 0}, {x: 0,y: 0}, {x: 1,y: 0}, {x:-1,y: 1}] },
        { css: 'p4', pp: [{x:-1,y: 0}, {x: 0,y: 0}, {x: 1,y: 0}, {x: 1,y: 1}] },
        { css: 'p5', pp: [{x: 0,y: 0}, {x: 1,y: 0}, {x:-1,y: 1}, {x: 0,y: 1}] },
        { css: 'p6', pp: [{x:-1,y: 0}, {x: 0,y: 0}, {x: 0,y: 1}, {x: 1,y: 1}] },
        { css: 'p7', pp: [{x:-1,y: 0}, {x: 0,y: 0}, {x: 1,y: 0}, {x: 0,y: 1}] },
        // 8, 9, 10 are rotated variants of piece 2
        { css: 'p2', pp: [{x: 0,y:-1}, {x: 0,y: 0}, {x: 0,y: 1}, {x: 0,y: 2}] },
        { css: 'p2', pp: [{x:-1,y: 0}, {x: 0,y: 0}, {x: 1,y: 0}, {x: 2,y: 0}] },
        { css: 'p2', pp: [{x: 0,y:-1}, {x: 0,y: 0}, {x: 0,y: 1}, {x: 0,y: 2}] },
        // 11, 12, 13 are rotated variants of piece 3
        { css: 'p3', pp: [{x:-1,y: 0}, {x: 0,y: 0}, {x: 0,y: 1}, {x: 0,y: 2}] },
        { css: 'p3', pp: [{x:-2,y: 1}, {x:-1,y: 1}, {x: 0,y: 1}, {x: 0,y: 0}] },
        { css: 'p3', pp: [{x:-1,y:-1}, {x:-1,y: 0}, {x:-1,y: 1}, {x: 0,y: 1}] },
        // 14, 15, 16 are rotated variants of piece 4
        { css: 'p4', pp: [{x: 0,y: 1}, {x: 1,y: 1}, {x: 1,y: 0}, {x: 1,y:-1}] },
        { css: 'p4', pp: [{x: 0,y: 0}, {x: 0,y: 1}, {x: 1,y: 1}, {x: 2,y: 1}] },
        { css: 'p4', pp: [{x: 0,y: 2}, {x: 0,y: 1}, {x: 0,y: 0}, {x: 1,y: 0}] },
        // 17, 18, 19 are rotated variants of piece 5
        { css: 'p5', pp: [{x:-1,y: 0}, {x:-1,y: 1}, {x: 0,y: 1}, {x: 0,y: 2}] },
        { css: 'p5', pp: [{x: 0,y: 0}, {x: 1,y: 0}, {x:-1,y: 1}, {x: 0,y: 1}] },
        { css: 'p5', pp: [{x:-1,y: 0}, {x:-1,y: 1}, {x: 0,y: 1}, {x: 0,y: 2}] },
        // 20, 21, 22 are rotated variants of piece 6
        { css: 'p6', pp: [{x: 0,y: 2}, {x: 0,y: 1}, {x: 1,y: 1}, {x: 1,y: 0}] },
        { css: 'p6', pp: [{x:-1,y: 0}, {x: 0,y: 0}, {x: 0,y: 1}, {x: 1,y: 1}] },
        { css: 'p6', pp: [{x: 0,y: 2}, {x: 0,y: 1}, {x: 1,y: 1}, {x: 1,y: 0}] },
        // 23, 24, 25 are rotated variants of piece 7
        { css: 'p7', pp: [{x:-1,y: 0}, {x: 0,y:-1}, {x: 0,y: 0}, {x: 0,y: 1}] },
        { css: 'p7', pp: [{x:-1,y: 0}, {x: 0,y:-1}, {x: 0,y: 0}, {x: 1,y: 0}] },
        { css: 'p7', pp: [{x: 0,y:-1}, {x: 0,y: 0}, {x: 1,y: 0}, {x: 0,y: 1}] },
    ],

    /*
        piece rotation lookup
        sub index 0 (dirLeft) is counter-clockwise
        sub index 1 (dirRight) is clockwise
    */
    dirLeft: 0,
    dirRight: 1,
    r: [
        [], // 0 = not used
        [ 1, 1], // piece  1 can't be rotated
        [10, 8], // piece  2 rotated
        [13,11], // piece  3 rotated
        [16,14], // piece  4 rotated
        [19,17], // piece  5 rotated
        [22,20], // piece  6 rotated
        [25,23], // piece  7 rotated
        [ 2, 9], // piece  8 rotated
        [ 8,10], // piece  9 rotated
        [ 9, 2], // piece 10 rotated
        [ 3,12], // piece 11 rotated
        [11,13], // piece 12 rotated
        [12, 3], // piece 13 rotated
        [ 4,15], // piece 14 rotated
        [14,16], // piece 15 rotated
        [15, 4], // piece 16 rotated
        [ 5,18], // piece 17 rotated
        [17,19], // piece 18 rotated
        [18, 5], // piece 19 rotated
        [ 6,21], // piece 20 rotated
        [20,22], // piece 21 rotated
        [21, 6], // piece 22 rotated
        [ 7,24], // piece 23 rotated
        [23,25], // piece 24 rotated
        [24, 7], // piece 25 rotated
    ],

    // piece movement deltas
    movementLeft: -1,
    movementRight: 1,

    // keydown/up codes
    keyW:  87,
    keyA:  65,
    keyS:  83,
    keyD:  68,

    keyI:  73,
    keyO:  79,
    keyP:  80,

    keyUp:   38,
    keyDown: 40,
    keyLeft: 37,
    keyRight:39,

    keyEnter: 13,

};