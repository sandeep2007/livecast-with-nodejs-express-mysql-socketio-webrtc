let peerConnection;
let peerConnections = {};

const config = {
    iceServers: [
        {
            "urls": "stun:stun.l.google.com:19302",
        },
        {
            "urls": "turn:turn.rajasthanstore.com:5349",
            "username": "sandeep",
            "credential": "qaz@123"
        }
        // { 
        //   "urls": "turn:TURN_IP?transport=tcp",
        //   "username": "TURN_USERNAME",
        //   "credential": "TURN_CREDENTIALS"
        // }
    ]
};


function setBandwidth(sdp) {

    // var bandwidth = {
    //     screen: 1, // 300kbits minimum
    //     audio: 1,   // 50kbits  minimum
    //     video: 100   // 256kbits (both min-max)
    // };
    // var isScreenSharing = false;

    //return sdp = BandwidthHandler.setApplicationSpecificBandwidth(sdp, bandwidth, isScreenSharing);
    // return sdp = BandwidthHandler.setVideoBitrates(sdp, {
    //     min: bandwidth.video,
    //     max: bandwidth.video
    // });
    // return sdp = BandwidthHandler.setOpusAttributes(sdp, {
    //     'maxaveragebitrate': 20 * 1024 * 8, // 500 kbits
    //     'maxplaybackrate': 20 * 1024 * 8, // 500 kbits 
    // });
    // return sdp = BandwidthHandler.setOpusAttributes(sdp, {
    //     'stereo': 0, // to disable stereo (to force mono audio)
    //     'sprop-stereo': 1,
    //     'maxaveragebitrate': 20 * 1024 * 8, // 500 kbits
    //     'maxplaybackrate': 20 * 1024 * 8, // 500 kbits
    //     // 'cbr': 0, // disable cbr
    //     // 'useinbandfec': 1, // use inband fec
    //     // 'usedtx': 1, // use dtx
    //     // 'maxptime': 3
    // });
    return sdp;
}


connection = {};
server_url = 'http://localhost:4000';
socket_url = 'http://localhost:4000';
castId = null;
userType = null;
uniqCastId = null;

function defaultSetting() {
    $('.watcher').hide();
    $('.broadcaster').hide();
}

(() => {
    defaultSetting()
})();

function login(el) {
    event.preventDefault();
    $('.login-err').empty();
    fd = new FormData(el);

    $.ajax({
        type: 'post',
        url: server_url + '/auth/login',
        data: fd,
        contentType: false,
        cache: false,
        processData: false,
        success: function (response) {

            if (response.data.token) {
                sessionStorage.setItem("token", response.data.token);
                sessionStorage.setItem("userData", JSON.stringify(response.data));
                $('#login-form').hide();
                $('#logout-btn').show();

                var template = `<div class="alert alert-success alert-dismissible">
                                    <button type="button" class="close" data-dismiss="alert">&times;</button>
                                    <strong>Success!</strong> You are logged in.
                                </div>`;
                showMsg('#msg', template);
            }
        },
        error: function (err) {
            $('.login-err').text('Incorrect login').css('color', '#f00');
            console.log(err)
        }
    });
}

