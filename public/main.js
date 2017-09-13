var form = document.getElementById("login-form");
var joinForm = document.getElementById("join-form");
var logoutForm = document.getElementById("logout-form");
var nameInput = document.getElementById("name-input");
var currentPlayer = document.getElementById("current-player");
var error = document.getElementById("error");
var gameMessage = document.getElementById("game-message");
var playerColorBox = document.getElementById("player-color-box");
var playerColor = document.getElementById("player-color");
var playerTurnBox = document.getElementById("player-turn-box");
var playerTurn = document.getElementById("player-turn");
var drawingHolder = document.getElementById("drawing-holder");
var menuContianer = document.getElementById("menu");

var playerName;
var playerId;
var currentGame;

var mouse = new THREE.Vector2(), INTERSECTED;
var camera, renderer, scene, raycaster;
var mouseDownLock = false;
var dirtyRender = true;
var firstDownEvent = false;
var mouseDrag = false;
var superSecretAdmin = false;

var lastSelected;
var localPieces = [];
var visibleMoves = [];
var positionCubes = [];

var geometry = new THREE.BoxGeometry( 0.9, 0.9, 0.9);
var boxGeometry = new THREE.BoxGeometry( 0.9, 0.9, 0.9);
var cylinderGeometry = new THREE.CylinderGeometry(0.5,0.5,1,32);
var planeGeometry = new THREE.PlaneGeometry( 1, 1, 4, 4 );
var coneGeometry = new THREE.ConeGeometry(0.5,1,32);
var knotGeometry = new THREE.TorusKnotGeometry( 0.25, 0.15, 0.9, 16 );
var sphereGeometry = new THREE.SphereGeometry(0.5,32,32);
var torusGeometry = new THREE.TorusGeometry( 0.4, 0.1, 16, 10 );
var move_geometry = new THREE.BoxGeometry( 0.92, 0.92, 0.92);


var dim_material = new THREE.MeshLambertMaterial( { color: 0xFFFFFF } );
var dim_geometry = new THREE.BoxGeometry( 0.01, 0.01, 0.01);
var dim_cubes = [0,0,0,0];
dim_cubes[0] = new THREE.Mesh(dim_geometry, dim_material);
dim_cubes[1] = new THREE.Mesh(dim_geometry, dim_material);
dim_cubes[2] = new THREE.Mesh(dim_geometry, dim_material);
dim_cubes[3] = new THREE.Mesh(dim_geometry, dim_material);
dim_cubes[0].position.x = -3;
dim_cubes[0].position.y = -3;
dim_cubes[1].position.x = 3;
dim_cubes[1].position.y = 3;
dim_cubes[2].position.x = -3;
dim_cubes[2].position.y = 3;
dim_cubes[3].position.x = 3;
dim_cubes[3].position.y = -3;


var orange_color = 0xFF8E00;
var blue_color = 0x00A9FF;
var red_color = 0xFF2D30;
var white_color = 0xFFFFFF;

var x_size = 4;
var y_size = 4;
var z_size = 4;
var t_size = 1;

var previousMousePosition = {
    x: 0,
    y: 0
};

var clientState = "not-joined";

function isEnemyPiece(pos, owner) {
    var isEnemyPiece = false;
    var enemy_owner = "player_one";
    if (owner === "player_one") {
        enemy_owner = "player_two"
    }
    var ownerPieces = getPiecesForOwner(enemy_owner);
    ownerPieces.forEach(function(ownerPiece) {
        if (isEqualPos(ownerPiece.piece.pos, pos)) {
            isEnemyPiece = true;
        }
    });
    return isEnemyPiece;
}

