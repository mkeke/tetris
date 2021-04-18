const conf = {
    debugLevel: 0,

    // total aspect ratio of the game area (.ratio)
    aspectWidth: 10 + 1, // tiles
    aspectHeight: 3 + 18 + 2, // tiles
    aspectHeightAdditional: 6, // px

    // repeat delay (ms)
    repeatDelay: 20,

    // the number of cycles to float before dropping
    floatCountStart: 15,
    // the number of cycles to float before dropping
    floatCountSpeedDrop: 8,
    // the number of cycles before a new piece can start falling
    fallCountdown: 8,

    // board size
    tilesX: 10,
    tilesY: 18,

    // steps per level
    levelSteps: [
        12, // level 0, slowest
        11,
        10,
        9,
        8,
        7,
        6,
        5,
        4,
        3,
        2, // level 10, fastest
    ],
};
