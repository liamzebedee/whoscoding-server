var express = require('express');
var session = require("express-session");
var bodyParser = require("body-parser");
var app = express.Router();
var r = require('rethinkdb');
var passport = require('passport');
var GitHubStrategy = require('passport-github').Strategy;

// Realtime libs.
var http = require('http').Server(app);
var io = require('socket.io')(http);

const GITHUB_CLIENT_ID = "ec26c060f860584dd8bf";
const GITHUB_CLIENT_SECRET = "ee8931e48f4e4906f9dcef55859aa347abad96ce"

passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/github/callback",
    passReqToCallback: true,
    // callbackURL: "https://hackfeed.liamz.co/auth/github/callback"
  },
  function(req, accessToken, refreshToken, profile, cb) {
    let user = {
      id: profile.id,
      profile,
      githubAuth: {
        accessToken,
        // refreshToken,
      }
    };

    r.table('users')
    .insert(user, { conflict: "update" })
    .run(req._rdbConn, null, (err, res) => {
      return cb(err, user);
    })
  }
));

passport.serializeUser(function(req, user, done) {
  console.log(user)
  done(null, user.id);
});

passport.deserializeUser(function(req, id, done) {
  console.log(id)
  r.table('users')
  .get(id)
  .run(req._rdbConn, null, (err, res) => {
    console.log(res)
    return done(err, res);
  })
});


app.use(session({
  secret: 'keyboard cat',
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());



app.get('/', (req, res) => {
  res.status(200).send("Lately - 2012 Mix/Master.")
})

app.get('/user', (req, res) => {
  res.send(req.user)
})

app.get('/auth/github',
  passport.authenticate('github'));

app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    // res.redirect('/');
    // res.send(req.user)
    res.send("<script>window.close()</script>")
  }
);


module.exports = app;
