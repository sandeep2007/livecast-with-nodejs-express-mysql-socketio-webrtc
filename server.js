require('dotenv/config')
const express = require('express')
const cors = require('cors')
const fs = require('fs');
const path = require('path')
const dateFormat = require('dateformat');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser')

app = express()
app.use(cors())

app.use(bodyParser.urlencoded({ extended: true }))

const certificate = fs.readFileSync(path.join(__dirname, 'cert', 'selfsigned.crt'), 'utf8');
const privateKey = fs.readFileSync(path.join(__dirname, 'cert', 'selfsigned.key'), 'utf8');

const credentials = { key: privateKey, cert: certificate };

//const http = require('https').createServer(credentials, app);
const http = require('http').createServer(app);

const host = '127.0.0.1';

const userHandler = require('./lib/userHandler');

const auth = require('./app/auth')
app.use('/auth', auth)

const recording = require('./app/recording')
app.use('/recording', recording)

app.use(express.static(path.join(__dirname, 'public')));

app.get('/info', (req, res) => {
  res.json({
    name: "Live Server",
    version: "1.0.0"
  })
})

const io = require('socket.io')(http, {
  //path: '/test',
  cors: {
    origin: "*"
  }
});

userHandler.clearSocketUsers();
userHandler.clearLiveWatcher();
userHandler.clearLiveBroadcaster();

app.get("/", function (req, res, next) {
  res.sendFile(__dirname + "/public/index.html");
});

io.use(async (socket, next) => {
  let token = await socket.handshake.query.token;
  let isToken = await userHandler.verifyToken(token, socket);
  if (isToken) {

    socket.userData = isToken;
    socket.userData.socket_id = socket.id
    return next();
  }
  return next(new Error('authentication error'));
});

io.sockets.on("error", e => console.log(e));

broadcaster = new Map;

io.sockets.on("connection", socket => {

  try {

    console.log('User connected ' + socket.id);

    io.emit('userConnect', { socket_id: socket.id, id: socket.userData.id, email: socket.userData.email, is_online: 'ONLINE', last_seen: socket.userData.last_seen, name: socket.userData.name, image: socket.userData.image });

    socket.on("broadcaster", async (data) => {

      userHandler.setLiveBroadcaster(socket.userData.id, (err, data1) => {

        socket.uniqCastId = uuidv4();
        socket.userType = 'BROADCASTER';
        socket.castId = data.castId;
        broadcaster.set(data.castId, { socketId: socket.id, uniqCastId: socket.uniqCastId });

        socket.broadcast.emit("broadcaster", { castId: data.castId });

        io.emit('startStream', { castId: data.castId });

        userHandler.castRegister({ userId: socket.userData.id, recordType: 'BROADCAST', uniqCastId: socket.uniqCastId });

        socket.emit('streamData', { castId: data.castId, uniqCastId: socket.uniqCastId, socketId: socket.id })
      });
    });



    socket.on("watcher", (data) => {

      userHandler.setLiveWatcher(socket.userData.id, (err, data1) => {
        socket.userType = 'WATCHER';
        socket.castId = data.castId;
        socket.to(broadcaster.get(data.castId).socketId).emit("watcher", socket.id);
       socket.emit('startWatch', { castId: data.castId, uniqCastId: broadcaster.get(socket.castId).uniqCastId, socketId: socket.id })
        userHandler.castRegister({ userId: socket.userData.id, recordType: 'WATCH', uniqCastId: broadcaster.get(data.castId).uniqCastId });
      });

    });
    socket.on("offer", (id, message) => {
      socket.to(id).emit("offer", socket.id, message);
    });
    socket.on("answer", (id, message) => {
      socket.to(id).emit("answer", socket.id, message);
    });
    socket.on("watcherCandidate", (id, message) => {
      socket.to(id).emit("watcherCandidate", socket.id, message);
    });
    socket.on("broadcasterCandidate", (id, message) => {
      socket.to(id).emit("broadcasterCandidate", socket.id, message);
    });

    // socket.on('broadcasterList', () => {
    //   io.emit('broadcasterList', userHandler.getBroadcasterList())
    // });

    socket.on('userList', (data) => {
      userHandler.userList({ userId: socket.userData.id }, (userList) => {
        socket.emit('userList', userList);
      });
    });

    socket.on('loggedInUser', (data) => {
      userHandler.userSingle({ userId: socket.userData.id }, (userData) => {

        socket.emit('loggedInUser', userData);
      });
    });

    socket.on('pingTest', (data) => {
      socket.emit('pongTest', data);
    });

    socket.on('endStream', (data) => {

      userHandler.unsetLiveBroadcaster(socket.userData.id, (err, data1) => {

        broadcaster.delete(socket.castId)
        io.emit('endStream', { castId: data.castId });

      });

    });

    socket.on('endWatch', (data) => {
      userHandler.unsetLiveWatcher(socket.userData.id, (err, data1) => {
        if (broadcaster.get(socket.castId)) {
          socket.to(broadcaster.get(socket.castId).socketId).emit("disconnectPeer", socket.id);
        }
      });
    });

    socket.on("disconnect", () => {

      let date = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

      userHandler.deleteUserToken(socket, () => {
        io.emit('userDisconnect', { socket_id: null, id: socket.userData.id, email: socket.userData.email, is_online: 'OFFLINE', last_seen: date, name: socket.userData.name, image: socket.userData.image });
        if (socket.userType == 'WATCHER') {
          userHandler.unsetLiveWatcher(socket.userData.id, (err, data1) => {
            socket.to(broadcaster.get(socket.castId).socketId).emit("disconnectPeer", socket.id);
          });

        }
        if (socket.userType == 'BROADCASTER') {
          io.emit('endStream', { castId: socket.castId });
          userHandler.unsetLiveBroadcaster(socket.userData.id, () => {
            broadcaster.delete(socket.castId)
          });
        }
      });
      //io.emit('broadcasterList', userHandler.getBroadcasterList())
    });
  }
  catch (err) {
    console.log(err)
  }

});

http.listen(process.env.PORT, host, () => {
  console.log("Server running at https://" + host + ": " + process.env.PORT)
});
