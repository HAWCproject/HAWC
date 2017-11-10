const WebSocket = require('ws');
const SM = require("./ServiceManager");
const ComponentFactory = require("./ComponentFactory");
const FileIO = require("./FileIO");
const Statics = require("./Statics");
//const gpio = require("./GpioController");


var socket;
var that;
var serviceManager;
var components = null;

var config;

class SocketClient{

  constructor(){
    that = this;

  }

  async init(){
    config = await FileIO.ReadAndParseJSON(Statics.CONFIG_JSON_FILEPATH);
    await that.startServices();
    await that.openConnection();
  }

  async startServices(){
    serviceManager = new SM();
    components = await FileIO.ReadAndParseJSON(Statics.COMPONENT_JSON_FILEPATH);
    that.setAllComponentStates();
    FileIO.WriteObjectToJSON(Statics.COMPONENT_JSON_FILEPATH,components);
    await serviceManager.init(that);
  }


  setAllComponentStates(){
    components.forEach(c => {
      if(c.state == 1){
        that.setGpioState(c);
      }
    });
  }

  async openConnection(){

    var connectionIp = config.IP.WEBSERVER;

    console.log("connecting to " + connectionIp);
    socket = new WebSocket("ws://"+connectionIp);

    socket.on('open', function() {
      console.log('Connection Opened');
    });

    socket.on('error', function(error) {
      console.log('error: %s', error);
    });
    socket.on('close', function(error) {
      console.log('closed connection : %s', error);
      that.retryConnection();
    });

    socket.on('message', that.handleWebserverMessage);
  }

  handleWebserverMessage(message){
    var parsedMessage = JSON.parse(message);
    console.log("incoming message: "+message);
    if(parsedMessage == "PING"){
      socket.send(JSON.stringify("PONG"));
      return;
    }

    var data = JSON.parse(parsedMessage.data);
    switch (parsedMessage.type){
      case 'get':{
        if(parsedMessage.target === 'component'){
          that.respondWithComponents();
          return;
        }
        else if(parsedMessage.target === 'event'){
          that.respondWithEvents();
          return;
        }
        break;
      }

      case 'update':{
        if(parsedMessage.target === 'component'){
          var component = components.find(a => a.id == data.component.id);
          that.updateAndReturnComponent(data.action, component);
        }
        else if(parsedMessage.target === 'event'){
          var oldEvent = serviceManager.sv_events.events.find(a => a.id == data.oldId)
          that.updateAndReturnEvent(oldEvent, data.event);
        }
        break;
      }
      case 'updateValues':{
        if(parsedMessage.target === 'component'){
          console.log(message);
          var oldComponent = components.find(a => a.id == data.oldCompId);
          that.updateValuesAndReturnComponent(oldComponent, data.component);
        }
        break;
      }
      case 'insert':{
        if(parsedMessage.target === 'event'){
          that.insertEventAndRespond(data.event);
        }
        break;
      }
      case 'delete':{
        if(parsedMessage.target === 'event'){
          that.deleteEventAndRespond(data.event);
        }
        break;
      }
    }
  }

  respondWithComponents(){
    socket.send(JSON.stringify({type:'ret-get-component', responseData:components}));
  }

  respondWithEvents(){
    socket.send(JSON.stringify({type:'ret-get-event', responseData:serviceManager.sv_events.events}));
  }

  updateAndReturnComponent(action, component){
    if(action == 'toggle'){
      that.handleToggleAction(component);
    }
    socket.send(JSON.stringify({type:'ret-update-component', responseData:[component]}));
    that.writeComponentsToFile();
  }

  updateValuesAndReturnComponent(oldComponent, component){
    if(!oldComponent)
    {
      console.log("RESPONDING WITH AN ERROR");
      socket.send(JSON.stringify({type:'ret-updateValues-component', error:"oldComponent Not Found"}));
      return;
    }
    oldComponent.name = component.name;
    oldComponent.id = component.id;

    socket.send(JSON.stringify({type:'ret-updateValues-component', responseData:[oldComponent]}));
    that.writeComponentsToFile();
  }

  updateAndReturnEvent(oldEvent, newEvent){
    if(!that.eventIsValidAndNotNull){
      socket.send(JSON.stringify({type:'ret-update-event', error:"Null or poorly formed"}));
    }

    if(oldEvent){
     var index = serviceManager.sv_events.events.indexOf(oldEvent);
     serviceManager.sv_events.events.splice(index, index+1);
    }
     serviceManager.sv_events.events.push(newEvent);

    socket.send(JSON.stringify({type:'ret-update-event', responseData:[newEvent]}));
    serviceManager.sv_events.writeEventsToFile();
    serviceManager.sv_events.registerEventCallback(newEvent);
    //set timeout for new event
  }

  insertEventAndRespond(newEvent){
    if(!that.eventIsValidAndNotNull){
      socket.send(JSON.stringify({type:'ret-insert-event', error:"Null or poorly formed"}));
    }
    serviceManager.sv_events.events.push(newEvent);
    console.log("adding this event" + newEvent);


    socket.send(JSON.stringify({type:'ret-insert-event', responseData:[newEvent]}));
    serviceManager.sv_events.writeEventsToFile();
    serviceManager.sv_events.registerEventCallback(newEvent);
  }


  deleteComponentAndRespond(component){
    try{
      var index = components.indexOf(component);
      components.splice(index, index+1);
      socket.send(JSON.stringify({type:'ret-delete-event', responseData:true}));
    }
    catch(err){
      socket.send(JSON.stringify({type:'ret-delete-event', responseData:false}));
    }
    that.writeComponentsToFile()
  }

  deleteEventAndRespond(inEvent){
    try{
      var event = serviceManager.sv_events.events.find(a => a.id == inEvent.id)
      var index = serviceManager.sv_events.events.indexOf(event);
      if(index<0)
        throw new Error("IndexNotFound");
      serviceManager.sv_events.events.splice(index, index+1);
      socket.send(JSON.stringify({type:'ret-delete-event', responseData:true}));
      serviceManager.sv_events.writeEventsToFile();

    }
    catch(err){
      socket.send(JSON.stringify({type:'ret-delete-event', responseData:false}));
    }
  }

  handleToggleAction(component){
    component.state = (component.state+1) % 2;
    that.setGpioState(component);
  }

  setGpioState(component){
    //UNCOMMENT FOLLOWING LINE ONLY ON PI
    //gpio.setButtonState(component.gpioPin, component.state);
  }

  eventIsValidAndNotNull(event){
    return (event &&
      event.id &&
      event.active &&
      event.repeat &&
      event.action &&
      (event.dateTime || event.time)
    );
  }

  retryConnection(){
    setTimeout(function(){
      that.openConnection();
    }, 500);
  }

  writeComponentsToFile(){
    FileIO.WriteObjectToJSON(Statics.COMPONENT_JSON_FILEPATH, components);
    console.log("WRITTEN components TO FILE");
  }
}


module.exports = SocketClient;
