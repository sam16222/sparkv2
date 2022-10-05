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
})
