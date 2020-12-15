
const Database = require('./Database');
const conn = new Database()

const dateFormat = require('dateformat');
const fn = require('./functions');

let obj = {};

const userTableName = process.env.USER_TABLE_NAME;
const encryptionKey = process.env.APP_SECRET_KEY;
const tokenColumn = process.env.USER_TOKEN_COLUMN;




obj.verifyToken = async (token, socket) => {

    let date = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
    let userData = await conn.query("SELECT t1.name,t1.image,'" + date + "' as last_seen,t1." + tokenColumn + ",t1.id,t1.email from " + userTableName + " as t1 WHERE t1." + tokenColumn + "='" + token + "' LIMIT 1");

    if (!fn.isEmpty(userData)) {
        checkUserToken = await conn.query("select id from " + fn.getTableName('socket_users') + " where socket_id='" + socket.id + "' LIMIT 1");
        if (fn.isEmpty(checkUserToken)) {
            await conn.query("Insert into " + fn.getTableName('socket_users') + "(token,socket_id,date_created) values('" + token + "','" + socket.id + "','" + dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss") + "')");
        }
        else {
            await conn.query("update " + fn.getTableName('socket_users') + " set socket_id='" + socket.id + "' where token='" + token + "'");
        }
        obj.lastSeen(userData[0]['id'], 'CONNECT');
        return userData[0];
    }
    return false;
}

obj.userList = (data, callback) => {

    conn.query("select IF((select t3.id from " + fn.getTableName('socket_users') + " as t3 where t3.token=t1." + tokenColumn + " order by t3.date_created DESC LIMIT 1), 'ONLINE','OFFLINE') as is_online,IF(t3.user_id, 'TRUE', 'FALSE') as is_live,(select date_created from " + fn.getTableName('last_seen') + " where user_id=t1.id order by date_created DESC LIMIT 1) as last_seen,t1.id,t1.email,t1.name,t1.image from " + userTableName + " as t1 left join " + fn.getTableName('live_broadcaster') + " as t3 on t3.user_id=t1.id where t1.id!='" + data.userId + "' and t1.email!='' order by FIELD(is_online,'ONLINE','OFFLINE')").then((userList) => {
        callback(userList);
    });
}

obj.userSingle = (data, callback) => {

    conn.query("select IF(t3.user_id, 'TRUE', 'FALSE') as is_live,(select date_created from " + fn.getTableName('last_seen') + " where user_id=t1.id order by date_created DESC LIMIT 1) as last_seen,IF(t2.id,'ONLINE','OFFLINE') as is_online,t1.id,t1.email,t1.name,t1.image,t2.socket_id from " + userTableName + " as t1 left join " + fn.getTableName('socket_users') + " as t2 on t2.token=t1." + tokenColumn + " left join " + fn.getTableName('live_broadcaster') + " as t3 on t3.user_id=t1.id where t1.id='" + data.userId + "' and t1.email!='' LIMIT 1").then((userList) => {
        if (!fn.isEmpty(userList)) {
            callback(userList[0]);
        }
        else {
            callback(null);
        }
    });
}


obj.getUserSocketId = (userId, callback) => {
    conn.query("select t1.socket_id from " + fn.getTableName('socket_users') + " as t1 join " + userTableName + " as t2 on t2." + tokenColumn + " = t1.token where t2.id = '" + userId + "' LIMIT 1").then((data) => {
        if (!fn.isEmpty(data)) {
            callback(null, data[0]);
        }
        else {
            callback('not found', null);
        }

    }).catch((err) => {
        callback(err, null);
    });
};



obj.deleteUserToken = (socket, callback) => {
    obj.lastSeen(socket.userData.id, 'DISCONNECT');
    conn.query("delete from " + fn.getTableName('socket_users') + " where socket_id='" + socket.id + "'").then((data) => {

        if (callback) {
            callback(data);
        }
    });
}

obj.lastSeen = (userId, userAction) => {
    let date = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
    conn.query(`insert into ${fn.getTableName('last_seen')}(user_id,action,date_created) values('${userId}','${userAction}','${date}')`)
}

obj.getBroadcasterList = () => {
    broadcasterList = [];
    broadcaster.forEach((value, key) => {
        broadcasterList.push({ castId: key, socketId: value });
    });
    return broadcasterList;
}

obj.setLiveBroadcaster = (userId, callback) => {
    let date = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
    conn.query("insert into " + fn.getTableName('live_broadcaster') + "(user_id,date_created) values(?,?)", [userId, date]).then((data) => {
        callback(null, data)
    }).catch((err) => {
        callback(err, null)
    });
}

obj.unsetLiveBroadcaster = (userId, callback) => {

    conn.query("delete from " + fn.getTableName('live_broadcaster') + " where user_id=?", [userId]).then((data) => {
        if (callback) {
            callback(null, data)
        }
    }).catch((err) => {
        if (callback) {
            callback(err, null)
        }
    });
}

obj.setLiveWatcher = (userId, callback) => {
    let date = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
    conn.query("insert into " + fn.getTableName('live_watcher') + "(user_id,date_created) values(?,?)", [userId, date]).then((data) => {
        callback(null, data)
    }).catch((err) => {
        callback(err, null)
    });
}

obj.unsetLiveWatcher = (userId, callback) => {

    conn.query("delete from " + fn.getTableName('live_watcher') + " where user_id=?", [userId]).then((data) => {
        if (callback) {
            callback(null, data)
        }
    }).catch((err) => {
        if (callback) {
            callback(err, null)
        }
    });
}

obj.castRegister = (data, callback) => {
    let date = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
    conn.query("insert into " + fn.getTableName('cast_record') + "(user_id,record_type,cast_id,date_created) values(?,?,?,?)", [data.userId, data.recordType, data.uniqCastId, date]).then((data1) => {
        if (callback) {
            callback(null, data1)
        }
    }).catch((err) => {
        if (callback) {
            callback(err, null)
        }
    });
}

obj.saveStreamFile = (fileName, uniqCastId) => {
    let date = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
    conn.query("insert into " + fn.getTableName('streaming_files') + "(file,cast_id,date_created) values(?,?,?)", [fileName, uniqCastId, date]);
}

obj.clearSocketUsers = () => {
    conn.query("delete from " + fn.getTableName('socket_users') + "");
}

obj.clearLiveWatcher = () => {
    conn.query("delete from " + fn.getTableName('live_watcher') + "");
}

obj.clearLiveBroadcaster = () => {
    conn.query("delete from " + fn.getTableName('live_broadcaster') + "");
}


module.exports = obj;