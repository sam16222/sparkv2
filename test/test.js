const chai = require('chai');
const chaiHttp = require('chai-http');
const { app } = require('../server.js');
var io = require('socket.io-client');

// Configure chai
chai.use(chaiHttp);
chai.should();

describe("Spark", () => {
    describe("HTTP request", () => {
        it("Should send client page", (done) => {
            chai.request(app).get('/').end((err, res) => {
                res.should.have.status(200);
                done();
            })
        })
        it("Should receive client.js file", (done) => {
            chai.request(app).get('/client.js').end((err, res) => {
                res.should.have.status(200);
                done();
            })
        })
        it("Should receive screen-sharing-min.html file", (done) => {
            chai.request(app).get('/share').end((err, res) => {
                res.should.have.status(200);
                done();
            })
        })
    })

    describe('Socket emit methods ', function () {
        it('create or join emit function', function (done) {
            socket.emit('create or join', 100)
            done();
        });
        it('ready emit function', function (done) {
            socket.emit('ready', 100)
            done();
        });
    });
})