const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server.js');

// Configure chai
chai.use(chaiHttp);
chai.should();

describe("Stu", () => {
    describe("Get", () => {
        it("Should ", (done) => {
            chai.request(app).get('/').end((err, res) => {
                res.should.have.status(200);
                done();
            })
        })
    })
    describe("Gettt", () => {
        it("Shotttuld ", (done) => {
            chai.request(app).get('/close').end((err, res) => {
                res.should.have.status(200);
                done();
            })
        })
    })
})

// // with { "type": "module" } in your package.json
// import { createServer } from "http";
// import { io as Client } from "socket.io-client";
// import { Server } from "socket.io";
// import { assert } from "chai";

// // with { "type": "commonjs" } in your package.json
// // const { createServer } = require("http");
// // const { Server } = require("socket.io");
// // const Client = require("socket.io-client");
// // const assert = require("chai").assert;

// describe("my awesome project", () => {
//     let io, serverSocket, clientSocket;

//     before((done) => {
//         const httpServer = createServer();
//         io = new Server(httpServer);
//         httpServer.listen(() => {
//             const port = httpServer.address().port;
//             clientSocket = new Client(`http://localhost:${port}`);
//             io.on("connection", (socket) => {
//                 serverSocket = socket;
//             });
//             clientSocket.on("connect", done);
//         });
//     });

//     after(() => {
//         io.close();
//         clientSocket.close();
//     });

//     it("should work", (done) => {
//         clientSocket.on("hello", (arg) => {
//             assert.equal(arg, "world");
//             done();
//         });
//         serverSocket.emit("hello", "world");
//     });

//     it("should work (with ack)", (done) => {
//         serverSocket.on("hi", (cb) => {
//             cb("hola");
//         });
//         clientSocket.emit("hi", (arg) => {
//             assert.equal(arg, "hola");
//             done();
//         });
//     });
// });