setInterval(() => {
    if (!getToken()) {
        $('#user-name').hide();
        $('#login-form').show();
        $('#logout-btn').hide();
    } else {
        $('#user-name').show().find('a').text(getUserData('email'));
        $('#login-form').hide();
        $('#logout-btn').show();
    }

    if (getToken() && !connection.socket) {
        console.log('initiate socket connection')

        connection.socket = createSocket(socket_url, null, getToken());

        connection.socket.on('pongTest', (data) => {
            //console.log(data.message)
            var template = `<div class="alert alert-success alert-dismissible">
                                    <button type="button" class="close" data-dismiss="alert">&times;</button>
                                    <strong>Success!</strong> You are connected.
                                </div>`;
            showMsg('#msg', template);
        })

        connection.socket.on('userConnect', (data) => {

            // renderUserStatus(data);
            connection.socket.emit('loggedInUser');
            connection.socket.emit('userList');
            //console.log('userConnect broadcaster side', peerConnections);
        });

        connection.socket.on('userDisconnect', (data) => {
            //console.log('userDisconnect', data)
            // renderUserStatus(data);
            connection.socket.emit('userList');
            connection.socket.emit('loggedInUser');
            //console.log('userDisconnect broadcaster side', peerConnections);
        });

        connection.socket.on('endStream', (data) => {

            //console.log(castId, data.castId, userType)
            connection.socket.emit('userList');
            if (castId == data.castId && userType == 'WATCHER') {
                closeWatchStream();
            }

            if (castId == data.castId && userType == 'BROADCASTER') {
                //console.log(castId, userType)
                closeLiveStream();
            }
            connection.socket.emit('loggedInUser');
        })

        connection.socket.on('startStream', (data) => {
            //console.log('startStream');
            connection.socket.emit('userList');
            connection.socket.emit('loggedInUser');
        })

        connection.socket.on('userList', (data) => {
            renderUser(data)
        })

        connection.socket.on('loggedInUser', (data) => {
            castId = data.id;
            //console.log('loggedInUser', data)
            renderLoggedInUser(data)
        })

        connection.socket.on('streamData', (data) => {
            console.log(data)
            uniqCastId = data.uniqCastId;
        })

        connection.socket.on('startWatch', (data) => {
            console.log(data)
        });

        //broadcaster events
        connection.socket.on("answer", (id, description) => {
            peerConnections[id].setRemoteDescription(description);
        });

        connection.socket.on("watcher", id => {
            //console.log('onwatcher', id);
            const peerConnection = new RTCPeerConnection(config);
            peerConnections[id] = peerConnection;

            let stream = videoElement.srcObject;
            stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

            peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    connection.socket.emit("broadcasterCandidate", id, event.candidate);
                }
            };

            peerConnection
                .createOffer()
                .then(sdp => {
                    sdp.sdp = setBandwidth(sdp.sdp);
                    return peerConnection.setLocalDescription(sdp)
                })
                .then(() => {
                    connection.socket.emit("offer", id, peerConnection.localDescription);
                });
            //console.log(id);
            //console.log('broadcaster side', peerConnections);
        });

        connection.socket.on("watcherCandidate", (id, candidate) => {
            peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
        });

        connection.socket.on("disconnectPeer", id => {
            //console.log('broadcaster', id);
            try {
                peerConnections[id].close();
                delete peerConnections[id];
            }
            catch (err) {
                console.log(err)
            }

            //console.log('broadcaster side', peerConnections);
        });

        //watcher events
        connection.socket.on('startStream', (data) => {
            //console.log('startStream', data)
        });

        connection.socket.on("broadcaster", (data) => {
            if (data.castId == castId) {
                connection.socket.emit("watcher", { castId: castId });
            }
        });

        connection.socket.on("broadcasterCandidate", (id, candidate) => {
            peerConnection
                .addIceCandidate(new RTCIceCandidate(candidate))
                .catch(e => console.error(e));
        });

        connection.socket.on("offer", (id, description) => {
            peerConnection = new RTCPeerConnection(config);
            peerConnection
                .setRemoteDescription(description)
                .then(() => peerConnection.createAnswer())
                .then(sdp => {
                    sdp.sdp = setBandwidth(sdp.sdp);
                    return peerConnection.setLocalDescription(sdp)
                })
                .then(() => {
                    connection.socket.emit("answer", id, peerConnection.localDescription);
                });
            peerConnection.ontrack = event => {
                video.srcObject = event.streams[0];
            };
            peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    connection.socket.emit("watcherCandidate", id, event.candidate);
                }
            };
            //console.log(connection.socket.id);
            //console.log('watcher side', peerConnection);
        });
    }
}, 1000);

function testConnection() {
    if (connection.socket) {
        connection.socket.emit('pingTest', {
            message: 'Connected'
        });
    }
    else {
        var template = `<div class="alert alert-danger alert-dismissible">
                            <button type="button" class="close" data-dismiss="alert">&times;</button>
                            <strong>Failed!</strong> You are disconnected.
                        </div>`;
        showMsg('#msg', template);
        console.log('Disconnected');
    }
}

function getToken() {
    if (sessionStorage.getItem("token")) {
        return sessionStorage.getItem("token");
    }
    else {
        return null;
    }
}

function getUserData(key) {
    if (key && sessionStorage.getItem("userData")) {
        return JSON.parse(sessionStorage.getItem("userData"))[key];
    }
    else {
        return null;
    }
}

function showMsg(id, template) {
    $('#msg').html(template);
    setTimeout(function () {
        $('#msg').empty();
    }, 4000);
}

function logout() {
    closeLiveStream();
    connection.socket.disconnect();
    connection.socket = null;
    sessionStorage.clear()
    $('#user-list').empty();
    $('#loggedin-user').empty();
    $('#login-form').show();
    $('#logout-btn').hide();
    $('#user-name').hide();
    $('#broadcaster').hide();
    $('#watcher').hide();
    $('#user-list').show();
    $('#loggedin-user').show();

}

