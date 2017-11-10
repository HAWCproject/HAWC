const SVE = require('./features/Sv_Events')

var that;

class ServiceManager{

  constructor(socClient){
    that = this;

    that.socketClient = socClient;
    this.sv_events;
  }

  async init(){
    that.sv_events = new SVE();
    that.sv_events.OnTemporalEventEnd = that.temporalEventCallback;

    await that.sv_events.init();
  }

  temporalEventCallback(eventJson){
    if(!that.sv_events.events){
      console.log("no events returning");
      return;
    }
    var event = JSON.parse(eventJson);

    console.log("Event object returned from the event is");
    console.log(event);

    var eventFound = false;
    that.sv_events.events.forEach(e => {
      if(JSON.stringify(e) == eventJson){
        eventFound = true;
      }
    });
    if(eventFound){
      if(!event.action){return;}  //shouldn't be needed but will prevent poorly formed events from crashing
      event.action.forEach(action => that.processAction(action));
    }
  }

  processAction(action){
    console.log(JSON.stringify(action));
  }
}
module.exports = ServiceManager;
