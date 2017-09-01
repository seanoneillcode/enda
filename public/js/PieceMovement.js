
var legalMoves = {
    "king" : [
        { f: moveSingleScalar, i: 1 }
    ],
    "castle": [
        { f: moveRangeScalar, i: 1}
    ],
    "knight": [
        { f: moveKnight, i: 1}
    ],
    "pawn": [
        { f: moveSingleScalar, i: 1 }
    ]
};

function getPosCopy(old) {
    var newpos = {};
    newpos.x = old.x;
    newpos.y = old.y;
    newpos.z = old.z;
    return newpos;    
}

function moveKnight(input, pos, owner) {
    var moves = [];
    var dims = ['x', 'y', 'z'];
    var dindex = 0;
    // rotate through dims
    for (dindex = 0; dindex < 3; dindex++) {
        var current_dim = dims[dindex];
        dims
            .filter(function(dim) {
                return dim !== current_dim;
            })
            .forEach(function(odim) {
                var first = getPosCopy(pos);
                first[current_dim] = pos[current_dim] + 2;
                first[odim] = pos[odim] + 1;
                moves.push(first);
                first = getPosCopy(pos);
                first[current_dim] = pos[current_dim] + 2;
                first[odim] = pos[odim] - 1;
                moves.push(first);
                first = getPosCopy(pos);
                first[current_dim] = pos[current_dim] - 2;
                first[odim] = pos[odim] + 1;
                moves.push(first);
                first = getPosCopy(pos);
                first[current_dim] = pos[current_dim] - 2;
                first[odim] = pos[odim] - 1;
                moves.push(first);
            });
    };
    return moves;
}

function moveRangeScalar(input, pos, owner) {
    var moves = [];
    var blocked = false
    var ownerPieces = getPiecesForOwner(owner);
    for (var i = pos.x + 1; i <= 4 && !blocked; i++) {
        var p = {
            x:i,
            y:pos.y,
            z:pos.z
        };
        if (!isLegalMove(p, ownerPieces)) {
            blocked = true;
        } else {
            moves.push(p);                
            if (isEnemyPiece(p, owner)) {
                blocked = true;
            }
        }
    }
    var blocked = false
    for (var i = pos.y + 1; i <= 4 && !blocked; i++) {
        var p = {
            x:pos.x,
            y:i,
            z:pos.z
        };
        if (!isLegalMove(p, ownerPieces)) {
            blocked = true;
        } else {
            moves.push(p);
            if (isEnemyPiece(p, owner)) {
                blocked = true;
            }
        }
    }
    var blocked = false
    for (var i = pos.z + 1; i <= 4 && !blocked; i++) {
        var p = {
            x:pos.x,
            y:pos.y,
            z:i
        };
        if (!isLegalMove(p, ownerPieces)) {
            blocked = true;
        } else {
            moves.push(p);
            if (isEnemyPiece(p, owner)) {
                blocked = true;
            }
        }
    }
    blocked = false;
    for (var i = pos.x - 1; i >= 0 && !blocked; i--) {
        var p = {
            x:i,
            y:pos.y,
            z:pos.z
        };
        if (!isLegalMove(p, ownerPieces)) {
            blocked = true;
        } else {
            moves.push(p);
            if (isEnemyPiece(p, owner)) {
                blocked = true;
            }
        }
    }
    blocked = false;
    for (var i = pos.y - 1; i >= 0 && !blocked; i--) {
        var p = {
            x:pos.x,
            y:i,
            z:pos.z
        };
        if (!isLegalMove(p, ownerPieces)) {
            blocked = true;
        } else {
            moves.push(p);
            if (isEnemyPiece(p, owner)) {
                blocked = true;
            }
        }
    }
    blocked = false;
    for (var i = pos.z - 1; i >= 0 && !blocked; i--) {
        var p = {
            x:pos.x,
            y:pos.y,
            z:i
        };
        if (!isLegalMove(p, ownerPieces)) {
            blocked = true;
        } else {
            moves.push(p);
            if (isEnemyPiece(p, owner)) {
                blocked = true;
            }
        }
    }
    return moves;
}

function moveSingleDiagonal(input, pos, owner) {
    var moves = [];

    moves.push({
        x:pos.x + input,
        y:pos.y + input,
        z:pos.z
    });
    moves.push({
        x:pos.x + input,
        y:pos.y - input,
        z:pos.z
    });
    moves.push({
        x:pos.x - input,
        y:pos.y - input,
        z:pos.z
    });
    moves.push({
        x:pos.x - input,
        y:pos.y + input,
        z:pos.z
    });
    moves.push({
        x:pos.x + input,
        y:pos.y,
        z:pos.z + input
    });
    moves.push({
        x:pos.x + input,
        y:pos.y,
        z:pos.z - input
    });
    moves.push({
        x:pos.x - input,
        y:pos.y,
        z:pos.z - input
    });
    moves.push({
        x:pos.x - input,
        y:pos.y,
        z:pos.z + input
    });

    moves.push({
        x:pos.x,
        y:pos.y + input,
        z:pos.z + input
    });
    moves.push({
        x:pos.x,
        y:pos.y + input,
        z:pos.z - input
    });
    moves.push({
        x:pos.x,
        y:pos.y - input,
        z:pos.z - input
    });
    moves.push({
        x:pos.x,
        y:pos.y - input,
        z:pos.z + input
    });
    return moves;    
}

function moveThreeDiagonal(input, pos, owner) {
    var moves = [];

    for (var i = 0; i < input; i++) {
        moves.push({
            x:pos.x + i,
            y:pos.y + i,
            z:pos.z + i
        });
        moves.push({
            x:pos.x - i,
            y:pos.y - i,
            z:pos.z - i
        });
        moves.push({
            x:pos.x + i,
            y:pos.y - i,
            z:pos.z + i
        });
        moves.push({
            x:pos.x - i,
            y:pos.y + i,
            z:pos.z + i
        });
        moves.push({
            x:pos.x + i,
            y:pos.y + i,
            z:pos.z - i
        });
        moves.push({
            x:pos.x - i,
            y:pos.y - i,
            z:pos.z + i
        });
        moves.push({
            x:pos.x + i,
            y:pos.y - i,
            z:pos.z - i
        });
        moves.push({
            x:pos.x - i,
            y:pos.y + i,
            z:pos.z - i
        });
    }


    return moves;
}

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