function isLegalMove(actualMove, ownerPieces) {
    var isLegal = true;
    if (actualMove.x >= x_size) {
        isLegal = false;
    }
    if (actualMove.x < 0) {
        isLegal = false;
    }
    if (actualMove.y >= y_size) {
        isLegal = false;
    }
    if (actualMove.y < 0) {
        isLegal = false;
    }
    if (actualMove.z >= z_size) {
        isLegal = false;
    }
    if (actualMove.z < 0) {
        isLegal = false;
    }
    if (actualMove.t >= t_size) {
        isLegal = false;
    }
    if (actualMove.t < 0) {
        isLegal = false;
    }
    ownerPieces.forEach(function(ownerPiece) {
        if (isEqualPos(ownerPiece.piece.pos, actualMove)) {
            isLegal = false;
        }
    });
    return isLegal;
}

form.onsubmit = function(event) {
    var name = nameInput.value;
    addPlayer(name, function(response) {
        playerName = response.name;
        playerId = response.id;
        window.localStorage.setItem('playerName', playerName);
    });
    nameInput.value = "";
    playerName = name;
    currentPlayer.textContent = name;
    form.style.display = 'none';
    logoutForm.style.display = 'inline-block';
    event.preventDefault();
};

joinForm.onsubmit = function(event) {
    if (!playerId) {
        error.textContent = "Player not created yet.";
        return;
    }
    joinGame(playerId, function() {
        getCurrentGame(function (response) {
            currentGame = response;
            startDrawing(currentGame);
        });
    });
    event.preventDefault();
};

logoutForm.onsubmit = function(event) {
    window.localStorage.removeItem('playerName');
    form.style.display = 'inline-block';
    currentPlayer.textContent = '';
    event.preventDefault();
};


function joinGame(playerId, callback) {
    var createRequest = new XMLHttpRequest();
    createRequest.open("POST", "/api/game");
    createRequest.setRequestHeader("Content-type", "application/json");
    createRequest.send(JSON.stringify({
        playerId: playerId
    }));
    createRequest.onload = function() {
        if (this.status === 201) {
            callback();
        } else {
            error.textContent = "Failed to join game. Server returned " + this.status + " - " + this.responseText;
        }
    };
}

function makeMoveServer(piece, toPos, callback) {
    var createRequest = new XMLHttpRequest();
    createRequest.open("POST", "/api/game/" + currentGame.id);
    createRequest.setRequestHeader("Content-type", "application/json");
    createRequest.send(JSON.stringify({
        stateChange: {
            piece: piece,
            toPos: toPos
        }
    }));
    createRequest.onload = function() {
        if (this.status === 201) {
            callback();
        } else {
            error.textContent = "Failed to join game. Server returned " + this.status + " - " + this.responseText;
        }
    };
}

function addPlayer(name, callback) {
    var createRequest = new XMLHttpRequest();
    createRequest.open("POST", "/api/player");
    createRequest.setRequestHeader("Content-type", "application/json");
    createRequest.send(JSON.stringify({
        name: name
    }));
    createRequest.onload = function() {
        if (this.status === 200) {
            callback(JSON.parse(this.responseText));
        } else {
            error.textContent = "Failed to create item. Server returned " + this.status + " - " + this.responseText;
        }
    };
}

function getCurrentGame(callback) {
    var createRequest = new XMLHttpRequest();
    createRequest.open("GET", "/api/game/" + currentGame.id);
    createRequest.onload = function() {
        if (this.status === 200) {
            callback(JSON.parse(this.responseText));
        } else {
            error.textContent = "Failed to get list. Server returned " + this.status + " - " + this.responseText;
        }
    };
    createRequest.send();
}

function getCurrentGame(callback) {
    if (!playerId) {
        error.textContent = "player not created yet.";
        return;
    }
    var createRequest = new XMLHttpRequest();
    createRequest.open("GET", "/api/player/" + playerId + "/currentGame");
    createRequest.onload = function() {
        if (this.status === 200) {
            callback(JSON.parse(this.responseText));
        } else {
            error.textContent = "Failed to get list. Server returned " + this.status + " - " + this.responseText;
        }
    };
    createRequest.send();
}
function addMeshObject(cube, position) {
    var dim = position.t ? position.t : 0;
    cube.position.x = cube.position.x - 2;
    cube.position.y = cube.position.y - 2;
    cube.position.z = cube.position.z - 2;
    dim_cubes[dim].add( cube );
}
function addMoveCube (position) {
    var cube = new THREE.Mesh( move_geometry, move_material );
    cube.position.set(
        position.x + 0.5,
        position.y + 0.5,
        position.z + 0.5);
    addMeshObject(cube, position);
    return cube;
}

