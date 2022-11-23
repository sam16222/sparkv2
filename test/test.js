const chai = require('chai');
const chaiHttp = require('chai-http');
const { app } = require('../server.js');
var io = require('socket.io-client');
const hand_gesture = require('../hand_gesture');
require('mocha-sinon');
var expect = require('chai').expect;

// Configure chai
chai.use(chaiHttp);
chai.should();

// Input class for gesture test
class TestElement {
  constructor(json_data) {
    this.x = parseFloat(json_data['x']);
    this.y = parseFloat(json_data['y']);
    this.z = parseFloat(json_data['z']);
  }
}

class TestEntries {
  constructor(json_data) {
    this.elem_arr = [];
    this.idx_arr = [];
    var idx = 0;
    for (var ele in json_data) {
      this.elem_arr[idx] = new TestElement(json_data[ele]);
      this.idx_arr[idx] = idx;
      idx = idx + 1;
    }
  }

  *entries() {
    for (var i = 0; i < this.elem_arr.length; i++) {
      yield [i, this.elem_arr[i]];
    }
  }
  [Symbol.iterator]() {
    return this.elem_arr.values();
  }
}

class TestGestureResults {
  constructor(json_data) {
    var entries = new TestEntries(json_data['multiHandLandmarks[0]']);
    this.multiHandLandmarks = []; //new MultiHandLandmarks(entries, 1)
    this.multiHandLandmarks[0] = entries;
    this.lsit = [];
    for (var i in json_data['lsit']) {
      this.lsit.push(parseInt(json_data['lsit'][i]));
    }
  }
}

function json_to_obj(json_arr) {
  var TestResults = [];
  for (var key in json_arr) {
    TestResults.push(new TestGestureResults(json_arr[key]));
  }
  return TestResults;
}

describe('Spark', () => {
  describe('HTTP request', () => {
    it('Should send client page', (done) => {
      chai
        .request(app)
        .get('/')
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
    it('Should receive client.js file', (done) => {
      chai
        .request(app)
        .get('/client.js')
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });

  describe('Testing sockets', () => {
    var socket = null;
    beforeEach(function (done) {
      this.sinon.stub(console, 'log');
      // Setup
      socket = io.connect('http://localhost:3000', {
        'reconnection delay': 0,
        'reopen delay': 0,
        'force new connection': true,
      });
      socket.on('connect', function () {
        done(); 
      });
      done();
    });

    afterEach(function (done) {
      // Cleanup
      if (socket.connected) {
        socket.disconnect();
      }
      done();
    });

    describe('Socket emit methods ', function () {
      it('create or join emit function', function (done) {
        socket.emit('create or join', 100);
        done();
      });
      it('ready emit function', function (done) {
        socket.emit('ready', 100);
        done();
      });
      it('candidate emit function', function (done) {
        socket.emit('candidate', 100);
        done();
      });
      it('offer emit function', function (done) {
        socket.emit('offer', 100);
        done();
      });
      it('answer emit function', function (done) {
        socket.emit('answer', 100);
        done();
      });
      it('console.log', function (done) {
        expect(console.log.calledWith('a user connected')).to.be.false;
        done();
      });
    });
  });
});

describe('test gesture', () => {
  it('Should match pre-calculated results', (done) => {
    var PreCalculatedRes = {};
    PreCalculatedRes[hand_gesture.Gesture.All5Fingers] = 228;
    PreCalculatedRes[hand_gesture.Gesture.NoDetection] = 69;
    PreCalculatedRes[hand_gesture.Gesture.ThumbsUp] = 180;
    PreCalculatedRes[hand_gesture.Gesture.ThumbsDown] = 113;
    PreCalculatedRes[hand_gesture.Gesture.ClosedFist] = 1;

    var fs = require('fs');
    var obj = JSON.parse(fs.readFileSync('./gestureTestData', 'utf8'));
    var TestResults = json_to_obj(obj);
    var res = {};
    for (var idx in TestResults) {
      var key = hand_gesture.onResults(TestResults[idx]);
      if (res[key] === undefined) {
        res[key] = 0;
      }
      res[key]++;
    }

    if (
      PreCalculatedRes[hand_gesture.Gesture.All5Fingers] === res[hand_gesture.Gesture.All5Fingers] &&
      PreCalculatedRes[hand_gesture.Gesture.ClosedFist] === res[hand_gesture.Gesture.ClosedFist] &&
      PreCalculatedRes[hand_gesture.Gesture.ThumbsUp] === res[hand_gesture.Gesture.ThumbsUp] &&
      PreCalculatedRes[hand_gesture.Gesture.ThumbsDown] === res[hand_gesture.Gesture.ThumbsDown] 
    ) {
      done();
    }
  });
});

describe('Closing spark server', () => {
  it('Should close server socket', (done) => {
    chai
      .request(app)
      .get('/close')
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });
});
