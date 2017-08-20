var todoList = document.getElementById("todo-list");
var form = document.getElementById("login-form");
var joinForm = document.getElementById("join-form");
var logoutForm = document.getElementById("logout-form");
var todoTitle = document.getElementById("new-todo");
var currentPlayer = document.getElementById("current-player");
var error = document.getElementById("error");

var playerName;
var playerId;
var currentGame;

var mouse = new THREE.Vector2(), INTERSECTED;
var camera, renderer, scene, raycaster;
var mouseDownLock = false;
var dirtyRender = true;

var lastSelected;
var localPieces = [];
var visibleMoves = [];
var move_material = new THREE.MeshLambertMaterial( { color: 0x00ff00 } );
var geometry = new THREE.BoxGeometry( 0.9, 0.8, 0.9);
var move_geometry = new THREE.BoxGeometry( 0.8, 0.9, 0.8);
const OFFSET = -2;
var x_size = 5;
var y_size = 5;
var z_size = 5;


function moveSingleScalar(i, pos) {
    var moves = [];
    moves.push({
        x:pos.x + i,
        y:pos.y,
        z:pos.z
    });
    moves.push({
        x:pos.x,
        y:pos.y + i,
        z:pos.z
    });
    moves.push({
        x:pos.x,
        y:pos.y,
        z:pos.z + i
    });
    moves.push({
        x: pos.x -i,
        y:pos.y,
        z:pos.z
    });
    moves.push({
        x:pos.x,
        y:pos.y - i,
        z:pos.z
    });
    moves.push({
        x:pos.x,
        y:pos.y,
        z:pos.z - i
    });
    return moves;
}

function isLegalMove(actualMove, owner) {
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
    var ownerPieces = getPiecesForOwner(owner);
    ownerPieces.forEach(function(ownerPiece) {
        if (isEqualPos(ownerPiece.piece.pos, actualMove)) {
            isLegal = false;
        }
    });
    return isLegal;
}

function moveRangeScalar(input, pos, owner) {
    var moves = [];
    var blocked = false
    for (var i = pos.x + 1; i <= 5 && !blocked; i++) {
        var p = {
            x:i,
            y:pos.y,
            z:pos.z
        };
        if (!isLegalMove(p, owner)) {
            blocked = true;
        } else {
            moves.push(p);
        }
    }
    var blocked = false
    for (var i = pos.y + 1; i <= 5 && !blocked; i++) {
        var p = {
            x:pos.x,
            y:i,
            z:pos.z
        };
        if (!isLegalMove(p, owner)) {
            blocked = true;
        } else {
            moves.push(p);
        }
    }
    var blocked = false
    for (var i = pos.z + 1; i <= 5 && !blocked; i++) {
        var p = {
            x:pos.x,
            y:pos.y,
            z:i
        };
        if (!isLegalMove(p, owner)) {
            blocked = true;
        } else {
            moves.push(p);
        }
    }
    blocked = false;
    for (var i = pos.x - 1; i >= 0 && !blocked; i--) {
        var p = {
            x:i,
            y:pos.y,
            z:pos.z
        };
        if (!isLegalMove(p, owner)) {
            blocked = true;
        } else {
            moves.push(p);
        }
    }
    blocked = false;
    for (var i = pos.y - 1; i >= 0 && !blocked; i--) {
        var p = {
            x:pos.x,
            y:i,
            z:pos.z
        };
        if (!isLegalMove(p, owner)) {
            blocked = true;
        } else {
            moves.push(p);
        }
    }
    blocked = false;
    for (var i = pos.z - 1; i >= 0 && !blocked; i--) {
        var p = {
            x:pos.x,
            y:pos.y,
            z:i
        };
        if (!isLegalMove(p, owner)) {
            blocked = true;
        } else {
            moves.push(p);
        }
    }
    return moves;
}

var legalMoves = {
    "king" : [],
    "castle": [
        { f: moveRangeScalar, i: 1}
    ],
    "knight": [],
    "pawn": [
        { f: moveSingleScalar, i: 1 }
    ]
};

form.onsubmit = function(event) {
    var name = todoTitle.value;
    addPlayer(name, function(response) {
        console.log(response);
        playerName = response.name;
        playerId = response.id;
        window.localStorage.setItem('playerName', playerName);
    });
    todoTitle.value = "";
    playerName = name;
    currentPlayer.textContent = name;
    form.style.display = 'none';
    logoutForm.style.display = 'block';
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
    form.style.display = 'block';
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

function getTodoList(callback) {
    var createRequest = new XMLHttpRequest();
    createRequest.open("GET", "/api/todo");
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
            console.log(this.responseText);

            callback(JSON.parse(this.responseText));
        } else {
            error.textContent = "Failed to get list. Server returned " + this.status + " - " + this.responseText;
        }
    };
    createRequest.send();
}

function reloadTodoList() {
    while (todoList.firstChild) {
        todoList.removeChild(todoList.firstChild);
    }
    todoListPlaceholder.style.display = "block";
    getTodoList(function(todos) {
        todoListPlaceholder.style.display = "none";
        todos.forEach(function(todo) {
            var listItem = document.createElement("li");
            listItem.textContent = todo.title;
            todoList.appendChild(listItem);
        });
    });
}

function addMoveCube (position) {
    var cube = new THREE.Mesh( move_geometry, move_material );
    cube.position.set(position.x + OFFSET,position.y + OFFSET,position.z + OFFSET);
    scene.add( cube );
    return cube;
}

