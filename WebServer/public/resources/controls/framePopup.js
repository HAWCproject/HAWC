function createFramePopup(frameHtmlFile){
  var controlHtmlLocation = "/resources/controls/framePopup.html";
  var frameHtmlFilePath = frameHtmlFile;
  var container = {};
  var nextId=0;

  container.framePopupRootNode = null;
  container.iframe = null;


  container.show = function(object,callback){
    if(container.iframe.src!= frameHtmlFilePath || !object){
      container.iframe.src = frameHtmlFilePath;
    }
    if(object){
      container.iframe.onload = function() {
        container.iframe.contentWindow.setValues(object);
        container.iframe.contentWindow.onClose = callback;
        container.iframe.style.height = container.iframe.contentWindow.pageHeight + 'px';
        document.getElementById("framePopupContainer").style.display = "block";
        document.getElementById("framePopupMask").style.height = document.getElementsByTagName("body")[0].scrollHeight+"px";
      };
    }else{
      container.iframe.onload = function() {
        container.iframe.contentWindow.resetValues();
        container.iframe.contentWindow.onClose = callback;
        container.iframe.contentWindow.setId(nextId);
        container.iframe.style.height = container.iframe.contentWindow.pageHeight + 'px';
        document.getElementById("framePopupContainer").style.display = "block";
        document.getElementById("framePopupMask").style.height = document.getElementsByTagName("body")[0].scrollHeight+"px";
      };
    }


  }

  container.showBlank = function(id, callback){
    nextId=id;
    container.show(null, callback);
 }
  container.close = function(){

    document.getElementById("framePopupContainer").style.display = "none";
      container.iframe.contentWindow.onClose();
  }

  container.loadFramePopupHtml= function(){
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200){
        if(!document.getElementById("framePopupContainer")){
          container.framePopupRootNode = document.createRange().createContextualFragment(this.responseText).childNodes[0];
          container.iframe = container.framePopupRootNode.getElementsByTagName("iframe")[0];
          document.getElementsByTagName("body")[0].appendChild(container.framePopupRootNode);
          container.addFooterButtonHandlers();
        }
        else{
          container.framePopupRootNode = document.getElementById("framePopupContainer").parentNode;
          container.iframe = document.getElementById("framePopupFrame");
        }
      }
    };
    xhttp.open("get", controlHtmlLocation, true);
    xhttp.send();
  }

  container.addFooterButtonHandlers = function(){

    document.getElementById("frameDialogOk").addEventListener("click",()=>{container.iframe.contentWindow.result = true;container.close()});
    document.getElementById("frameDialogCancel").addEventListener("click",()=>{container.iframe.contentWindow.result = false;container.close()});
  }

  container.loadFramePopupHtml();
  return container;
}