function isEqualPos(a, b) {
    return a.x == b.x && a.y == b.y && a.z == b.z;
}

function getPiecesForOwner(owner, localPiece) {
    var owner_pieces = [];
    localPieces.forEach (function(localPiece) {
        if (localPiece.piece.owner == owner) {
            owner_pieces.push(localPiece);
        }
    });
    return owner_pieces;
}

function generateMoves(piece) {
    var type = piece.type;
    var currentPos = piece.pos;
    var moves = [];
    var abstractMoves = legalMoves[type];
    var ownerPieces = getPiecesForOwner(piece.owner);
    abstractMoves.forEach(function(abstractMove) {
        var f = abstractMove.f;
        var input = abstractMove.i;
        var potentialMoves = f.apply(this, [input, currentPos, piece.owner]);
        potentialMoves.forEach(function(potentialMove) {
            var actualMove = potentialMove;
            if (isLegalMove(actualMove, ownerPieces)) {
                moves.push(actualMove);
            }
        });
    });
    return moves;
}

function getPieceAtMove(move) {
    return localPieces.filter(function(piece) {
            return isEqualPos(move, piece.piece.pos);
        })[0];
}

function clearVisibleMoves() {
    visibleMoves.forEach(function(move) {
        if (move.isActualPiece) {
            var owner = move.piece.piece.owner;
            move.piece.inDanger = false;
        } else {
            dim_cubes[0].remove(move.obj);
            dim_cubes[1].remove(move.obj);
            dim_cubes[2].remove(move.obj);
            dim_cubes[3].remove(move.obj);
            scene.remove(move.obj);      
        }
    });
    visibleMoves = [];
}

function isPieceThisClientPiece(piece) {
    return currentGame.currentPlayer === piece.owner
}

function pickMouse() {
    if (clientState !== "playing" && !superSecretAdmin) {
        console.log("not playing yet");
       return;
    }
    if (currentGame[currentGame.currentPlayer].name !== playerName && !superSecretAdmin) {
        console.log("not your turn");
       return;
    }
    var localPiece;
    raycaster.setFromCamera( mouse, camera );
    console.log(raycaster);
    var intersects = raycaster.intersectObjects( scene.children, true);
    var tempSelected = lastSelected;
    var intersectedObject;

    if ( lastSelected ) {
        lastSelected.selected = false;
        lastSelected = null;
    }

    if ( intersects && intersects.length > 0 ) {
        console.log("found intersecting object");
        var index = 0;
        var found = false;
        while (intersects.length > index && !found) {
            if (!intersects[index].object.isPositionCube) {
                intersectedObject = intersects[index].object;
                found = true;
            }
            index++;
        }
        // intersectedObject = intersects[ 0 ].object;
        if (intersectedObject) {
            movementSelected = getSelectedMovementFromObject(intersectedObject);
            if (movementSelected) {
                if (superSecretAdmin) {
                    movePiece(tempSelected, movementSelected);
                } else {
                    if (isPieceThisClientPiece(tempSelected.piece)) {
                        console.log("moving piece ", tempSelected.piece);
                        movePiece(tempSelected, movementSelected);
                    } else {
                        console.log("trying to move piece you dont own");
                    }                    
                }
            }
            lastSelected = getLocalPieceFromObject(intersectedObject);
            if (lastSelected) {
                if (lastSelected.inDanger && tempSelected) {
                    if (lastSelected.piece.owner !== tempSelected.piece.owner && isPieceThisClientPiece(tempSelected.piece)) {
                        movePiece(tempSelected, lastSelected.piece);
                        lastSelected = null;
                    } else {
                        lastSelected.selected = true;
                    }
                } else {
                    lastSelected.selected = true;                    
                }
            }
        }
    }
    clearVisibleMoves();
    if (lastSelected) {
        var moves = generateMoves(lastSelected.piece);
        moves.forEach(function(move) {
            var pieceAtMove = getPieceAtMove(move);
            if (pieceAtMove) {
                pieceAtMove.inDanger = true;
                visibleMoves.push({
                    piece: pieceAtMove,
                    isActualPiece: true
                });
            } else {
                var cube = addMoveCube(move);
                visibleMoves.push({
                    obj: cube,
                    pos: move
                });
            }
            
        });
    }
    localPieces.forEach(function(piece){
        if (piece.selected) {
            piece.obj.material.color.setHex(white_color);
        } else {
            if (piece.inDanger) {
                piece.obj.material.color.setHex(red_color);
            } else {
                if (piece.piece.owner == "player_one") {
                    piece.obj.material.color.setHex(orange_color);
                } else {
                    piece.obj.material.color.setHex(blue_color);
                }
            }
        }
    });
}

