const http = require("http");
const nodeStatic = require("node-static");
const path = require("path");

/* This function not required anymode,
 since we use node-static
 */
function requestHandler(request, response) {
    var path = request.url;
    console.log("Requested " + path);
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write("Hello!\n");
    response.end();
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
}

exports.start = startService;
