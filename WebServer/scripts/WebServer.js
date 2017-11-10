const HTTP = require('http');
const Service = require('./Service');

class WebServer{

  constructor(socServer){
    this.service = new Service(socServer);
    this.socketServer = socServer;
  }

  startServer(){
    var server = HTTP
      .createServer((request, response)=>this.directIncomingRequest(request,response))
      .listen(80);
    console.log("http Listening");
  }


  directIncomingRequest(request,response){
    if(request.method == 'POST'){
      this.sanitiseAndForwardPost(request,response);
    }
    else {
      this.service.handleHttpRequest(request,response)
    }
  }

  //this prevents POST streams that are too large from killing server
  sanitiseAndForwardPost(request,response){
      var queryData = "";
      request.on('data', function(data) {
       queryData += data;
       if(queryData.length > 1e6) {
           queryData = "";
           response.writeHead(413, {'Content-Type': 'text/plain'}).end("Too large");
           request.connection.destroy();
       }
   });
   request.on('end', ()=>
   {
     request.body = queryData;
     this.service.handlePost(request, response);
   });
  }
}
  module.exports = WebServer;
