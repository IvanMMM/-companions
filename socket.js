"use strict";

let pool = {};

//io.sockets.clients('chatroom1');

module.exports = function(io){
    io.on('connection',socket=>{
        console.log(`User ${socket.id} connected. Total users: ${Object.keys(io.sockets.sockets).length}`);
        let from = socket.handshake.query.from;
        let to = socket.handshake.query.to;

        //Создаём комнаты метро
        if(!pool[from])
            pool[from] = {};
        if(!pool[from][to])
            pool[from][to] = {passengers:[],rooms:{}};

        //Добавляем сокет в общий пул сокетов по метро
        pool[from][to].passengers.push(socket.id);

        //Если желающих на поездку >= 3х - создаём новую комнату для попутчиков.
        checkRoomReady(from,to);

        socket.on('disconnect', ()=>{
            //Удаляем его из списка пассажиров, если он ещё там
            let indexPass = pool[from][to].passengers.indexOf(socket.id);
            if(indexPass > -1) pool[from][to].passengers.splice(indexPass, 1);

            //Удаляем его из списка комнаты, есть такая есть
            if(pool[from][to].rooms[socket.room]){
                console.log(`Sended 'leave' message from ${socket.id} to room ${socket.room}`);
                io.in(socket.room).emit('leave', {id:socket.id});

                let indexRoom = pool[from][to].rooms[socket.room].indexOf(socket.id);
                if(indexRoom > -1){
                    pool[from][to].rooms[socket.room].splice(indexRoom, 1);
                    //Удаляем пустую комнату
                    if(pool[from][to].rooms[socket.room].length==0) delete pool[from][to].rooms[socket.room]
                }

            }
        });

        socket.on('message',data=>{
            if(!socket.room) socket.emit('error','Incorrect room to send message to');
            console.log(`message: ${JSON.stringify(data)}`);
            socket.to(socket.room).emit('message', {id:socket.id,text:data.text});
        });
    });

    function checkRoomReady(from,to){
        if(pool[from][to].passengers.length<3) return;
        let room = makeId(32);

        for(let i=0;i<3;i++){
            let socketId = pool[from][to].passengers.shift();
            console.log(`Adding ${socketId} to #${room}`);

            pool[from][to].rooms[room] = [];
            pool[from][to].rooms[room].push(socketId);

            let socket = io.sockets.connected[socketId];
            socket.room = room;
            socket.join(room, ()=>{
                console.log(`Sended 'join' message from ${socket.id} to room ${room}`);
                //socket.broadcast.to(room).emit('join', {id:socket.id,room:room,from:from,to:to});
                io.in(room).emit('join', {id:socket.id,room:room,from:from,to:to});
            });
        }
    }
};


function makeId(length){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}