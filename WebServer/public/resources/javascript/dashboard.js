var components = [];
var events = [];

var awaitingUpdateResponse = false;

var componentFramePopup = createFramePopup("/dialogHtml/componentEditDialog.html");
var eventPopup = createFramePopup("/dialogHtml/eventEditDialog.html");

window.onload = function(){
  if(!('content' in document.createElement('template'))){
  	alert('browser does not support template system used, try another browser');
  	return;
  }
  addButtonClickHandler();
  ajaxGetAllComponents();
}

function createAjaxConfig(type, target, data){
  return {type:type, target: target, data:data};
}

function ajaxGetAllComponents(){
  var callbacks = {};
  callbacks.success = function(responseText){
    components = JSON.parse(responseText);
    renderComponents();
    setLoadingGifDisplay('none');
    setComponentErrorMessageDisplay('none');
  };
  callbacks.controllerError = function(responseText){
    setLoadingGifDisplay('none');
    replaceAllComponents(new Array());
    setComponentErrorMessageDisplay("block");
  };

  var config = createAjaxConfig("get","component",JSON.stringify(false));
  sendXhttpMessage(config, callbacks);
}

function ajaxGetAllEvents(){
  var callbacks = {};
  callbacks.success = function(responseText){
    events = JSON.parse(responseText);
    renderEvents();
    setEventErrorMessageDisplay('none');
  };
  callbacks.controllerError = function(responseText){
    replaceAllEvents(new Array());
    setEventErrorMessageDisplay("block");
  };

  var config = createAjaxConfig("get","event",JSON.stringify(false));
  sendXhttpMessage(config, callbacks);
}

function ajaxUpdateComponent(component, action){
  var callbacks = {};
  callbacks.success = function(responseText){
    var updatedComponent = JSON.parse(responseText)[0];
    removeComponent(component);
    addComponent(updatedComponent);
    setComponentErrorMessageDisplay("none");
    awaitingUpdateResponse = false;
  };
  var config = createAjaxConfig("update","component",JSON.stringify({action:action, component:component}));

  awaitingUpdateResponse = true;
  sendXhttpMessage(config, callbacks);
}

function ajaxChangeComponentValues(oldComponent, newComponent){
  var callbacks = {};
  callbacks.success = function(responseText){
    var updatedComponent = JSON.parse(responseText)[0];
    removeComponent(oldComponent);
    addComponent(updatedComponent);
    setComponentErrorMessageDisplay("none");
    awaitingUpdateResponse = false;
  };
  var config = createAjaxConfig("updateValues","component",JSON.stringify({oldCompId:oldComponent.id, component:newComponent}));

  awaitingUpdateResponse = true;
  sendXhttpMessage(config, callbacks);
}



function ajaxUpdateEvent(oldId, newEvent){
  var callbacks = {};
  callbacks.success = function(responseText){
    var updatedEvent = JSON.parse(responseText)[0];
    var oldEvent = events.find(index => index.id == oldId);
    var oldEventIndex = events.indexOf(oldEvent);
    events.splice(oldEventIndex, 1);
    events.push(updatedEvent);
    renderEvents();
    setEventErrorMessageDisplay("none");
    awaitingUpdateResponse = false;
  };

  callbacks.errorResponse = function(responseText){
    console.log("error response returned. Event has not been updated");
    awaitingUpdateResponse = false;
    ajaxGetAllEvents();
  };

  var config = createAjaxConfig("update","event",JSON.stringify({oldId:oldId, event:newEvent}));

  awaitingUpdateResponse = true;
  sendXhttpMessage(config, callbacks);
}

function sendXhttpMessage(config, callbacks){
  var xhttp = new XMLHttpRequest();

  xhttp.onreadystatechange = function() {
    if (callbacks.success && this.readyState == 4 && this.status == 200){
      callbacks.success(this.responseText);
    }
    else if (callbacks.controllerError && this.readyState == 4 && this.status == 550){
      callbacks.controllerError(this.responseText);
    }
    else if (callbacks.errorResponse && this.readyState == 4 && this.status == 999){
      callbacks.errorResponse(this.responseText);
    }
  };

  xhttp.open("get", "/update.ctrl?type=" + config.type + "&target=" + config.target + "&data=" + config.data, true);
  xhttp.send();
}