function createSocket(url, path, token) {
    let socket = io.connect(url, {
        //path: path,
        //rejectUnauthorized: false,
        secure: true,
        transports: ['websocket'],
        query: {
            token: token
        }
    });

    return socket;
}

function createLiveStream(data) {

    castId = data.id;
    userType = 'BROADCASTER';
    //console.log(castId)
    //console.log(data)

    $('#user-list').hide();
    $('#loggedin-user').hide();
    $('#broadcaster').show();
    $('#watcher').hide();

    getStream().then(getDevices).then(gotDevices);

    var template = `<div class="alert alert-success alert-dismissible">
                            <button type="button" class="close" data-dismiss="alert">&times;</button>
                            <strong>Success!</strong> You are streaming now.
                        </div>`;
    showMsg('#msg', template);
}

function closeLiveStream() {

    $('#user-list').show();
    $('#loggedin-user').show();
    $('#broadcaster').hide();
    $('#watcher').hide();

    if (uniqCastId) {
        connection.socket.emit('endStream', { castId: castId })

        var template = `<div class="alert alert-danger alert-dismissible">
                            <button type="button" class="close" data-dismiss="alert">&times;</button>
                            <strong>Alert!</strong> Streaming stopped.
                        </div>`;
        showMsg('#msg', template);
    }

    stopStreamedVideo(videoElement);
    peerConnections = {};
    userType = null;
    uniqCastId = null;
}

function watchLiveStream(data) {
    castId = data.id;
    $('#user-list').hide();
    $('#loggedin-user').hide();
    $('#broadcaster').hide();
    $('#watcher').show();

    connection.socket.emit("watcher", { castId: castId });
    userType = 'WATCHER';

    var template = `<div class="alert alert-success alert-dismissible">
    <button type="button" class="close" data-dismiss="alert">&times;</button>
    <strong>Success!</strong> You are watching ${data.name} CastID: ${castId}
    </div>`;
    showMsg('#msg', template);
}

function closeWatchStream() {
    //console.log('closeWatchStream()')
    $('#user-list').show();
    $('#loggedin-user').show();
    $('#broadcaster').hide();
    $('#watcher').hide();

    connection.socket.emit('endWatch', { castId: castId });
    stopStreamedVideo(video);
    peerConnection.close();
    userType = null;

    var template = `<div class="alert alert-danger alert-dismissible">
    <button type="button" class="close" data-dismiss="alert">&times;</button>
    <strong>Alert!</strong> End streaming session.
    </div>`;
    showMsg('#msg', template);
}

function renderLoggedInUser(data) {
    if (getUserData('id') == data.id) {
        if (data.is_live == 'TRUE') {
            var Btn = `
            <button type="button" style="width:80px" onclick='watchLiveStream(${JSON.stringify(data)})' class="ml-2 btn btn-sm btn-success float-right">
                Watch
                </button>
            <button type="button" style="width:80px" onclick='closeLiveStream()' class="btn btn-sm btn-danger float-right">
                Stop Live
            </button>
            `;
        }
        else {
            var Btn = `
            <button type="button" style="width:80px" onclick='createLiveStream(${JSON.stringify(data)})' class="btn btn-sm btn-success float-right">
                Go Live
            </button>
            `;
        }


        let userElement = `<a href="javascript:{}" class="list-group-item" > 
            <div class="float-left" style="margin-right: 9px;">
            <i class="profile-status fa fa-circle text-success"></i> <img class="user-profile" src="${data.image}"> 
            </div>
            <div class="float-left">
                <div>${data.name}</div>
                <div style="margin-top: -9px;">
                <small>${data.email}</small>
                </div>
            </div>
            ${Btn}
            </a>`;

        $('#loggedin-user').html(userElement);
    }
}

function renderUser(userList) {

    let userElement = userList.map((data, index) => {
        //console.log(data);

        if (data.is_live == 'TRUE') {

            var Btn = `<button type="button" style="width:80px" onclick='watchLiveStream(${JSON.stringify(data)})' class="btn btn-sm btn-success float-right">Watch</button>`;
        }
        else {
            var Btn = `<button type="button" style="width:80px;background:#8d8d8d" class="btn btn-sm text-white float-right">Watch</button>`;
        }

        return `<a href="javascript:{}" class="list-group-item" > 
        <div class="float-left" style="margin-right: 9px;">
        <i class="profile-status fa fa-circle ${(data.is_online == 'ONLINE' ? 'text-success' : 'text-danger')}"></i> <img class="user-profile" src="${data.image}"> 
        </div>
        <div class="float-left">
            <div>${data.name}</div>
            <div style="margin-top: -9px;">
            <small>${data.email}</small>
            </div>
        </div>
     ${Btn}
    </a>`;

    });
    $('#user-list').html(userElement);
}

