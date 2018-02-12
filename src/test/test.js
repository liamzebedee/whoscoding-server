before(done => {
    const appBin = require('../bin/www').init(done)
})
var app = require('../app');
const io = require('socket.io-client')
const passport = require('passport');

var chai = require('chai')
  , chaiHttp = require('chai-http');
var expect = require('chai').expect

chai.use(chaiHttp);

const HOST = 'http://0.0.0.0:3000';

var options = { 
  transports: ['websocket'],
  'force new connection': true
};

const PASSPORT_STRATEGY_PROVIDER = 'mocked';
function setupPassportUser(profile) {
    var strategy = passport._strategies[PASSPORT_STRATEGY_PROVIDER];

    strategy._token_response = {
      access_token: 'at-1234',
      expires_in: 3600
    };
    
    strategy._profile = profile;
}




describe('HTTP API', () => {
    it('should register a user', (done) => {
        setupPassportUser({
            id: 1,
            displayName: 'Liam Z',
            emails: [ { value: 'liam@liamz.co' } ]
        })

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
                done()
            });
        });
    })
})


// Register user 1
// Register user 2
// Register user 3

// Send status from user 1
// Test status inserted into database
// Test user 2 and 3 receives status