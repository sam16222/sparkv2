const chai = require('chai');
const chaiHttp = require('chai-http');
const { app } = require('../server.js');
var io = require('socket.io-client');

// Configure chai
chai.use(chaiHttp);
chai.should();