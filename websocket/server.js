const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/use/ws');
const schema = require('../graphql/schema');

const setupWebsocketServer = (httpServer) => {
    const wsServer = new WebSocketServer({
        server: httpServer,
        path: '/graphql'
    });

    useServer(
        {
            schema,
            onConnect: async (ctx) => {
                console.log('Websocket connection established');
                return true;
            },
            onDisconnect: async (ctx) => {
                console.log('Websocket connection dropped');
                return true;
            }
        },
        wsServer
    );

    return wsServer;
}

module.exports = setupWebsocketServer;