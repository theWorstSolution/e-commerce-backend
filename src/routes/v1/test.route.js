const { getAuth } = require("firebase-admin/auth");
const firebaseApp = require("../../config/firebase");
const express = require('express');
const { authRequire } = require('../../middlewares/auth.middleware')
const { userService } = require('../../services')
const { productController } = require('../../controllers')
const router = express.Router();

/**
 * test method genRecommendedProduct
 * @param {Number} req.body.uid
 * @param {*} res 
 * @returns 
 */
const handler = function (req, res) {
    productController.genRecommendedProducts(req.body.uid)
    return res.send("hello from server");
}


// Keep track of connected clients
const clients = [];

/**
 * test notification
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const subcribeNotifications = function (req, res) {
    console.log('pipopopo');
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader("Access-Control-Allow-Origin", '*');
    res.setHeader('Content-Encoding', 'none')
    // Send initial connection confirmation
    res.write('data: Connected\n\n');

    // Add client to list of subscribers
    clients.push(res);

    // Handle client disconnect
    req.on('close', () => {
        clients.splice(clients.indexOf(res), 1);
    });
    // setInterval(function() {
    //     res.write('data: hello\n\n');
    //   }, 1000);
}


// Example route that triggers a notification
router.get('/trigger-notification', (req, res) => {
    // Logic to trigger notification
    const notificationData = { message: 'New notification!' };

    clients.forEach((client) => {
        client.write(`data: ${JSON.stringify(notificationData)}\n\n`);
    });

    res.send('Notification triggered');
});

// router.post('', authRequire, handler);
router.get('/subcribe-notifications', subcribeNotifications);
router.get('/foo', (req, res) => { res.send('hey hey') });

module.exports = router;