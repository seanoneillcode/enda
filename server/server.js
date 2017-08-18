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

    // Read
    app.get("/api/player/:id/currentGame", function(req, res) {
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
        } else {
            console.log("no games found that has a space. making a new one");
            var newGameId = latestId.toString();
            latestId++;
            games.push({
                id : newGameId,
                player_one : player,
                player_two : undefined,
                currentPlayer : player,
                pieces : [
                    {
                        type : "king",
                        pos : { x:2 , y:0, z:4 },
                        owner : "player_one"
                    },
                    {
                        type : "castle",
                        pos : { x:1 , y:0, z:3 },
                        owner : "player_one"
                    },
                    {
                        type : "pawn",
                        pos : { x:2 , y:0, z:3 },
                        owner : "player_one"
                    },
                    {
                        type : "knight",
                        pos : { x:3 , y:0, z:3 },
                        owner : "player_one"
                    },
                    {
                        type : "king",
                        pos : { x:2 , y:4, z:0 },
                        owner : "player_two"
                    },
                    {
                        type : "castle",
                        pos : { x:1 , y:4, z:1 },
                        owner : "player_two"
                    },
                    {
                        type : "pawn",
                        pos : { x:2 , y:4, z:1 },
                        owner : "player_two"
                    },
                    {
                        type : "knight",
                        pos : { x:3 , y:4, z:1 },
                        owner : "player_two"
                    },
               ]
            });
        }
    }

    function getGame(playerId) {
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

    var server = app.listen(port, callback);

    // We manually manage the connections to ensure that they're closed when calling close().
    var connections = [];
    server.on("connection", function(connection) {
        console.log("received a connection");
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