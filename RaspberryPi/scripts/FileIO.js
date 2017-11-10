const FS = require('mz/fs');

class FileIO{

  static async WriteObjectToJSON(filePath, object){
    var data = JSON.stringify(object);
    FS.writeFile(filePath, data);
  }

  static async ReadAndParseJSON(filePath){
    var data = await FS.readFile(filePath);
    if(data.length <=0 ){
      return null;
    }

    return JSON.parse(data);
  }
}


module.exports = FileIO;
