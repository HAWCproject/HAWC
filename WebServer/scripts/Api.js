const FS = require('fs');
const Statics = require('./Statics');

const ComponentActions = [
  "toggle",
  "setname"
];


var that;

class API{
  constructor(socServer){
    that = this;

    that.socketServer = socServer;
  }

  async handleApiRequest(req, res, parsedUrl){
    var socketResponse;
    try{
      var type = parsedUrl.searchParams.get('type');
      var target = parsedUrl.searchParams.get('target');
      var data = parsedUrl.searchParams.get('data');

      socketResponse = await that.socketServer.requestAsync(type, target, data);
    }catch(err){
      console.log("error Response for failed Async update sent: "+ err);
      that.sendErrorResponse(550, res, err);
      return;
    }
    if(socketResponse.error){
      that.sendErrorResponse(999,res, socketResponse.error.message);
      return;
    }
    var jsonComponents = JSON.stringify(socketResponse.responseData);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(jsonComponents);
    res.end();
  }

  sendErrorResponse(errorID, res, message){
    res.writeHead(errorID.toString(), {'Content-Type': 'text/html'});
    res.write(message.toString());
    res.end();
  }
}

module.exports = API;
