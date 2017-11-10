const WebSocketServer = require('ws').Server;

const millisInTwoMins = 120000;
 var that;

class SocketServer{
  constructor(){
    that = this;

    that.connection;
    that.interval;
    that.socketResponse;
    that.pingInterval = setInterval(()=>{that.sendPing()}, millisInTwoMins);

  }

  startServer(){
    var socketServer = new WebSocketServer({port:9000});
    console.log("Websocket is listening");

    socketServer.on('connection', that.onSocketConnection);
  }

  //second argument is an incoming message which can be used for auth
  async onSocketConnection(conn){
    that.connection = conn;
    console.log('Connection Established');
    that.connection.on('message', that.processMessageData);

    that.connection.on('close',() =>{
      console.log('Connection Closed');
      that.connection = null;
    });
  }

  async sendPing(){
    if(that.connection){
      console.log("PING");
      that.connection.send(JSON.stringify("PING"));
    }
  }

  processMessageData(response){
    var data = JSON.parse(response);
    if(data == "PONG"){
      console.log("PONG");
      return;
    }
    if(data.type.includes("ret-")){
      that.socketResponse = data;
    }
  }

  async requestAsync(reqType, target, data){
    if(!that.connection){
      that.socketResponse = null;
      throw new Error("No Connection to Controller");
    }
    //var requestType = reqParams.searchParams('');

    var message = JSON.stringify({type:reqType, target:target, data:data});

    that.connection.send(message);

    //while(!that.socketResponse || that.socketResponse.type !== 'ret-'+requestType){ //this is bad, should get a callback method as an argument
    while(!that.socketResponse){ //this is bad, should get a callback method as an argument
      console.log("waiting");
      await that.sleep(50);                                                        //which it executes when it gets a response rather than causing the program to hang while waiting for it
    }
    delete(that.socketResponse.type);
    var response = that.socketResponse;
    delete(that.socketResponse);
    return response;
}

  async updateComponentAsync(component, action){
    if(!that.connection){
      that.socketResponse = null;
      throw new Error("No Connection to Controller");
    }

    var message = JSON.stringify({type:'update-component', action:action, component: component});
    that.connection.send(message);

    while(!that.socketResponse){
      console.log('waiting');
      await that.sleep(150);
      //add a timeout counter to return failure
    }

    delete(that.socketResponse.type);
    var response = that.socketResponse;
    delete(that.socketResponse);
    return response;
  }

  async updateEventAsync(oldId, newEvent){
    if(!that.connection){
      that.socketResponse = null;
      throw new Error("No Connection to Controller");
    }

    var message = JSON.stringify({type:'update-event', oldId:oldId, newEvent: newEvent});
    that.connection.send(message);

    while(!that.socketResponse){
      console.log('waiting');
      await that.sleep(150);
      //add a timeout counter to return failure
    }

    delete(that.socketResponse.type);
    var response = that.socketResponse;
    delete(that.socketResponse);
    return response;
  }


    async deleteEventAsync(event){
      if(!that.connection){
        that.socketResponse = null;
        throw new Error("No Connection to Controller");
      }
      var message = JSON.stringify({type:'delete-event', event:event});
      that.connection.send(message);

      while(!that.socketResponse){
        console.log('waiting');
        await that.sleep(150);
        //add a timeout counter to return failure
      }

      delete(that.socketResponse.type);
      var response = that.socketResponse;
      delete(that.socketResponse);
      return response;
    }

    async deleteComponentAsync(component){
      if(!that.connection){
        that.socketResponse = null;
        throw new Error("No Connection to Controller");
      }

      var message = JSON.stringify({type:'delete-component', component:component});
      that.connection.send(message);

      while(!that.socketResponse){
        console.log('waiting');
        await that.sleep(150);
        //add a timeout counter to return failure
      }

      delete(that.socketResponse.type);
      var response = that.socketResponse;
      delete(that.socketResponse);
      return response;
    }

  //----------------//
  //wraps the timeout function in <promise> allowing await keyword
  timeout(ms) {
      return new Promise(resolve=> setTimeout(resolve ,ms));
  }
  async sleep(duration) {
      await that.timeout(duration);
      return;
  }
  //----------------//
  createErrorObject(type,message){
    return {error:{type:1,message:message}};
  }
}
module.exports = SocketServer;
