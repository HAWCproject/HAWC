const {URL} = require('url');
const API = require('./Api');
const FS = require('fs');
const Statics = require('./Statics');

//used so that the 'this' keyword cant add confusion
var that;

class Service{

  constructor(socServer){
    that = this;
    that.api = new API(socServer);
  }

//--------------------------Start Post handles------------------------//
  handlePost(req, res){
    var parsedUrl = that.getParsedUrl(req);
    console.log("POST@\t"+ parsedUrl.pathname);

    var postBody = that.parsePostBody(req.body);
//this was a intended as a temporary solution till we got a database set up but did not get to that stage
    if(postBody['email'] === "HAWKS%40gmail.com"
      && postBody['password'] === "password123"
    ){
      console.log("LOGIN SUCCESS");

      //var expiry = new Date(new Date().getTime() + 1000 * 60); If exiry not session cookie is set
      res.writeHead(302, {'Location': '/dashboard.html',"Set-Cookie":"S*=5P53Jd9(dhra!4k"});
      res.end();
    }
    else {
      console.log("LOGIN Failed");
      res.writeHead(302, {'Location': '/login.html'});
      res.end();
    }
  res.end("asd");
  }

parsePostBody(body){
  var items = [];
  body.split("&").forEach(item =>
    {
       var pair = item.split("=");
       items[pair[0]] = pair[1];
    });
    return items;
}
//--------------------------End Post handles------------------------//

  //every http request comes through here, including images/html/css/javasript and controller defined extensions
  handleHttpRequest(req, res){

    var parsedUrl = that.getParsedUrl(req);
    console.log("GET@\t"+parsedUrl.pathname
    +((parsedUrl.searchParams.get('type'))? ":"+parsedUrl.searchParams.get('type'):"")
    +((parsedUrl.searchParams.get('target'))? ":"+parsedUrl.searchParams.get('target'):"")
        + "  \t\trequested by"+req.connection.remoteAddress );

    //redirect to index
    if(parsedUrl.pathname== "/")
    {
      parsedUrl.pathname = Statics.HTTP_INDEX;
    }

    //forward any requests that the controller api handles and it will take action and respond
    if(that.extensionIsHandledByApi(parsedUrl.pathname)){
      try{
        that.api.handleApiRequest(req, res, parsedUrl);
      }catch(error){
        console.log("error in api Handle -> " + error);
      }
      return;
    }

    //allow users to omit the .html from urls and assume that is the desired extension
    if(!parsedUrl.pathname.includes('.')){
      parsedUrl.pathname += ".html";
    }

    //determine what is being requested and set the header values
    if(parsedUrl.pathname.includes('.css')){
      res.writeHead(200, {'Content-Type': 'text/css'});
    }
    else if(parsedUrl.pathname.includes('.js')){
      res.writeHead(200, {'Content-Type': 'text/javascript'});
    }
    else if(parsedUrl.pathname.includes('.gif')){
      res.writeHead(200, {'Content-Type': 'image/gif'});
    }
    else if(parsedUrl.pathname.includes('.ico')){
      res.writeHead(200, {'Content-Type': 'image/x-icon'});
    }

    //direct html and perfor the index.html default route
    else if(parsedUrl.pathname.includes('.html')){

      if(parsedUrl.pathname == '/dashboard.html' && !that.isLoggedIn(req))
        {
          res.writeHead(302, {'Location': '/login.html'});
          res.end();
          return
        }
        if(parsedUrl.pathname == '/login.html' && that.isLoggedIn(req))
          {
            res.writeHead(302, {'Location': '/dashboard.html'});
            res.end();
            return
          }
      res.writeHead(200, {'Content-Type': 'text/html'});

    }else{
      //if the file type extension was not hadled then respond with failed attempt
      res.writeHead(400, {'Content-Type': 'text/plain'});
      res.end("Unexpected Type");
      return;
    }

    //by this point all incorrectly formed urls have been dealt with,
    //load the file from the file system and respond with the data, or a 404 error if no file
    var filePath = that.getPublicFilePath(parsedUrl.pathname);
    FS.readFile(filePath, (err, data)=>{
      if (err) {
        res.writeHead(400, {'Content-Type': 'text/html'});
        that.writeMessageAndSendResponse("404 File Not Found", res);
        return;
      }
      that.writeMessageAndSendResponse(data, res)
    });
  }

//this method redirects all requests to the "public" folder to isolate publically accessable files
  getPublicFilePath(url){
    if(url == '/'){
      url = '/dashboard.html';
    }
    return Statics.HTTP_PUBLIC_DIR + url;
  }

  getParsedUrl(req){
    return new URL('http://' + req.headers.host + req.url);
  }

  //checks extension against the stored array of extensions that are used to perform actions with the raspberry pi
  extensionIsHandledByApi(url){
    return Statics.API_EXTENSIONS.some(token => {return url.includes(token)})
  }

  writeMessageAndSendResponse(message, res){
    res.write(message);
    res.end();
  }

  //checks a logged in cookie is set
  isLoggedIn(req){
    return req.headers.cookie && req.headers.cookie.startsWith("S*");
  }

  //simple return method which responds with the unauthorised header
  respondWithUnath(res){
    res.writeHead(401,{'Content-Type': 'text/html'});
    res.end("<h1>401 UNAUTH</h1>");
  }
}
module.exports = Service;
