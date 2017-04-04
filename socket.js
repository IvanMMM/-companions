"use strict";

let pool = {};

//io.sockets.clients('chatroom1');

module.exports = function(io){
    io.on('connection',socket=>{
        console.log(`User ${socket.id} connected. Total users: ${Object.keys(io.sockets.sockets).length}`);
        let from = socket.handshake.query.from;
        let to = socket.handshake.query.to;
        let role = socket.handshake.query.role || 'passenger';

        //Создаём комнаты метро
        if(!pool[from])     pool[from] = {};
        if(!pool[from][to]) pool[from][to] = [];

        //Добавляем пассажира в ожидающие
        if(role!='driver'){
            pool[from][to].push(socket.id);
        }else{
            let room = new Room(from,to);
            room.setDriver(socket.id);
        }

        socket.on('disconnect', ()=>{
            //Удаляем его из списка пассажиров, если он ещё там
            let indexPass = pool[from][to].indexOf(socket.id);
            if(indexPass > -1) pool[from][to].splice(indexPass, 1);

            //Удаляем его из списка комнаты, есть такая есть
            rooms[socket.room].removeUser(socket.id);
        });

        socket.on('message',data=>{
            if(!socket.room) socket.emit('error','Incorrect room to send message to');
            console.log(`message: ${JSON.stringify(data)}`);
            socket.to(socket.room).emit('message', {id:socket.id,text:data.text});
        });
    });

    //Цикл поиска попутчиков
    /*
        1. Водитель создаёт новую комнату. Мы ищем ему столько попутчиков сколько он хочет, добавляя их по одному.
        2. 4ре попутчика создают новую комнату для поездки на такси.
        3. Закидываем всех в чат.
    */

    let rooms = {};
    class Room {
        constructor(from, to, maxPassengers){
            this.id = makeId(16);
            this.from = from;
            this.to = to;
            this.maxPassengers = maxPassengers || 4;
            this.passengers = [];
            this.driver = false;
            rooms[this.id] = this;
            console.log(`New room created: ${JSON.stringify(this)}`)
        }

        addPassenger(passengerId){
            if(this.passengers.length>=this.maxPassengers) return new Error('Too many passengers');

            //Удаляем пассажира из списка ожидающих
            let index = pool[this.from][this.to].indexOf(passengerId);
            pool[this.from][this.to].splice(index, 1);

            //Добавляем пассажира в комнату
            let socket = io.sockets.connected[passengerId];
            console.log(`Adding ${socket.id} to room ${this.id}`);
            socket.join(this.id, ()=>{
                socket.room = this.id;
                this.passengers.push(passengerId);
                console.log(`Sended 'join' message from ${socket.id} to room ${this.id}`);
                io.in(this.id).emit('join', {id:socket.id,room:this,role:'passenger'});
                socket.emit('joined',{room:this,role:'passenger'})
            });
        }

        removeUser(userId){
            let index = this.passengers.indexOf(userId);
            if(index<0 && this.driver!=userId) return new Error('User not found');
            console.log(`Sended 'leave' message from ${userId} to room ${this.id}`);
            if(index>=0){
                this.passengers.splice(index, 1);
                io.in(this.id).emit('leave', {id:userId,room:this,role:'passenger'});
            }else{
                this.driver=false;
                io.in(this.id).emit('leave', {id:userId,room:this,role:'driver'});
            }
            if(!this.passengers.length && !this.driver) delete rooms[this.id];
        }

        setDriver(driverId){
            if(this.driver && driverId) return new Error('This room already has a driver');
            let socket = io.sockets.connected[driverId];
            socket.room = this.id;
            this.driver = driverId;
        }

        static getFreeRooms(from,to){
            let result = [];
            Object.keys(rooms).forEach(room=>{
                if(rooms[room].driver && rooms[room].passengers.length<rooms[room].maxPassengers){
                    if(from && to){
                        if(rooms[room].from==from && rooms[room].to==to)
                            result.push(rooms[room]);
                    }
                    result.push(rooms[room]);
                }
            });
            return result;
        }
    }

    setInterval(function(){
        let freeRooms = Room.getFreeRooms();
        freeRooms.forEach(room=>{
            //Распихиваем пользователей по комнатам с водителями и местами
            pool[room.from][room.to].forEach(passengerId=>{
                if(room.passengers.length<room.maxPassengers) room.addPassenger(passengerId)
            })
        });

        //Если свободных комнат с водителями нет, но есть большое количество пассажиров
        Object.keys(pool).forEach(from=>{
            Object.keys(pool[from]).forEach(to=>{
                if(pool[from][to].length>=4){
                    let room = new Room(from,to,4);

                    //Ищем 4х пассажиров
                    for(let i=0;i<4;i++){
                        let socketId = pool[from][to].shift();
                        if(room.passengers.length<room.maxPassengers) room.addPassenger(socketId);
                    }
                }
            })
        })
    },5*1000);
};


function makeId(length){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}