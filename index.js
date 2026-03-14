const { app, port } = require("./app");
const http = require('http');
const setupWebsocketServer = require("./websocket/server");

const httpServer = http.createServer(app);

setupWebsocketServer(httpServer);

httpServer.listen(port, (error) => {
    if(error) {
        console.error(error);
    }

    console.log(`StudyBuddies listening on port ${port}`)
});