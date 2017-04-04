"use strict";

var PORT = process.env.NODE_PORT || 3000;

const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
global.Promise=require("bluebird");

app.use(require('morgan')('dev'));

//app.use('/',require('./routes'));
require('./socket')(io);

server.listen(PORT,()=>{
    console.log(`Server is UP at ${PORT}`)
});