function movePiece(object, to) {
    makeMoveServer(object.piece, to.pos, function() {
        getLatestState();
    });
}

function getSelectedMovementFromObject(object) {
    return visibleMoves.filter(function(piece) {
            return piece.obj === object;
        })[0];
}

function getLocalPieceFromObject(object) {
    return localPieces.filter(function(piece) {
            return piece.obj === object;
        })[0];
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}
function onDocumentMouseUp( event ) {
    mouseDownLock = false;
    if (!mouseDrag) {
        pickMouse();
    }
    event.preventDefault();
}
function onDocumentMouseMove( event ) {
    if (firstDownEvent) {
        firstDownEvent = false;
        mouseDrag = false;
        return;
    }
    if (mouseDownLock) {
        mouseDrag = true;
    } else {
        mouseDrag = false;
    }
    var deltaMove = {
        x: event.offsetX - previousMousePosition.x,
        y: event.offsetY - previousMousePosition.y
    };

    if(mouseDrag) {
            
        var deltaRotationQuaternion = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(
                toRadians(deltaMove.y * 1),
                toRadians(deltaMove.x * 1),
                0,
                'XYZ'
            ));
        
        dim_cubes[0].quaternion.multiplyQuaternions(deltaRotationQuaternion, dim_cubes[0].quaternion);
        dim_cubes[1].quaternion.multiplyQuaternions(deltaRotationQuaternion, dim_cubes[1].quaternion);
        dim_cubes[2].quaternion.multiplyQuaternions(deltaRotationQuaternion, dim_cubes[2].quaternion);
        dim_cubes[3].quaternion.multiplyQuaternions(deltaRotationQuaternion, dim_cubes[3].quaternion);
    }
    
    previousMousePosition = {
        x: event.offsetX,
        y: event.offsetY
    };
}

function toRadians(angle) {
    return angle * (Math.PI / 180);
}

function toDegrees(angle) {
    return angle * (180 / Math.PI);
}

