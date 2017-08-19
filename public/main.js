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

var lastSelected;
var localPieces = [];

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

function pickMouse() {
    raycaster.setFromCamera( mouse, camera );
    var intersects = raycaster.intersectObjects( scene.children );
    if ( intersects.length > 0 ) {
        if ( lastSelected != intersects[ 0 ].object ) {
            if ( lastSelected ) {
                var localPiece = getLocalPieceFromObject(lastSelected);
                localPiece.selected = false;
            }
            lastSelected = intersects[ 0 ].object;
            var localPiece = getLocalPieceFromObject(lastSelected);
            localPiece.selected = false;
        }
    } else {
        if ( lastSelected ) {
            var localPiece = getLocalPieceFromObject(lastSelected);
            localPiece.selected = false;
        }
        lastSelected = null;
    }
}

function getLocalPieceFromObject(object) {
    console.log("get local");
    console.log(object);
    return localPieces.filter(function(piece) {
            console.log(piece);
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
    const OFFSET = -2;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 1, 500 );

    renderer = new THREE.WebGLRenderer();
    raycaster = new THREE.Raycaster();;
    
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );

    window.addEventListener( 'resize', onWindowResize, false );

    var geometry = new THREE.BoxGeometry( 0.8, 0.8, 0.8);
    var small_geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2);
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

    var x_size = 5;
    var y_size = 5;
    var z_size = 5;
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
    var directionalLight = new THREE.DirectionalLight( 0x0000ff, 0.8 );
    directionalLight.position.set(1,1,0);
    scene.add( directionalLight );
    var directionalLight2 = new THREE.DirectionalLight( 0xff0000, 0.8 );
    directionalLight2.position.set(0,1,1);
    scene.add( directionalLight2 );

    var animate = function () {
        requestAnimationFrame( animate );
        controls.update();
        localPieces.forEach (function(localPiece) {
            if (localPiece.selected) {
                localPiece.material = selected_material;
            } else {
                if (localPiece.piece.owner == "player_one") {
                    localPiece.material = red_material;
                } else {
                    localPiece.material = blue_material;
                }
            }
        });
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
