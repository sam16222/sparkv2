/* eslint-disable no-unused-vars */

var divSelectRoom = document.getElementById("selectRoom");
var divConsultingRoom = document.getElementById("consultingRoom");
var divConsultingControls = document.getElementById("consultingControls");
var inputRoomNumber = document.getElementById("roomNumber");
var btnGoRoom = document.getElementById("goRoom");
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");
var toggleButton = document.getElementById('toggle-cam');
var toggleMic = document.getElementById('toggle-mic');
var screenShare = document.getElementById('screen-share');

var roomNumber;
var localStream;
var remoteStream;
var rtcPeerConnection;
var iceServers = {
    'iceServers': [
        { 'urls': 'stun:stun.services.mozilla.com' },
        { 'urls': 'stun:stun.l.google.com:19302' }
    ]
}
var streamConstraints = { audio: true, video: true };
var isCaller;
var start_tracking = false;
var x1 = 0;
var x2 = 0;


var socket = io("http://localhost:3000");

btnGoRoom.onclick = function () {
    if (inputRoomNumber.value === '') {
        alert("Please type a room number")
    } else {
        roomNumber = inputRoomNumber.value;
        console.log("Room number " + roomNumber + " gathered");
        console.log('connect socket id:' + `${socket.id}`);
        socket.emit("create or join", roomNumber);
        // divSelectRoom.style = "display: none;";
        divConsultingRoom.style = "display: block;";
        divConsultingControls.style = "display: block;"

        //Hand Gesture
        const hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });
        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.8,
            minTrackingConfidence: 0.7
        });

        hands.onResults(onResults);

        const camera = new Camera(localVideo, {
            onFrame: async () => {
                await hands.send({ image: localVideo });
            },
            width: 640,
            height: 320
        });
        camera.start();
    }
};

socket.on('connect', function () {
    alert("Connection acheived.");
    console.log(socket.id);
});

socket.on('created', function (room) {
    alert("You are the first one in the room. Room created.")
    navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
        localStream = stream;
        localVideo.srcObject = stream;
        isCaller = true;
    }).catch(function (err) {
        console.log('An error ocurred when accessing media devices', err);
    });
});

toggleButton.addEventListener('click', () => {
    const videoTrack = localStream.getTracks().find(track => track.kind === 'video');
    if (videoTrack.enabled) {
        videoTrack.enabled = false;
        toggleButton.innerHTML = "Show cam"
    } else {
        videoTrack.enabled = true;
        toggleButton.innerHTML = "Hide cam"
    }
});

toggleMic.addEventListener('click', () => {
    const audioTrack = localStream.getTracks().find(track => track.kind === 'audio');
    if (audioTrack.enabled) {
        audioTrack.enabled = false;
        toggleMic.innerHTML = "Unmute microphone"
    } else {
        audioTrack.enabled = true;
        toggleMic.innerHTML = "Mute microphone"
    }
});

screenShare.addEventListener('click', () => {
    // Add in update to HTML page after screen share enable
});

socket.on('joined', function (room) {
    alert("You are joining an existing room. Room joined.")
    navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
        localStream = stream;
        localVideo.srcObject = stream;
        socket.emit('ready', roomNumber);
    }).catch(function (err) {
        console.log('An error ocurred when accessing media devices', err);
    });
});

socket.on('candidate', function (event) {
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate
    });
    rtcPeerConnection.addIceCandidate(candidate);
});

socket.on('ready', function () {
    if (isCaller) {
        alert("Attempting to access video log of joined user.")
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
        rtcPeerConnection.createOffer()
            .then(sessionDescription => {
                rtcPeerConnection.setLocalDescription(sessionDescription);
                socket.emit('offer', {
                    type: 'offer',
                    sdp: sessionDescription,
                    room: roomNumber
                });
            })
            .catch(error => {
                console.log(error)
            })
    }
});

socket.on('offer', function (event) {
    if (!isCaller) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
        rtcPeerConnection.createAnswer()
            .then(sessionDescription => {
                rtcPeerConnection.setLocalDescription(sessionDescription);
                socket.emit('answer', {
                    type: 'answer',
                    sdp: sessionDescription,
                    room: roomNumber
                });
            })
            .catch(error => {
                console.log(error)
            })
    }
});

socket.on('answer', function (event) {
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
});

socket.on('disconnect', function () {
    alert('disconnected to server');
});

socket.on('full', function () {
    alert('Room is full. You can not enter this room right now.');
});

function onIceCandidate(event) {
    console.log(event)
    if (event.candidate) {
        console.log('sending ice candidate');
        socket.emit('candidate', {
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
            room: roomNumber
        })
    }
}

function onAddStream(event) {
    remoteVideo.srcObject = event.streams[0];
    remoteStream = event.stream;
}

function onResults(results) {

    if (results.multiHandLandmarks.length != 0) {

        var [lsit, box] = findhandpos(results.multiHandLandmarks[0]);
    }
    else {
        var lsit = [];
        if (start_tracking == true) {
            //Stop Tracking
            start_tracking = false;
            if (x1[0] > x2[0]) {
                //Gesture 1
                console.log("right swipe")
            }
            else {
                //Gesture 2
                console.log("left swipe")
            }
        }
    }

    if (lsit.length != 0) {

        var fings = detect_fingersup(lsit);

        console.log(fings);


        if (fings[1] == true && fings[3] == false && fings[4] == false) {
            if (start_tracking == false) {
                //start tracking
                start_tracking = true;
                x1 = lsit[8].slice(1, 2);
                console.log(x1)
            }
            else {
                x2 = lsit[8].slice(1, 2);
            }
        }
        else {

            start_tracking = false;

            if (fings[0] == true && fings[1] == true && fings[2] == true && fings[3] == true && fings[4] == true) {
                //Gesture 3
                console.log("all five fingers")

            }

            else if (fings[0] == true && fings[1] == false && fings[2] == false && fings[3] == false && fings[4] == false) {
                var y1 = lsit[4].slice(2, 3);
                var y2 = lsit[2].slice(2, 3);
                if (y1[0] > y2[0]) {
                    //Gesture 4
                    console.log("Thumbs Down")
                }
                else {
                    //Gesture 5
                    console.log("Thumbs Up")
                }
            }
        }
    }
}

function findhandpos(landmarks) {
    var xlist = [];
    var ylist = [];
    var lmlist = [];
    var bbox = [];
    for (const [index, element] of landmarks.entries()) {
        var [h, w, c] = [900, 1600, 3];
        var cx = parseInt(element.x * w);
        var cy = parseInt(element.y * h);
        xlist.push(cx);
        ylist.push(cy);
        lmlist.push([index, cx, cy]);
    }
    var xmin = Math.min(xlist);
    var xmax = Math.max(xlist);
    var ymin = Math.min(ylist);
    var ymax = Math.max(ylist);
    bbox = [xmin, ymin, xmax, xmin];

    return [lmlist, bbox];
}

function detect_fingersup(lmlist) {
    var fingers = [];
    var ids = [4, 8, 12, 16, 20];
    if (lmlist[ids[0]][1] < lmlist[ids[0] - 2][1]) {
        fingers.push(1);
    }
    else {
        fingers.push(0);
    }
    for (let i = 1; i < 5; i++) {
        if (lmlist[ids[i]][2] < lmlist[ids[i] - 2][2]) {
            fingers.push(1);
        }
        else {
            fingers.push(0);
        }
    }
    return fingers;
}
