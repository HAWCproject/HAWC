const ws = require('./scripts/WebServer.js');
const ss = require('./scripts/SocketServer.js');

var socketServer = new ss();
socketServer.startServer();

var webServer = new ws(socketServer);
webServer.startServer();