function ajaxDeleteEvent(event){
  var callbacks = {};
  callbacks.success = function(responseText){
    var response = JSON.parse(responseText);
    if(response){
      var eventIndex = events.indexOf(event);
      events.splice(eventIndex, 1);
      ajaxGetAllEvents();
    }else{
      console.log("Delete failed, error or id does not exist");
      ajaxGetAllEvents();
    }
    renderEvents();
    setEventErrorMessageDisplay('none');
  };
  callbacks.controllerError = function(responseText){
    replaceAllEvents(new Array());
    setEventErrorMessageDisplay("block");
  };

  var config = createAjaxConfig("delete","event", JSON.stringify({event:event}));
  sendXhttpMessage(config, callbacks);
}

function ajaxAddEvent(newEvent){

  var callbacks = {};
  callbacks.success = function(responseText){
    var newEvent = JSON.parse(responseText)[0];
    events.push(newEvent);
    renderEvents();
    setEventErrorMessageDisplay("none");
    awaitingUpdateResponse = false;
  };

  var config = createAjaxConfig("insert","event", JSON.stringify({oldId:undefined, event:newEvent}));
  awaitingUpdateResponse = true;
  sendXhttpMessage(config, callbacks);
}

function addButtonClickHandler(){
document.getElementById("componentList").addEventListener("click", listItemClick);
}

function setLoadingGifDisplay(state){
  // document.getElementById('loadingGif').style.display=state;
  document.getElementById('loadingGif').style.display="none";

}

function setComponentErrorMessageDisplay(state){
  document.getElementById("components").getElementsByClassName('errorOutput')[0].style.display=state;
}

function setEventErrorMessageDisplay(state){
  document.getElementById("events").getElementsByClassName('errorOutput')[0].style.display=state;
  document.getElementById("addEventButton").style.display = ((state == "block")? "none": "inline block");

}

function listItemClick(event){
  var target = event.target;
  if(!target.classList.contains("componentButton")){return;}

  //fast way of only allowing a single update at once
  if(awaitingUpdateResponse)return;

  var clickedId = [...target.parentNode.children].filter(child => child.classList.contains("componentId"))[0].innerText;
  var clickedComponent = components.filter(component => component.id == clickedId)[0];

//if more options other than toggle were available then update hard coded "toggle"
  ajaxUpdateComponent(clickedComponent, "toggle");

}

function renderComponents(){
  document.getElementById("componentList").innerHTML = "";

  sortComponents();
  var list = document.getElementById("componentList");
  components.forEach(component =>
  {
    switch (component.type)
    {
      case "toggleButton":{
        list.appendChild(createButtonNode(component.name, component.id, component.state));
        break;
      }
      case "valueOutput":{
          list.appendChild(createValueOutputNode(component.name, component.id, component.value));
        break;
      }
    }
  });
}

function createButtonNode(name, id, state){
var template = document.getElementById("buttonTemplate");
var fields = template.content.querySelectorAll("div, button");
fields[1].textContent =name;
fields[2].textContent = id;
fields[3].setAttribute("state", state);
fields[3].textContent = (state==0)? "OFF":"ON";
return document.importNode(template.content, true);
}

function createValueOutputNode(name, id, value){
var template = document.getElementById("valueOutputTemplate");
var fields = template.content.querySelectorAll("div");
fields[0].textContent = name;
fields[1].textContent = id;
fields[2].textContent = value;
return document.importNode(template.content, true);
}

function addComponent(component)
{
  components.push(component);
  renderComponents();
}

function removeComponent(component)
{
  var index = components.indexOf(component);
  components.splice(index,1);
  renderComponents();
}

function replaceAllComponents(newComponents)
{
  components = newComponents;
  renderComponents();
}

