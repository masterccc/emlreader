const electron = require('electron');
const fs       = require('fs');
var emlformat  = require('eml-format');
var exec       = require('child_process').exec;
const app      = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipc      = electron.ipcMain;
let mainWindow;

var conf = {"folder" : "", "files": []} ;

function open_file_dialog(){
	 const {dialog} = require('electron');
		selected_folder = dialog.showOpenDialog({properties: ['openDirectory', 'multiSelections']});
		return selected_folder ;
}

function getFiles(folder, callback){

//console.log(folder);
	fs.readdir(folder, (err, files) => {
	    'use strict';
	    if (err) throw  err;
	    for (var file of files) {
	    	if(file.substr(-9) == ".eml.meta"){
	        	conf["files"].push(file);
	    	}
	    }
	    callback();
	});
}

function createWindow () {

  mainWindow = new BrowserWindow(
    { webPreferences: { nodeIntegration: true}, width: 1800, height: 1200}
    );

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  })
}


ipc.on('selectbox_event', (event, arg) => {
      dossier = open_file_dialog() 
      conf["folder"] = dossier[0] ;
      conf["files"] = [];  
      event.sender.send("folder", dossier);
});




ipc.on('loadfile', (event, arg) => {

  conf["files"] = [];  
  conf["folder"] = arg;

	getFiles(conf["folder"], function(){
		
        var meta_data = [];

		for(var i = 0; i < conf["files"].length ; i++ ){
       		var eml_meta = fs.readFileSync(conf["folder"]+'/'+conf["files"][i], "utf-8");
       		meta_data.push(eml_meta);
          console.log("reading " + conf["folder"]+'/'+conf["files"][i]);
        }
   		
        event.sender.send("dataset", JSON.stringify(meta_data));
	});
});

ipc.on('request_msg', (event, arg) => {

	console.log("Received from client : " + arg)
	var filename = conf["folder"]+'/'+conf["files"][arg];

	filename = filename.substring(0,filename.length-5);
	var eml_meta = fs.readFileSync(filename, "utf-8");

	emlformat.read(eml_meta, function(error, data) {
		if (error) return console.log(error);

        if(data.attachments){
            for(var i = 0; i < data.attachments.length;i++){

                var buff = new Buffer(data.attachments[i].data);
                data.attachments[i].data = buff.toString('base64');
            }
        }
        event.sender.send("mail_read", data);
	});
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