function onDocumentMouseDown( event ) {
    mouseDownLock = true;
    firstDownEvent = true;
    event.preventDefault();
    mouse.x = ( event.offsetX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( (event.offsetY ) / window.innerHeight ) * 2 + 1;
}

function onDocumentKeyUp(event) {
    if (event.key === "[") {
        superSecretAdmin = false;
        console.log("disabling super secret admin mode");
    }
    if (event.key === "]") {
        superSecretAdmin = true;
        console.log("enabling super secret admin mode");
    }
}

function updatePlayerTurn() {
    if (clientState === "playing") {
        playerTurnBox.style.display = "inline-block";
    } else {
        playerTurnBox.style.display = "none";    
    }
    if (currentGame[currentGame.currentPlayer].name === playerName) {
        playerTurn.textContent = "YOUR";
    } else {
        playerTurn.textContent = "THEIR";
    }
}

function victoryTheGame(game) {
    var message = game[game.winner].name === playerName ? "You Win!" : "You Lose";
    gameMessage.textContent = "" + message;
    clientState = "victory";
}

function waitTheGame(game) {
    var message = "waiting for another player to join";
    gameMessage.textContent = "" + message;
    clientState = "waiting";
    playerColorBox.style.display= "none";
}

function playTheGame(game) {
    var message = "";
    gameMessage.textContent = "" + message;
    clientState = "playing";
    playerColorBox.style.display= "inline-block";
    if (currentGame.player_one.name === playerName) {
        playerColor.textContent = "ORANGE";
        playerColor.style.color = "#ffb400";
    } else {
        playerColor.textContent = "BLUE";
        playerColor.style.color = "#00f5ff";
    }
}

var move_material = new THREE.MeshLambertMaterial( { color: 0xB2B005 } );

function addcube (position, material, type) {
    var thisGeometry = geometry;
    if (type) {
        if (type === "king") {
            thisGeometry = cylinderGeometry;
        }
        if (type === "knight") {
            thisGeometry = knotGeometry;
        }
        if (type === "pawn") {
            thisGeometry = coneGeometry;
        }
        if (type === "castle") {
            thisGeometry = sphereGeometry;
        }
        if (type === "queen") {
            thisGeometry = torusGeometry;
        }
    }
    var cube = new THREE.Mesh( thisGeometry, material );

    cube.position.set(
        position.x,
        position.y,
        position.z);
    addMeshObject(cube, position);
    return cube;
}

function createCurrentGameVisuals(currentGame) {
    localPieces.forEach(function (localPiece) {
        var index = localPiece.piece.pos.t;
        dim_cubes[index].remove(localPiece.obj);
    });
    localPieces = [];

    for (var i = currentGame.currentState.length - 1; i >= 0; i--) {
        var currentPiece = currentGame.currentState[i];
        var x = currentPiece.pos.x + 0.5;
        var y = currentPiece.pos.y + 0.5;
        var z = currentPiece.pos.z + 0.5;
        var t = currentPiece.pos.t;
        var mat_color = currentPiece.owner == "player_one" ? orange_color : blue_color;
        var mat = new THREE.MeshLambertMaterial( { color: mat_color } );
        mat.name = "" + i;
        var obj = addcube({x:x,y:y,z:z,t:t}, mat, currentPiece.type);
        obj.userData.piece = currentPiece;
        localPieces.push({
            obj : obj,
            piece : currentPiece,
            selected: false
        });
    }
    dirtyRender = true;
}

var texture = [ {}, {}, {}, {}, 
    new THREE.TextureLoader().load('images/test-4.png'),
    new THREE.TextureLoader().load('images/test-5.png')
    ]

texture.forEach(function(texture) {
    if (texture) {
        texture.magFilter = THREE.NearestFilter;
    }
});
var tex_material = [ {}, {}, {}, {},
    new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture[4] } ),
    new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture[5] } )
]

function drawSide(position, rotation, size) {
    var side_geometry = new THREE.PlaneGeometry( size, size, size, size);
    var mesh = new THREE.Mesh( side_geometry, tex_material[size]);
    mesh.rotation.x = THREE.Math.degToRad( rotation.x );
    mesh.rotation.y = THREE.Math.degToRad( rotation.y );
    mesh.rotation.z = THREE.Math.degToRad( rotation.z );
    mesh.position.set(
        position.x,
        position.y,
        position.z);
    mesh.isPositionCube = true;
    positionCubes.push(mesh);
    addMeshObject(mesh, position);
}

