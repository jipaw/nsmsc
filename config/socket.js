var socketio = require('socket.io')

module.exports.listen = function(app){
    io = socketio.listen(app)

 //   users = io.of('/users')
    io.on('connection', function(socket){
        console.log('Socket server running ');
    })

    return io
}
