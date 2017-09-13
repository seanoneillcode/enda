
module.exports = {
    board: {
        x:4,
        y:4,
        z:4,
        t:4
    },
	data : [
        {
            type : "bishop",
            pos : { x:0 , y:0, z:3, t:0 },
            owner : "player_one",
            id: 0
        },
        {
            type : "knight",
            pos : { x:1 , y:0, z:3, t:0 },
            owner : "player_one",
            id: 1
        },
        {
            type : "king",
            pos : { x:2 , y:0, z:3, t:0 },
            owner : "player_one",
            id: 2
        },
        {
            type : "bishop",
            pos : { x:3 , y:0, z:3, t:0 },
            owner : "player_one",
            id: 3
        },
        {
            type : "castle",
            pos : { x:0 , y:0, z:2, t:0 },
            owner : "player_one",
            id: 4
        },
        {
            type : "castle",
            pos : { x:1 , y:0, z:2, t:0 },
            owner : "player_one",
            id: 5
        },
        {
            type : "castle",
            pos : { x:2 , y:0, z:2, t:0 },
            owner : "player_one",
            id: 6
        },
        {
            type : "castle",
            pos : { x:3 , y:0, z:2, t:0 },
            owner : "player_one",
            id: 7
        },
        {
            type : "bishop",
            pos : { x:0 , y:3, z:0, t:3 },
            owner : "player_two",
            id: 8
        },
        {
            type : "king",
            pos : { x:1 , y:3, z:0, t:3 },
            owner : "player_two",
            id: 9
        },
        {
            type : "knight",
            pos : { x:2 , y:3, z:0, t:3 },
            owner : "player_two",
            id: 11
        },
        {
            type : "bishop",
            pos : { x:3 , y:3, z:0, t:3 },
            owner : "player_two",
            id: 12
        },
        {
            type : "castle",
            pos : { x:3 , y:3, z:1, t:3 },
            owner : "player_two",
            id: 13
        },
        {
            type : "castle",
            pos : { x:2 , y:3, z:1, t:3 },
            owner : "player_two",
            id: 14
        },
        {
            type : "castle",
            pos : { x:1 , y:3, z:1, t:3 },
            owner : "player_two",
            id: 15
        },
        {
            type : "castle",
            pos : { x:0 , y:3, z:1, t:3 },
            owner : "player_two",
            id: 16
        }
    ]
}