const express = require('express');
const app = express();
const port = 3009;

const { createHandler } = require('graphql-http/lib/use/http');
const schema = require('./graphql/schema');

const jwtMiddleware = require("./middlewares/jwtMiddleware");

// NOTE: don't parse JSON body here — graphql-http's handler reads the raw stream.

const graphQLHandler = createHandler({
    schema,
    context: (request) => {
        return {
            user: request.raw.userData,
        }
    }
});

app.post('/graphql', jwtMiddleware, graphQLHandler);

module.exports = {
    app,
    port,
};

// when this file is executed directly, start the HTTP and websocket server
if (require.main === module) {
    const http = require('http');
    const setupWebsocketServer = require('./websocket/server');

    const httpServer = http.createServer(app);
    setupWebsocketServer(httpServer);

    httpServer.listen(port, (error) => {
        if (error) console.error(error);
        console.log(`StudyBuddies listening on port ${port}`);
    });
}