// window.onunload = window.onbeforeunload = () => {
//     connection.socket.close();
// };

//watcher functions
const video = document.querySelector("video#watcher-view");

function enableAudio() {
    $('#enable-audio').hide();
    $('#disable-audio').show();
    //console.log("Enabling audio")
    video.muted = false;
}

function disableAudio() {
    $('#enable-audio').show();
    $('#disable-audio').hide();
    video.muted = true;
}

//broadcaster functions
function getDevices() {
    return navigator.mediaDevices.enumerateDevices();
}

// Get camera and microphone
const videoElement = document.querySelector("video#broadcaster-view");
const audioSelect = document.querySelector("select#audioSource");
const videoSelect = document.querySelector("select#videoSource");

audioSelect.onchange = getStream;
videoSelect.onchange = getStream;

function gotDevices(deviceInfos) {
    window.deviceInfos = deviceInfos;
    for (const deviceInfo of deviceInfos) {
        const option = document.createElement("option");
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === "audioinput") {
            option.text = deviceInfo.label || `Microphone ${audioSelect.length + 1}`;
            audioSelect.appendChild(option);
        } else if (deviceInfo.kind === "videoinput") {
            option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
            videoSelect.appendChild(option);
        }
    }
}

function getStream() {
    if (window.stream) {
        window.stream.getTracks().forEach(track => {
            track.stop();
        });
    }
    const audioSource = audioSelect.value;
    const videoSource = videoSelect.value;
    const constraints = {
        audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
        video: { deviceId: videoSource ? { exact: videoSource } : undefined }
    };
    return navigator.mediaDevices
        .getUserMedia(constraints)
        .then(gotStream)
        .catch(handleError);
}

function gotStream(stream) {
    window.stream = stream;
    audioSelect.selectedIndex = [...audioSelect.options].findIndex(
        option => option.text === stream.getAudioTracks()[0].label
    );
    videoSelect.selectedIndex = [...videoSelect.options].findIndex(
        option => option.text === stream.getVideoTracks()[0].label
    );
    videoElement.srcObject = stream;
    connection.socket.emit("broadcaster", { castId: castId });
}

function stopStreamedVideo(videoElem) {

    try {
        const streamEl = videoElem.srcObject;

        if (streamEl.getTracks()) {
            const tracks = streamEl.getTracks();
            tracks.forEach(function (track) {
                track.stop();
            });
        }
        videoElem.srcObject = null;
    }
    catch (err) {
        console.log(err)
    }

}

let mediaRecorder;
let recordedBlobs;

function startRecording() {
    recordedBlobs = [];
    let options = { mimeType: 'video/webm;codecs=vp9,opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error(`${options.mimeType} is not supported`);
        options = { mimeType: 'video/webm;codecs=vp8,opus' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.error(`${options.mimeType} is not supported`);
            options = { mimeType: 'video/webm' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.error(`${options.mimeType} is not supported`);
                options = { mimeType: '' };
            }
        }
    }

    try {
        mediaRecorder = new MediaRecorder(window.stream, options);
    } catch (e) {
        console.error('Exception while creating MediaRecorder:', e);
        errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
        return;
    }

    console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
    //recordButton.textContent = 'Stop Recording';
    //playButton.disabled = true;
    //downloadButton.disabled = true;
    mediaRecorder.onstop = (event) => {
        console.log('Recorder stopped: ', event);
        console.log('Recorded Blobs: ', recordedBlobs);
    };
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();
    console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
    mediaRecorder.stop();
}

function downloadRecording() {
    let date = new Date().getTime();
    const blob = new Blob(recordedBlobs, { type: 'video/webm' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = "recording-" + date + ".mp4";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}

function handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
    }
}

function uploadRecording() {
    let date = new Date().getTime();
    var formData = new FormData();
    var blob = new Blob(recordedBlobs, { type: "video/mp4" });
    formData.append("myFile", blob, "recording-" + date + ".mp4");
    formData.append("uniqCastId", uniqCastId);
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            console.log(this.responseText);
        }
    };
    request.open("POST", server_url + "/recording/upload");
    request.send(formData);
}

function handleError(error) {
    console.error("Error: ", error);
}
