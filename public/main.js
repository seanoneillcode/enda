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

function startDrawing(currentGame) {
    const OFFSET = -2;
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 1, 500 );

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    var geometry = new THREE.BoxGeometry( 0.8, 0.8, 0.8);
    var red_material = new THREE.MeshLambertMaterial( { color: 0xff0033 } );
    var blue_material = new THREE.MeshLambertMaterial( { color: 0x3300ff } );
    var material_line = new THREE.LineBasicMaterial({ color: 0x777777 });


    function addcube (position, material) {
        var cube = new THREE.Mesh( geometry, material );
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
        addcube({x:x,y:y,z:z}, material);
    }

    var size_x = 5;
    var size_z = 5;
    var size_y = 5;
    var unit = 1;
    for (var z_index = 0; z_index < size_z; z_index++) {
        for (var index = 0; index < size_x; index++) {
            addline({
                    x:size_x - 1 + OFFSET,
                    y:(index * unit) + OFFSET,
                    z:(z_index * unit) + OFFSET
                },{
                    x:OFFSET,
                    y:(index * unit) + OFFSET,
                    z:(z_index * unit) + OFFSET
                },scene);
        }
    }
    for (var z_index = 0; z_index < size_z; z_index++) {
        for (var index = 0; index < size_x; index++) {
            addline({
                    x:(index * unit) + OFFSET,
                    y:size_y - 1 + OFFSET,
                    z:(z_index * unit) + OFFSET
                },{
                    x:(index * unit) + OFFSET,
                    y:OFFSET,
                    z:(z_index * unit) + OFFSET
                },scene);
        }
    }

    addline({x:10,y:0,z:0},{x:0,y:0,z:0},scene);
    addline({x:0,y:10,z:0},{x:0,y:0,z:0},scene);
    addline({x:0,y:0,z:10},{x:0,y:0,z:0},scene);

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
