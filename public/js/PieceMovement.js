
var legalMoves = {
    "king" : [
        { f: moveKing, i: 1 }
    ],
    "castle": [
        { f: moveSides, i: 5}
    ],
    "knight": [
        { f: moveKnight, i: 1}
    ],
    "pawn": [
        { f: moveSides, i: 1 }
    ],
    "bishop": [
        { f: moveEdges, i: 5}
    ],
    "queen": [
        { f: moveQueen, i: 5 }
    ],
    "unicorn": [
        { f: moveCorners, i: 5 }
    ], 
};

function getPosCopy(old) {
    var newpos = {};
    newpos.x = old.x;
    newpos.y = old.y;
    newpos.z = old.z;
    return newpos;    
}

function moveKing(input, pos, owner) {
    var moves = [];
    moveSides(input, pos, owner).forEach(function(move) {moves.push(move);});
    moveEdges(input, pos, owner).forEach(function(move) { moves.push(move);});
    moveCorners(input, pos, owner).forEach(function(move){moves.push(move);});
    return moves;
}

function moveQueen(input, pos, owner) {
    var moves = [];
    moveSides(input, pos, owner).forEach(function(move) {moves.push(move);});
    moveEdges(input, pos, owner).forEach(function(move) { moves.push(move);});
    return moves;
}

function generatePositionsFromTemplates(input, pos, owner, templateMoves) {
    var moves = [];
    var ownerPieces = getPiecesForOwner(owner);
    templateMoves.forEach(function(template_move) {
        blocked = false;
        for (var i = 1; i < (input + 1) && !blocked; i++) {
            var move = {
                x:pos.x + (template_move.x * i),
                y:pos.y + (template_move.y * i),
                z:pos.z + (template_move.z * i)
            };
            if (!isLegalMove(move, ownerPieces)) {
                blocked = true;
            } else {
                moves.push(move);
                if (isEnemyPiece(move, owner)) {
                    blocked = true;
                }
            }
        }   
    });
    return moves;
}

function moveCorners(input, pos, owner) {
    var moves = [];

    var templateMoves = [];
    templateMoves.push({
        x:1,
        y:1,
        z:1
    });
    templateMoves.push({
        x:1,
        y:1,
        z:-1
    });
    templateMoves.push({
        x:-1,
        y:1,
        z:-1
    });
    templateMoves.push({
        x:-1,
        y:1,
        z:1
    });
    templateMoves.push({
        x:1,
        y:-1,
        z:1
    });
    templateMoves.push({
        x:1,
        y:-1,
        z:-1
    });
    templateMoves.push({
        x:-1,
        y:-1,
        z:-1
    });
    templateMoves.push({
        x:-1,
        y:-1,
        z:1
    });

    return generatePositionsFromTemplates(input, pos, owner, templateMoves);
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

function moveSides(input, pos, owner) {
    var templateMoves = [];
    templateMoves.push({
        x:1,
        y:0,
        z:0
    });
    templateMoves.push({
        x:-1,
        y:0,
        z:0
    });
    templateMoves.push({
        x:0,
        y:1,
        z:0
    });
    templateMoves.push({
        x:0,
        y:-1,
        z:0
    });
    templateMoves.push({
        x:0,
        y:0,
        z:1
    });
    templateMoves.push({
        x:0,
        y:0,
        z:-1
    });
    return generatePositionsFromTemplates(input, pos, owner, templateMoves);
}

function moveEdges(input, pos, owner) {
    var ownerPieces = getPiecesForOwner(owner);
    template_moves = [];
    template_moves.push({
        x:1,
        y:1,
        z:0
    });
    template_moves.push({
        x:1,
        y:-1,
        z:0
    });
    template_moves.push({
        x:-1,
        y:-1,
        z:0
    });
    template_moves.push({
        x:-1,
        y:1,
        z:0
    });
    template_moves.push({
        x:1,
        y:0,
        z:1
    });
    template_moves.push({
        x:1,
        y:0,
        z:-1
    });
    template_moves.push({
        x:-1,
        y:0,
        z:-1
    });
    template_moves.push({
        x:-1,
        y:0,
        z:1
    });
    template_moves.push({
        x:0,
        y:1,
        z:1
    });
    template_moves.push({
        x:0,
        y:1,
        z:-1
    });
    template_moves.push({
        x:0,
        y:-1,
        z:-1
    });
    template_moves.push({
        x:0,
        y:-1,
        z:1
    });
    return generatePositionsFromTemplates(input, pos, owner, template_moves);    
}

