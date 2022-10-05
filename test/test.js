const chai = require('chai');
const chaiHttp = require('chai-http');
const { app, io } = require('../server.js');

// Configure chai
chai.use(chaiHttp);
chai.should();

describe("Spark", () => {
    var iio = null
    describe("HTTP request", () => {
        it("Should send client page", (done) => {
            chai.request(app).get('/').end((err, res) => {
                res.should.have.status(200);
                done();
            })
        })
    })
    describe("HTTP request", () => {
        it("Should receive client.js file", (done) => {
            chai.request(app).get('/client.js').end((err, res) => {
                res.should.have.status(200);
                done();
            })
        })
    })
    describe("HTTP request", () => {
        it("Should receive screen-sharing-min.html file", (done) => {
            chai.request(app).get('/share').end((err, res) => {
                res.should.have.status(200);
                done();
            })
        })
    })
})
