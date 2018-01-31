var express = require('express');
var rdbStore = require('../session')
var session = require('express-session');
var bodyParser = require("body-parser");
var router = express.Router();
var r = require('rethinkdb');
var passport = require('passport');
var GitHubStrategy = require('passport-github').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var crypto = require('crypto');




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
      },
      clientPassword: crypto.randomBytes(128).toString('hex')
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
  store: rdbStore,
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


router.get('/auth/github', passport.authenticate('github'));

router.post('/auth/login', passport.authenticate('local'), (req, res) => {
  res.send(200)
});



router.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/' }),
  function(req, res) {
    res.send("<script>window.close()</script>")
  }
);

router.post('/activity', (req, res) => {
  r.table("posts")
  .insert({
    userId: req.user.id,
    stuff: req.body.stuff,
    time: new Date
  })
  .run(req._rdbConn, (err, res) => {
    if(err) throw new Error(err)
  })
})

router.delete('/activity/{id}', (req, res) => {
  r.table("posts")
  .delete(req.params.id)
  .run(req._rdbConn, (err, res) => {
    if(err) throw new Error(err)
  })
})

router.get('/activity', (req, res) => {
  r.table("posts").outerJoin(
    r.table("users"),
    function (post, user) {
      return post("userId").eq(user("id"));
  }).zip()
  .run(req._rdbConn, (err, cursor) => {
    if(err) throw new Error(err)

    cursor.toArray().then((posts) => {
      res.send(posts)
    })
  })
})


module.exports = router;
