const FileIO = require('../FileIO');
const Statics = require('../Statics');

var that;

class Sv_Events{
  constructor(){
    that = this;
    that.OnTemporalEventEnd;
    that.events=[];
    that.timeouts=[];
  }

  async init(){
    try{
      var data = await FileIO.ReadAndParseJSON(Statics.EVENT_JSON_FILEPATH);
      console.log();
	     that.events = data;

       console.log("eventCount " + that.events.length);
	      that.events.forEach(e => {that.registerEventCallback(e)});
    }catch(err){
      console.log(err);
    }
  }

  registerEventCallback(event){
    if(event.active === 0){  return; }
    if(event.type === "temporal"){
      that.createTemporalEvent(event);
    }
  }

  writeEventsToFile(){
    FileIO.WriteObjectToJSON(Statics.EVENT_JSON_FILEPATH, that.events);
    console.log("WRITTEN EVENTS TO FILE");
  }

//#REGION ---------temporal event----------------------//
  createTemporalEvent(event){
    var duration;
    if(event.repeat === 0){
      var eventDate = new Date(event.dateTime);
      duration = that.getMillisTillDate(eventDate);

      //if the date has already passed then do net set a timeout
      if(duration < 0){ return; }

    }

    else if(event.repeat == 1 && event.days.length > 0){
      //i dislike this repeat but am too lazy to fix now
      for (var i = 0; i < event.days.length; i++) {
        if(that.eventDayIsAfterNow(event.days[i], event.time)){
          var diff = event.days[i] - new Date().getDay();
          var eventDate = that.getOffsetEventDate(event,diff);
          duration = that.getMillisTillDate(eventDate);
          break;
        }
      }

      //duration can be null here if no days inthe event.days array are after now. this sets
      //callback to the earliest(first) day of that array
      if(!duration){
        var diff = (7 + event.days[0] - new Date().getDay());
        var eventDate = that.getOffsetEventDate(event,diff);
        duration = that.getMillisTillDate(eventDate);
      }
    }

    console.log("Timeout Duration: "+(duration/1000) );
    var eventString = JSON.stringify(event);
    //this is a quick and dirty method to check if the event still exists, if it has changed then the callback will return immediatly

	  setTimeout(()=>{
      that.OnTemporalEventEnd(eventString);
    },duration);
  }

  getOffsetEventDate(event, offset){
    var eventDate = new Date();
    eventDate.setDate(eventDate.getDate()+offset);
    eventDate.setHours(event.time.substring(0,2));
    eventDate.setMinutes(event.time.substring(3,5));
    eventDate.setSeconds(0);
    eventDate.setMilliseconds(0);
    return eventDate;
  }

  getMillisTillDate(eventDate){
	  var now = new Date();
	  return eventDate.getTime() - now.getTime();
  }

  //does the event occur at a time later in this week
  eventDayIsAfterNow(dayOfWeek, timeString){
    var now = new Date();
    return dayOfWeek > now.getDay() ||
                (dayOfWeek >= now.getDay()
                && timeString.substring(0,2) >= now.getHours()
                && timeString.substring(3,5) > now.getMinutes());
  }
  //#ENDREGION ---------temporal event----------------------//
}

module.exports = Sv_Events
