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

    describe("Testing sockets", () => {
        var socket = null;
        beforeEach(function (done) {
            // Setup
            socket = io.connect('http://localhost:3000', {
                'reconnection delay': 0
                , 'reopen delay': 0
                , 'force new connection': true
            });
            socket.on('connect', function () {
                console.log('worked...');
                done();
            });
            socket.on('disconnect', function () {
                console.log('disconnected...');
            })
        });

    })
})
