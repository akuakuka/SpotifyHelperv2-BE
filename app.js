const express = require("express");
const app = express();
const PORT = 3001;
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const axios = require("axios");
const bodyParser = require('body-parser')
const config = require("./config/spotify");
const passport = require("passport");
const session = require('express-session');
const spotifyRouter = require('./controllers/spotify')
const cors = require('cors')
const morgan = require('morgan')
const SpotifyWebApi    = require('spotify-web-api-node')
const MongoDBStore = require('connect-mongodb-session')(session);
dotenv.config()
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));

var scopes = ['user-read-recently-played',
    'user-library-modify',
    'user-read-email',
    'user-library-read',
    'user-read-playback-state',
    'user-read-private',
    'user-follow-read',
    'user-top-read',
    'user-follow-modify']
    var store = new MongoDBStore({
        uri: process.env.MONGODBURL,
        collection: 'mySessions'
      });
      store.on('error', function(error) {
        console.log("mongoSessionStoreError");
      });

    app.use(morgan('tiny'))
app.use(session({
    secret: process.env.SESSIONSECRET,
    store: store,
    saveUninitialized: true,
    resave: true
}));


app.use(bodyParser.json({limit: '10mb', extended: true}))
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}))
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
 
    done(null, user);
});
const ensureAuthenticated = async (req, res, next) => {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/')
}
mongoose
    .connect(process.env.MONGODBURL, { useNewUrlParser: true })
    .then(() => {
        console.log("Mongoose connected!");
    })
    .catch(e => {
        console.log("Mongoose connect error!");
       
    });

app.get('/', (req, res) => {
    let authurl =  `<a href="http://localhost:3001/auth/spotify">LOGIN  </a>`
    res.send(authurl)
})

app.use('/api/spotify', ensureAuthenticated, spotifyRouter);
app.get('/auth/spotify', passport.authenticate('spotify', {
    scope: scopes,
    showDialog: true
}), (req, res) => {

});

app.get('/', ensureAuthenticated, (req,res) => {
  
    res.send("AUTHENTIC")
}) 
app.get(
    '/auth/spotify/callback',
    passport.authenticate('spotify', {
        failureRedirect: '/',
        scope: scopes,
    }), async (req, res) => {
        res.redirect("http://localhost:3000/");
    }
);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("http://localhost:3001/auth/spotify")
});