function isEqualPos(a, b) {
    return a.x == b.x && a.y == b.y && a.z == b.z;
}

function getPiecesForOwner(owner) {
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
    abstractMoves.forEach(function(abstractMove) {
        var f = abstractMove.f;
        var input = abstractMove.i;
        var potentialMoves = f.apply(this, [input, currentPos, piece.owner]);
        console.log(potentialMoves);
        potentialMoves.forEach(function(potentialMove) {
            console.log(currentPos, potentialMove);
            var actualMove = potentialMove;
            if (isLegalMove(actualMove, piece.owner)) {
                moves.push(actualMove);
            }
        });
    });
    return moves;
}

function clearVisibleMoves() {
    visibleMoves.forEach(function(move) {
        scene.remove(move.obj);
    });
    visibleMoves = [];
}

function pickMouse() {
    dirtyRender = true;
    var localPiece;
    if ( lastSelected ) {
        lastSelected.selected = false;
        lastSelected = null;
    }
    raycaster.setFromCamera( mouse, camera );
    var intersects = raycaster.intersectObjects( scene.children );
    if ( intersects.length > 0 ) {
        intersectedObject = intersects[ 0 ].object;
        lastSelected = getLocalPieceFromObject(intersectedObject);
        if (lastSelected) {
            lastSelected.selected = true;
        }
    }
    clearVisibleMoves();
    if (lastSelected) {
        var moves = generateMoves(lastSelected.piece);
        moves.forEach(function(move) {
            // todo if move ends up on emeny - dont add a cube, add something special to indicate
            var cube = addMoveCube(move);
            visibleMoves.push({
                obj: cube,
                pos: move
            });
        });
    }
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
    event.preventDefault();
}
function onDocumentMouseDown( event ) {
    if (mouseDownLock) {
        return;
    }
    mouseDownLock = true;
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    pickMouse();
}

function startDrawing(currentGame) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 1, 500 );

    renderer = new THREE.WebGLRenderer();
    raycaster = new THREE.Raycaster();;
    
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );

    window.addEventListener( 'resize', onWindowResize, false );

    
    var small_geometry = new THREE.BoxGeometry( 0.1, 0.1, 0.1);
    var red_material = new THREE.MeshLambertMaterial( { color: 0xff0033 } );
    var blue_material = new THREE.MeshLambertMaterial( { color: 0x3300ff } );
    var selected_material = new THREE.MeshLambertMaterial( { color: 0xffffff } );
    var small_material = new THREE.MeshLambertMaterial( { color: 0x888888 } );
    var material_line = new THREE.LineBasicMaterial({ color: 0x777777 });


    function addcube (position, material) {
        var cube = new THREE.Mesh( geometry, material );
        cube.position.set(position.x + OFFSET,position.y + OFFSET,position.z + OFFSET);
        scene.add( cube );
        return cube;
    }

    function addpositioncube (position) {
        var cube = new THREE.Mesh( small_geometry, small_material );
        cube.position.set(position.x + OFFSET,position.y + OFFSET,position.z + OFFSET);
        scene.add( cube );
    }

    function addline (from, to, scene) {
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(from.x, from.y, from.z));
        geometry.vertices.push(new THREE.Vector3(to.x, to.y, to.z));
        var line = new THREE.Line(geometry, material_line);
        scene.add( line );
    }

    for (var i = currentGame.pieces.length - 1; i >= 0; i--) {
        var currentPiece = currentGame.pieces[i];
        var x = currentPiece.pos.x;
        var y = currentPiece.pos.y;
        var z = currentPiece.pos.z;
        var material = currentPiece.owner == "player_one" ? red_material : blue_material;
        var obj = addcube({x:x,y:y,z:z}, material);
        localPieces.push({
            obj : obj,
            piece : currentPiece,
            selected: false
        });
    }

    var unit = 1;
    for (var x_index = 0; x_index < x_size; x_index++) {
        for (var y_index = 0; y_index < y_size; y_index++) {
            for (var z_index = 0; z_index < z_size; z_index++) {
                addpositioncube({x:x_index,y:y_index,z:z_index})
            }       
        }
    }

    camera.position.set(0, 0, 10);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = false;

    var light = new THREE.AmbientLight( 0x777777 ); // soft white light
    scene.add( light );
    var directionalLight = new THREE.DirectionalLight( 0x4488ff, 0.8 );
    directionalLight.position.set(1,1,0);
    scene.add( directionalLight );
    var directionalLight2 = new THREE.DirectionalLight( 0xff8844, 0.8 );
    directionalLight2.position.set(0,1,1);
    scene.add( directionalLight2 );

    var animate = function () {
        requestAnimationFrame( animate );
        controls.update();
        if (dirtyRender) {
            localPieces.forEach (function(localPiece) {
                if (localPiece.selected) {
                    localPiece.obj.material = selected_material;
                } else {
                    if (localPiece.piece.owner == "player_one") {
                        localPiece.obj.material = red_material;
                    } else {
                        localPiece.obj.material = blue_material;
                    }
                }
            });
            dirtyRender = false;
        }
        renderer.render(scene, camera);
    };

    animate();
}

// get log in already data
var localPlayerName = window.localStorage.getItem("playerName");
if (localPlayerName) {
    addPlayer(localPlayerName, function(response) {
        console.log(response);
        playerName = response.name;
        playerId = response.id;
    });
    playerName = localPlayerName;
    currentPlayer.textContent = localPlayerName;
    form.style.display = 'none';
} else {
    logoutForm.style.display = 'none';
}