function replaceAllEvents(newEvents)
{
  events = newEvents;
  renderEvents();
}
function sortComponents(){
  var typeFlag = {'toggleButton':1, 'valueOutput':2}; //used to order types
  var selectedFilter = document.getElementById("components").getElementsByClassName("sortingOrderBy")[0].selectedOptions[0].innerText;
  if(selectedFilter == "Id"){
    components.sort((a, b) =>{return a.id-b.id});
  }
  else if(selectedFilter == "Type"){
    //sorts by type and then also by id
    components.sort((a, b) => {
        if(a.type == b.type)
           return a.id > b.id;
       return typeFlag[a.type] > typeFlag[b.type];
     });
  }
  else if(selectedFilter == "State"){
    //sorts by state and id, moves things witohut a state value to the bottom
    components.sort((a, b) => {
        if(a.state==undefined)
            return true;
        else if(b.state == undefined)
            return false;

        if(a.state == b.state)
           return a.id > b.id;

       return a.state < b.state;
     });
  }
}

function sortEvents(){
  var selectedFilter = document.getElementById("events").getElementsByClassName("sortingOrderBy")[0].selectedOptions[0].innerText;

  switch (selectedFilter){
    case "Id":{
      events.sort((a, b) =>{return a.id-b.id});
      break;
    }
    case "Active":{
      events.sort((a, b) => {
          if(a.active == b.active)
             return a.id > b.id;

         return a.active < b.active;
       });
      break;
    }
  }
}

function SortingChanged(){
  renderComponents();
  renderEvents();
}

function displayComponents(){
  document.getElementById("events").style.display = "none";
  document.getElementById("components").style.display = "block";
  ajaxGetAllComponents();

}

function displayEvents(){
  document.getElementById("events").style.display = "block";
  document.getElementById("components").style.display = "none";
  ajaxGetAllEvents();
}

function renderEvents(){
  document.getElementById("eventList").innerHTML = "";

  sortEvents();
  var list = document.getElementById("eventList");
  events.forEach(event =>
  {
    list.appendChild(createEventNode(event));
  });
}

function createEventNode(event){
  if(event.repeat && !event.days){
    event.days = [];
  }

  var template = document.getElementById("eventTemplate");
  var fields = template.content.querySelectorAll("div");
  fields[0].textContent = "active: " + ((event.active==0)?"False":"true");
  fields[1].textContent = "ID: "+ event.id;

  var date = "";
  var time = "";
  if(event.repeat){
    var time = event.time;
  }
  else{
    var dateTime = new Date(event.dateTime);
    date = dateTime.toString().substring(0,25);
  }

  fields[3].textContent = "Time: "+ date + time;
  fields[4].textContent = "Repeat: "+ ((event.repeat==0)?"False":"true " + event.days.toString());
  fields[5].textContent = "Action: "+ JSON.stringify(event.action);

  return document.importNode(template.content, true);
}

function editEventClick(clickEvent){
  var eventId = clickEvent.target.parentNode.parentNode.getElementsByClassName("eventId")[0].innerText.split(" ")[1];
  var currentEvent = events.find(index => index.id == eventId);
  var callback = function(){
    if(eventPopup.iframe.contentWindow.result){
      var newEvent = eventPopup.iframe.contentWindow.getValues();
      ajaxUpdateEvent(eventId, newEvent);
    }
  };
  eventPopup.show(currentEvent, callback);
}

function deleteEventClick(clickEvent){
  if(confirm("Are you sure you want to delete this event, This action cannot be undone")){
    var eventId = clickEvent.target.parentNode.parentNode.getElementsByClassName("eventId")[0].innerText.split(" ")[1];
    var event = events.find(index => index.id == eventId);
    ajaxDeleteEvent(event);
  }
}

function addEventClick(evt){
  var callback = function(){
    if(eventPopup.iframe.contentWindow.result){
      var newEvent = eventPopup.iframe.contentWindow.getValues();
      console.log(newEvent);
      ajaxAddEvent(newEvent);
    }
  };
  var nextId=0;
  while(events.find(e=>e.id == nextId))
  {
    nextId ++;
  }
  eventPopup.showBlank(nextId, callback);
}

function editComponentClick(event){
  var componentId = event.target.parentNode.getElementsByClassName("componentId")[0].innerText;
  var comp = components.find(comp => comp.id == componentId);

  var callback = function(){
    if (componentFramePopup.iframe.contentWindow.result){
      var result = componentFramePopup.iframe.contentWindow.getValues();
      if(comp.id != result.id ||
        comp.name != result.name){
          ajaxChangeComponentValues(comp, result);
        }
    }
  }
  componentFramePopup.show(comp, callback);
}
