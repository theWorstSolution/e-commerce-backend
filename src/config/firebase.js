const { initializeApp } = require('firebase-admin/app');

const firebaseApp = initializeApp({
    apiKey: "AIzaSyCZAE4fCekKtBqen0-opldxPmKgdbUhnxU",
    authDomain: "thanhproj-63169.firebaseapp.com",
    databaseURL: "https://thanhproj-63169-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "thanhproj-63169",
    storageBucket: "thanhproj-63169.appspot.com",
    messagingSenderId: "1072415708662",
    appId: "1:1072415708662:web:20d8e679716dea28b823d7",
    measurementId: "G-KCQ60358DL"
});

module.exports = firebaseApp;
