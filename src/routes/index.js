var express = require('express');
var session = require('express-session');
var bodyParser = require("body-parser");
var router = express.Router();
var r = require('rethinkdb');

// Auth
var passport = require('passport');
var MainAuthStrategy = require('passport-github').Strategy;
if(process.env.NODE_ENV === 'test') {
  MainAuthStrategy = require('passport-mocked').Strategy;
}

var LocalStrategy = require('passport-local').Strategy;
var crypto = require('crypto');


const GITHUB_CLIENT_ID = "ec26c060f860584dd8bf";
const GITHUB_CLIENT_SECRET = "ee8931e48f4e4906f9dcef55859aa347abad96ce";
var GITHUB_CALLBACK_URL = "http://0.0.0.0:3000/auth/github/callback";
if(process.env.NODE_ENV === 'production') {
  GITHUB_CALLBACK_URL = "https://hackfeed.liamz.co/auth/github/callback";
}

passport.use(new MainAuthStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: GITHUB_CALLBACK_URL,
    passReqToCallback: true,
  },
  function(req, accessToken, refreshToken, profile, cb) {
    if(!profile.id) return cb(new Error("no id found from OAuth handshake. can't setup user"), null)
    
    let user = {
      id: profile.id,
      profile,
      githubAuth: {
        accessToken,
        // refreshToken,
      },
      clientPassword: crypto.randomBytes(128).toString('hex'),
      
      statuses: [],
    };

    r.table('users')
    .insert(user, { conflict: "update" })
    .run(req._rdbConn, (err, res) => {
      return cb(err, user);
    })
  }
));

passport.use(new LocalStrategy(
  { passReqToCallback: true },
  function(req, userId, password, done) {
    r.table('users')
    .get(userId)
    .run(req._rdbConn, null, (err, user) => {
      if (err) { return done(err); }
      
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      
      if (user.clientPassword != password) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      return done(null, user);
    })
  }
));

passport.serializeUser(function(req, user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(req, id, done) {
  r.table('users')
  .get(id)
  .run(req._rdbConn, null, (err, res) => {
    return done(err, {
      profile: res.profile,
      id: res.id,
      clientPassword: res.clientPassword,
    });
  })
});


router.use(session({
  secret: process.env.SECRET_KEY,
}));
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
router.use(passport.initialize());
router.use(passport.session());



router.get('/', (req, res) => {
  res.status(200).send("Lately - 2012 Mix/Master.")
})

router.get('/user', (req, res) => {
  res.send(req.user)
})

var PASSPORT_STRATEGY_PROVIDER = 'mocked';
// if(process.env.NODE_ENV === 'production') {
if(process.env.NODE_ENV != 'test') {
  PASSPORT_STRATEGY_PROVIDER = 'github';
}

router.get('/auth/github', passport.authenticate(PASSPORT_STRATEGY_PROVIDER));

router.post('/auth/login', passport.authenticate('local'), (req, res) => {
  res.send(200)
});

router.get('/auth/github/callback', 
  passport.authenticate(PASSPORT_STRATEGY_PROVIDER, { failureRedirect: '/' }),
  function(req, res) {
    res.send("<script>window.close()</script>")
  }
);

module.exports = router;