function drawEverything(currentGame) {
    createCurrentGameVisuals(currentGame);

    for (var index = 0; index < positionCubes.length; index++) {
        scene.remove(positionCubes[index]);
        dim_cubes[0].remove(positionCubes[index]);
        dim_cubes[1].remove(positionCubes[index]);
        dim_cubes[2].remove(positionCubes[index]);
        dim_cubes[3].remove(positionCubes[index]);
    }
    positionCubes = [];
    
    var full_size = currentGame.board.x;
    var half_size = full_size * 0.5;

    for (var i = 0; i < currentGame.board.t; i++) {
        drawSide({x:half_size,y:half_size,z:0,t:i}, {x:0,y:0,z:0}, full_size);
        drawSide({x:half_size,y:half_size,z:full_size,t:i}, {x:180,y:0,z:0}, full_size);
        drawSide({x:full_size,y:half_size,z:half_size,t:i}, {x:0,y:270,z:0}, full_size);
        drawSide({x:0,y:half_size,z:half_size,t:i}, {x:0,y:90,z:0}, full_size);
        drawSide({x:half_size,y:full_size,z:half_size,t:i}, {x:90,y:0,z:0}, full_size);
        drawSide({x:half_size,y:0,z:half_size,t:i}, {x:270,y:0,z:0}, full_size);
    }

    x_size = currentGame.board.x;
    y_size = currentGame.board.y;
    z_size = currentGame.board.z;
    t_size = currentGame.board.t;
}

function startDrawing(currentGame) {
    scene = new THREE.Scene();
    scene.add( dim_cubes[0] );
    scene.add( dim_cubes[1] );
    scene.add( dim_cubes[2] );
    scene.add( dim_cubes[3] );
   // camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 1, 500 );
    var aspect = window.innerWidth / window.innerHeight;
    var frustumSize = 16;
    camera = new THREE.OrthographicCamera(
        frustumSize * aspect / - 2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        frustumSize / - 2, 1, 30 );
    renderer = new THREE.WebGLRenderer();
    raycaster = new THREE.Raycaster();;
    
    renderer.setSize( window.innerWidth, window.innerHeight );
    drawingHolder.appendChild( renderer.domElement );
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'keyup', onDocumentKeyUp, false );

    window.addEventListener( 'resize', onWindowResize, false );
    
    drawEverything(currentGame);

    var full_size = currentGame.board.x;
    var half_size = full_size * 0.5;

    camera.position.set(0, 0, 10);

    // controls = new THREE.OrbitControls( camera, renderer.domElement );
    // controls.enableDamping = true;
    // controls.dampingFactor = 0.25;
    // controls.enableZoom = false;
    // controls.enablePan = false;
    // controls.rotateSpeed = 0.5;
    // controls.target = new THREE.Vector3(half_size,half_size,half_size);

    var light = new THREE.AmbientLight( 0x444444 ); // soft white light
    scene.add( light );
    var directionalLight = new THREE.DirectionalLight( 0xffffdd, 0.9 );
    directionalLight.position.set(1,1,1);
    scene.add( directionalLight );
    var directionalLight2 = new THREE.DirectionalLight( 0xddffff, 0.5 );
    directionalLight2.position.set(-1,1,1);
    scene.add( directionalLight2 );
    var directionalLight3 = new THREE.DirectionalLight( 0xddffdd, 0.3 );
    directionalLight3.position.set(1,-1,1);
    scene.add( directionalLight3 );

    var animate = function () {
        requestAnimationFrame( animate );
       // controls.update();
        
        renderer.render(scene, camera);
    };

    animate();
}

// get log in already data
var localPlayerName = window.localStorage.getItem("playerName");
if (localPlayerName) {
    addPlayer(localPlayerName, function(response) {
        playerName = response.name;
        playerId = response.id;
    });
    playerName = localPlayerName;
    currentPlayer.textContent = localPlayerName;
    form.style.display = 'none';
} else {
    logoutForm.style.display = 'none';
}

function getLatestState() {
    if (currentGame) {
        getCurrentGame(function (game) {
            if (game.moves.length != currentGame.moves.length || game.currentPlayer != currentGame.currentPlayer) {
                currentGame = game;
                createCurrentGameVisuals(currentGame);
            }
            if (game.metaState === "victory" && clientState !== "victory") {
                victoryTheGame(game);
            }
            if (game.metaState === "waiting" && clientState !== "waiting") {
                waitTheGame(game);
            }
            if (game.metaState === "playing" && clientState !== "playing") {
                playTheGame(game);
            }
            updatePlayerTurn()
        });
    }

}

setInterval(getLatestState, 1000);


