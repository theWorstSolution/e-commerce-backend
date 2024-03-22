const { getAuth } = require("firebase-admin/auth");
const firebaseApp = require("../../config/firebase");
const express = require('express');
const {authRequire} = require('../../middlewares/auth.middleware')
const {userService} = require('../../services')
const router = express.Router();

const handler = function (req, res) {
    console.log(req.body);
    userService.createUser({uid: 'fakeuid'})
    // const token = req.headers['x-access-token'];
    // console.log(token)
    // // idToken comes from the client app
    // getAuth(firebaseApp)
    //     .verifyIdToken(token)
    //     .then((decodedToken) => {
    //         const uid = decodedToken.uid;
    //         console.log(decodedToken)
    //         // ...
    //     })
    //     .catch((error) => {
    //         // Handle error
    //     });
    return res.send("hello from server");
}
// router.post('', authRequire, handler);
router.post('', handler);

module.exports = router;