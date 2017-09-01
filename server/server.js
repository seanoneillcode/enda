var express = require("express");
var bodyParser = require("body-parser");
var _ = require("lodash");

module.exports = function(port, middleware, callback) {
    var app = express();

    if (middleware) {
        app.use(middleware);
    }
    app.use(express.static("public"));
    app.use(bodyParser.json());

    var latestId = 0;
    var todos = [];
    var players = [];
    var games = [];
    

    // { name : "foo" }
    app.post("/api/player", function(req, res) {
        player = req.body;
        newPlayerId = latestId.toString();
        latestId++;
        player.id = newPlayerId;
        players.push(player);
        res.json(player);
        // res.sendStatus(201);
    });

    // add the player 
    app.post("/api/game", function(req, res) {
        var playerId = req.body.playerId;
        addPlayerToGame(getPlayer(playerId));
        res.sendStatus(201);
    });

    // add a move
    app.post("/api/game/:id", function(req, res) {
        var stateChange = req.body.stateChange;
        var game = getGame(req.params.id);
        game.moves.push(stateChange);
        var piece = getPiece(stateChange.piece, game.currentState);
        var existingPiece = getPieceAtPosition(stateChange.toPos, game.currentState);
        if (existingPiece) {
            console.log("found existingPiece");
            game.currentState = filterPiece(existingPiece, game.currentState);
            game.takenPieces.push(existingPiece);
        }
        piece.pos.x = stateChange.toPos.x;
        piece.pos.y = stateChange.toPos.y;
        piece.pos.z = stateChange.toPos.z;
        checkIfGameOver(game);
        res.sendStatus(201);
    });

    // Read
    app.get("/api/player/:id/currentGame", function(req, res) {
        res.json(getGameFromPlayer(req.params.id));
    });

    app.get("/api/game/:id", function(req, res) {
        res.json(getGame(req.params.id));
    });

    // Delete
    // app.delete("/api/todo/:id", function(req, res) {
    //     var id = req.params.id;
    //     var todo = getTodo(id);
    //     if (todo) {
    //         todos = todos.filter(function(otherTodo) {
    //             return otherTodo !== todo;
    //         });
    //         res.sendStatus(200);
    //     } else {
    //         res.sendStatus(404);
    //     }
    // });

    function addPlayerToGame (player) {
        var gamesThatNeedAPlayer = games.filter(function(game) {
            return game.player_one === undefined || game.player_two === undefined;
        });
        if (gamesThatNeedAPlayer.length > 0) {
            console.log("found a game that needs a player");
            var newGame = gamesThatNeedAPlayer[0];
            if (newGame.player_one === undefined) {
                newGame.player_one = player;
            } else {
                newGame.player_two = player;
            }
            newGame.metaState = "playing";
        } else {
            console.log("no games found that has a space. making a new one");
            var newGameId = latestId.toString();
            latestId++;
            games.push({
                id : newGameId,
                player_one : player,
                player_two : undefined,
                currentPlayer : player,
                moves: [],
                takenPieces: [],
                metaState: "waiting",
                winner: undefined,
                currentState : [
                    {
                        type : "king",
                        pos : { x:2 , y:0, z:3 },
                        owner : "player_one",
                        id: 0
                    },
                    {
                        type : "knight",
                        pos : { x:1 , y:0, z:2 },
                        owner : "player_one",
                        id: 1
                    },
                    {
                        type : "pawn",
                        pos : { x:2 , y:0, z:2 },
                        owner : "player_one",
                        id: 2
                    },
                    {
                        type : "castle",
                        pos : { x:3 , y:0, z:2 },
                        owner : "player_one",
                        id: 3
                    },
                    {
                        type : "king",
                        pos : { x:1 , y:3, z:0 },
                        owner : "player_two",
                        id: 4
                    },
                    {
                        type : "knight",
                        pos : { x:2 , y:3, z:1 },
                        owner : "player_two",
                        id: 5
                    },
                    {
                        type : "pawn",
                        pos : { x:1 , y:3, z:1 },
                        owner : "player_two",
                        id: 6
                    },
                    {
                        type : "castle",
                        pos : { x:0 , y:3, z:1 },
                        owner : "player_two",
                        id: 7
                    }
               ]
            });
        }
    }

    function checkIfGameOver(game) {
        var anyKingTaken = game.takenPieces.filter(function(piece) {
            return piece.type === 'king';
        })[0];
        if (anyKingTaken) {
            game.metaState = "victory";
            game.winner = anyKingTaken.owner === "player_two" ? "player_one" : "player_two";
        }
        var kings = game.currentState.filter(function(piece) {
            return piece.type === 'king';
        });
        if (kings.length == game.currentState.length) {
            game.metaState = "draw";
            game.winner = "nobody";
        }
    }

    function getGame(id) {
        return games.filter(function(game) {
            return game.id === id;
        })[0];
    }

    function getPieceAtPosition(position, state) {
        return state.filter(function(piece) {
            return equalPos(piece.pos, position);
        })[0];
    }

    function getGameFromPlayer(playerId) {
        return games.filter(function(game) {
            return (game.player_one && (game.player_one.id === playerId)) || 
            (game.player_two && (game.player_two.id === playerId));
        })[0];
    }

    function getPlayer(id) {
        return players.filter(function(player) {
            return player.id === id;
        })[0];
    }

    function equalPos(a,b) {
        return a.x == b.x && a.y == b.y && a.z == b.z;
    }

    function getPiece(piece, currentState) {
        return currentState.filter(function (otherPiece) {
            return piece.id === otherPiece.id;
        })[0];
    }

    function filterPiece(piece, state) {
        return state.filter(function (otherPiece) {
            return piece.id !== otherPiece.id;
        });
    }

    var server = app.listen(port, callback);

    // We manually manage the connections to ensure that they're closed when calling close().
    var connections = [];
    server.on("connection", function(connection) {
        connections.push(connection);
    });

    return {
        close: function(callback) {
            connections.forEach(function(connection) {
                connection.destroy();
            });
            server.close(callback);
        }
    };
};