let passport = require('passport');
let SpotifyStrategy = require('passport-spotify').Strategy;
const dotenv = require("dotenv");
const User = require('../models/user')

dotenv.config();
passport.use(
    new SpotifyStrategy(
        {
            clientID: process.env.SPOTIFY_CLIENTID,
            clientSecret: process.env.SPOTIFY_CLIENTSECRET,
            callbackURL: process.env.SPOTIFY_CALLBACKURL
        },
        async (accessToken, refreshToken, profile, done) => {
            User.findOne({ id: profile.id })
                .then((user) => {
                    if (user) {
                        console.log(`User ${user.id} logged in!`)
                        // Model.findOneAndUpdate(query, { name: 'jason bourne' }
                        user.access_token = accessToken;
                        user.refresh_token = refreshToken;
                        user.save()
                        done(null, user);

                    } else {
                        console.log("Creating new User")
                        new User({
                            username: profile.username,
                            id: profile.id,
                            followers: profile.followers,
                            profileUrl: profile.profileUrl,
                            access_token: accessToken,
                            refresh_token: refreshToken
                        }).save().then((user) => {
                            console.log(`new user created ${user}`)
                            done(null, user);
                        })
                    }
                })
        }
    ));
