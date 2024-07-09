const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const WebSocket = require('ws');
const { productController } = require('./controllers');

// Initialize WebSocket server
// const wss = new WebSocket.Server({ noServer: true }); // Create a WebSocket server without directly attaching it to a server

// wss.on('connection', (ws) => {
//   console.log('Client connected');
//   console.log(ws);
//   ws.onmessage = (event) => {
//     const message = event.data.toString('utf-8'); // Convert the buffer to a string
//     console.log('Received:', message);
//   };

//   ws.send('Connected to WebSocket server');
// });



let server;
console.log(config.mongoose.url);
mongoose.connect(config.mongoose.url, config.mongoose.options).then(async () => {
  logger.info('Connected to MongoDB');
  // await productController.genSimilarProduct();
  server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
  // Upgrade HTTP server to support WebSocket connections
  // server.on('upgrade', (request, socket, head) => {
  //   wss.handleUpgrade(request, socket, head, (ws) => {
  //     wss.emit('connection', ws, request);
  //   });
  // });
});




const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});

// server = app.listen(config.port, () => {
//   logger.info(`Listening to port ${config.port}`);
// });
