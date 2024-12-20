import connectDB from './config/database';
import bodyParser from "body-parser";
import express from "express";
import dotenv from "dotenv";
import helmet from 'helmet';
import cors from 'cors';

import { EventEmitter } from 'events';

import { initBlockchainClientWS } from "./config/web3";
import { createWebSocketServer } from './ws';

import createCommentRouter from './routes/comment.route';

import { watchFunCreationEvents } from "./ws/blockchain/create-fun";
import { watchTradeCallEvents } from './ws/blockchain/trade-call';
import { watchPumpEmpororEvents } from './ws/blockchain/pump-emperor';
import { watchMigrationEvents } from './ws/blockchain/migration';

dotenv.config();

const expressWs = require('express-ws')(express());
const app = expressWs.app;

const port = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(helmet());
app.use(cors());

const emitter = new EventEmitter();

const wsBlockchainClient = initBlockchainClientWS();
const wsServer = createWebSocketServer();

emitter.on('funCreated', event => {
    wsServer.broadcastFunCreated({ type: 'funCreated', data: event });
});

emitter.on('tradeCall', event => {
    wsServer.broadcastTradeCall({ type: 'tradeCall', data: event });
});

emitter.on('commentCreated', event => {
    wsServer.broadcastCommentCreated({ type: 'commentCreated', data: event });
});

emitter.on('candle1MUpdated', event => {
    wsServer.broadcastCandle1MUpdated({ type: 'candle1M', data: event });
});

const startWatchers = async () => {
    let funCreationWatcher: any = null;
    let tradeCallWatcher: any = null;
    let pumpEmperorWatcher: any = null;
    let migrationWatcher: any = null;

    const startFunCreationWatcher = async () => {
        try {
            funCreationWatcher = await watchFunCreationEvents(
                wsBlockchainClient,
                emitter
            );
            console.log('FunCreation watcher started');
        } catch (error) {
            console.error('Error starting FunCreation watcher:', error);
            setTimeout(startFunCreationWatcher, 5000);
        }
    };

    const startTradeCallWatcher = async () => {
        try {
            tradeCallWatcher = await watchTradeCallEvents(
                wsBlockchainClient,
                emitter
            );
            console.log('TradeCall watcher started');
        } catch (error) {
            console.error('Error starting TradeCall watcher:', error);
            setTimeout(startTradeCallWatcher, 5000);
        }
    };

    const startPumpEmperorWatcher = async () => {
        try {
            pumpEmperorWatcher = await watchPumpEmpororEvents(
                wsBlockchainClient
            );
            console.log('PumpEmperor watcher started');
        } catch (error) {
            console.error('Error starting PumpEmperor watcher:', error);
            setTimeout(startPumpEmperorWatcher, 5000);
        }
    }

    const startMigrationWatcher = async () => {
        try {
            migrationWatcher = await watchMigrationEvents(
                wsBlockchainClient
            );
            console.log('Migration watcher started');
        } catch (error) {
            console.error('Error starting Migration watcher:', error);
            setTimeout(startMigrationWatcher, 5000);
        }
    }

    await startFunCreationWatcher();
    await startTradeCallWatcher();
    await startPumpEmperorWatcher();
    await startMigrationWatcher();

    const interval = setInterval(() => {
        if (!funCreationWatcher) {
            console.log('FunCreation watcher down, restarting...');
            startFunCreationWatcher();
        }
        if (!tradeCallWatcher) {
            console.log('TradeCall watcher down, restarting...');
            startTradeCallWatcher();
        }
        if (!pumpEmperorWatcher) {
            console.log('PumpEmperor watcher down, restarting...');
            startPumpEmperorWatcher();
        }
        if (!migrationWatcher) {
            console.log('Migration watcher down, restarting...');
            startMigrationWatcher();
        }
    }, 30000);

    app.ws("/ws/create-fun", (ws: any) => {
        try {
            wsServer.addTokenClient(ws);
        } catch (error) {
            console.error('Error handling create-fun connection:', error);
        }
    });

    app.ws("/ws/trade-call", (ws: any) => {
        try {
            wsServer.addTradeClient(ws);
        } catch (error) {
            console.error('Error handling trade-call connection:', error);
        }
    });

    app.ws("/ws/comment-created", (ws: any) => {
        try {
            wsServer.addReplyClient(ws);
        } catch (error) {
            console.error('Error handling reply-call connection:', error);
        }
    });

    app.ws("/ws/candle-1m", (ws: any) => {
        try {
            wsServer.addcandle1MClient(ws);
        } catch (error) {
            console.error('Error handling candle-1m connection:', error);
        }
    });

    return () => {
        clearInterval(interval);
        if (funCreationWatcher) funCreationWatcher();
        if (tradeCallWatcher) tradeCallWatcher();
        if (pumpEmperorWatcher) pumpEmperorWatcher();
        if (migrationWatcher) migrationWatcher();
    };
};


const startServer = async () => {
    try {
        await connectDB();

        const auth = require("./routes/auth.route").default;
        const user = require("./routes/user.route").default;
        const token = require("./routes/token.route").default;
        const comment = createCommentRouter(emitter);
        const trade = require("./routes/trade.route").default;
        const candle = require("./routes/candle.route").default;
        /// const test = require("./routes/test.route").default;

        app.use("/auth", auth);
        app.use("/user", user);
        app.use("/token", token);
        app.use("/comment", comment);
        app.use("/trade", trade);
        app.use("/candle", candle);
        /// app.use("/test", test);

        const cleanup = await startWatchers();

        process.on('SIGINT', async () => {
            console.log('Shutting down watchers...');
            cleanup();
            process.exit(0);
        });

        app.listen(port, "0.0.0.0", () => {
            console.log('Server running on port', port);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();