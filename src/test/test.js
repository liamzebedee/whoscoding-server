before(done => {
    const appBin = require('../bin/www').init(done)
})
var app = require('../app');
var io = require('socket.io-client')
const passport = require('passport');

var chai = require('chai')
  , chaiHttp = require('chai-http');
var expect = require('chai').expect

chai.use(chaiHttp);

const HOST = 'http://localhost:3000';



const PASSPORT_STRATEGY_PROVIDER = 'mocked';
function setupPassportUser(profile) {
    var strategy = passport._strategies[PASSPORT_STRATEGY_PROVIDER];

    strategy._token_response = {
      access_token: 'at-1234',
      expires_in: 3600
    };
    
    strategy._profile = profile;
}


let users = [
    {
        id: "32",
        displayName: 'Liam Z',
        emails: [ { value: 'liam@liamz.co' } ]
    },
    {
        id: "42",
        displayName: 'Anonymous Muppet',
        emails: [ { value: 'muppet@google.com' } ]
    },
    {
        id: "52",
        displayName: 'Kaz',
        emails: [ { value: 'kaz@neo.to' } ]
    }
]


function registerUser(userIdx, done) {
    setupPassportUser(users[userIdx])

    var agent = chai.request.agent(app)

    agent
    .get('/auth/github')
    .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);

        agent
        .get('/user')
        .end(function (err, res) {
            expect(err).to.be.null;
            expect(res).to.have.status(200);
            expect(res.body).to.not.be.empty;
            users[userIdx] = res.body;

            done()
        });
    }); 
}

it('should register a user', (done) => {
    registerUser(0, done)
})
it('should register a 2nd user', (done) => {
    registerUser(1, done)
})
it('should register a 3rd user', (done) => {
    registerUser(2, done)
})


function connectToSocket(userIdx, done) {
    let user = users[userIdx];
    let URL = `${HOST}?id=${user.id}&clientPassword=${user.clientPassword}`;
    let sock = io.connect(URL, { 
        // transports: ['websocket'],
        forceNew: true,
    });
    sock.on('connect', () => {
        done()
    })
    sock.on('error', function(err) {
        console.error(err)
        done()
    })
    return sock
}

var socket0, socket1, socket2;

it('should connect to socketio', (done) => {
    socket0 = connectToSocket(0, done)
})

it('should connect to socketio with second user', (done) => {
    socket1 = connectToSocket(1, done)
})

it('should update status for user 1 and distribute to user 2', (done) => {
    let currentProjects = [
        {
            name: 'swag',
            url: 'https://liamz.co',
            lastUpdate: new Date
        }
    ];

    socket1.on('status updated', msg => {
        expect(msg).to.not.be.empty;
        console.log(msg)
        // expect(msg.user.id).to.equal(users[0].id)
        // expect(msg.currentStatus.currentProjects).to.equal(currentProjects)

        socket1.off('status updated')
        done()
    })

    socket0.emit('current status', {
        currentProjects: currentProjects
    })
})



it('should correctly return the latest status of each user', function(done) {
    var latestStatus = {
        currentProjects: [
            {
                name: 'MakingWeetbix',
                url: 'https://weetbix.com.au',
                lastUpdate: new Date
            }
        ]
    };
    
    socket1.on('user statuses', msg => {
        let user = msg.users.filter(user => user.id == users[0].id)[0];
        
        expect(user.statuses).to.have.lengthOf(2);
        // expect(user.statuses.length).to.be.lessThan(4);
        expect(user.statuses[0].currentProjects[0].name).to.equal(latestStatus.currentProjects[0].name)

        socket1.off('statuses')
        done()
    })

    socket0.emit('current status', latestStatus)
    socket1.emit('get statuses')
})
