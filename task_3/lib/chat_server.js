const http = require("http");
const nodeStatic = require("node-static");
const path = require("path");
const ws = require("ws");

var field = {}
var current_turn = null

function idByIndex(i, j) {
    return i.toString() + "_" + j.toString()
}

function newGame() {
    for (var i = 0; i < 10; i++) {
        for (var j = 0; j < 10; j++) {
            field[idByIndex(i, j)] = "";
        }
    }
}

function getWinner() {
    shifts = []
    shifts.push([[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]])
    shifts.push([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]])
    shifts.push([[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]])
    shifts.push([[0, 0], [1, -1], [2, -2], [3, -3], [4, -4]])
    for (var i = 0; i < 10; i++) {
        for (var j = 0; j < 10; j++) {
            current = field[idByIndex(i, j)]
            if (current !== "") {
                for (var shift = 0; shift < shifts.length; shift++) {
                    var items = getShiftItems(i, j, shifts[shift])
                    if (items.length == 5 && items.every(
                        function (currentValue, index, array) {
                            return currentValue === current
                        })) {
                        return current
                    }
                }
            }
        }
    }
    return null
}

function getShiftItems(c_i, c_j, shifts) {
    result = []
    for (var i=0; i<shifts.length; i++) {
        var s_i = c_i + shifts[i][0]
        var s_j = c_j + shifts[i][1]
        if (s_i < 10 && s_j < 10) {
            result.push(field[idByIndex(s_i, s_j)])
        }
    }
    return result
}

function requestHandler(request, response) {
    var path = request.url;
    console.log("Requested " + path);
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write("Hello!\n");
    response.end();
}

function handleWsConnection(clientWebSocket) {
    const allClients = this.clients;
    if (current_turn == null) {
        current_turn = allClients.indexOf(clientWebSocket);
    }
    console.log("Connected some client via web socket");
    newGame()
    sendData(allClients)
    clientWebSocket.on('message', function (messageData) {
        var data = JSON.parse(messageData)
        processTurn(data.client_id, data.cell, allClients)
    });
}

function processTurn(client_id, cell, allClients) {
    if (current_turn != client_id) 
        return
    field[cell] = client_id
    winner = getWinner()
    console.log(winner)
    if (winner != null) {
        current_turn = 0
        newGame()
    }
    else {
        current_turn += 1
        if (current_turn >= allClients.length)
            current_turn = 0
    }
    sendData(allClients, winner)
}

function sendData(allClients, winner=null) {
    for (var i=0; i<allClients.length; ++i) {
        var msg = "You - " + i.toString() + "\n"
        if (winner === null) {
            msg += "Current turn - " + current_turn.toString()
        }
        else {
            msg += "WINNER - " + winner.toString()
        }
        allClients[i].send(JSON.stringify({field: field, msg: msg, client_id: i}));
    }
}

function startService(port) {
    const contentsRoot = path.resolve(__dirname, "../public");
    const staticHandler = new (nodeStatic.Server)(contentsRoot);
    const httpServer = http.createServer(function (req, resp) {
        /* Here might be some condition to decide how to serve request ... */
        req.addListener("end", function () {
            staticHandler.serve(req, resp);
        }).resume();
    });
    httpServer.listen(port);
    const wserver = ws.createServer({
        server: httpServer,
        path: "/ws"
    });
    wserver.on('connection', handleWsConnection);
}

exports.start = startService;
