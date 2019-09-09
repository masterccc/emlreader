const ipc = require('electron').ipcRenderer;

var dataset = [];
var old_selected = -1 ;
/*
document.getElementById('select_folder_btn').addEventListener('click', () => {
    ipc.send('selectbox_event', );
});*/

document.getElementById('valid_folder_btn').addEventListener('click', () => {
    ipc.send('loadfile', document.getElementById('filename_chose').value);
});


function format_infos(from, froma, to, toa, date){
	txt = "<b>From :</b> " + from + " ("+ froma +")" ;
	txt += "<br><b>To :</b> " + to + " ("+ toa +")" ;
	txt += "<br><b>Date :</b> " + date; 
	return txt ;
}

function load_display(data){

	var html_list = document.getElementById("msglist");
	html_list.innerHTML = "";
	for(var i = 0 ; i < data.length ; i++){
		{
			var d = JSON.parse(data[i]);

			row = {
					"id":i,
					"subject":d.subject,
					"sender":d.sender,
					"size": d.size
			};

			var item = document.createElement("div");
			var item_name = document.createElement("div");
			var item_subject = document.createElement("div");
			var item_size = document.createElement("div");

			item.className = "item-list";
			item_name.className = "item-list-name";
			item_size.className = "item-list-size";
			item_subject.className = "item-list-subject";

			item_name.innerHTML = '♟ '+ row["sender"];
			item_size.innerHTML = '⚖ : ' + row['size'] + ' bytes';
			item_subject.innerHTML = '✉ ' + row["subject"];

			item.setAttribute("id", i);
			item.addEventListener('click', function(){
				ipc.send('request_msg',this.id);
				this.style.backgroundColor = "#404040";
			});

			item.appendChild(item_name);
			item.appendChild(item_subject);
			item.appendChild(item_size);
			html_list.appendChild(item);

			dataset[i] = row;
		}
	}
}



ipc.on('folder', (event, arg) => {
	console.log("choosed", arg);
    document.getElementById("filename_chose").innerHTML = arg[0];
});


ipc.on('dataset', (event, arg) => {
    load_display(JSON.parse(arg));
});

ipc.on('mail_read', (event, arg) => {

	row = {
		"date": arg.date,
		"from_mail": arg.from.email, 
		"from_name": arg.from.name,
		"subject": arg.subject,
		"text": arg.text,
		"attachments": arg.attachments
	};

	if(!arg.to){
		row['to_mail'] = "Unknow";
		row['to_name'] = "(Unknow)";
	}
	else {
		row['to_mail'] = arg.to.email ;
		row['to_name'] = arg.to.name ;
	}

	console.log("Reading message");
	console.log(arg);

	document.getElementById('mailinfos_sub').innerHTML = row['subject'][0].toUpperCase() + row['subject'].substring(1);
    document.getElementById('mailinfos').innerHTML = format_infos(row["from_name"],row["from_mail"],row["to_name"],row["to_mail"],row["date"]);

	lMCsf = document.getElementById('mailcontent');
	lMCsf.innerHTML = "" ;

	if(row.attachments){
		lMCsf.innerHTML += "Attached file(s) :";
		for(var i = 0; i < row.attachments.length;i++){

			try {
				var filetype = row.attachments[i].contentType.split(';')[0] ;
			} catch(e){
				var filetype = "text/ascii";
			}

			var att = document.createElement("div");
			att.className = "msg_attachment";

			var link = document.createElement("a");
			link.className = "a_attachment";

			if(row.attachments[i] && row.attachments[i].name)
				link.download = row.attachments[i].name;
			else row.attachments[i].name= "undef_file";

			link.href= 'data:'+filetype+';base64,' + row.attachments[i].data;
			link.innerHTML = row.attachments[i].name;
			link.innerHTML += ' (' + filetype + ')';
			link.innerHTML += ' - ' + (row.attachments[i].data.length) + ' bytes';

			

			att.appendChild(link);
			lMCsf.appendChild(att);
			
		}

		var sep = document.createElement("hr");
		sep.className = "attachment_sep";
		lMCsf.appendChild(sep);
	}

	lMCsf.innerHTML += '<p><pre>' + row.text + '</pre></p>' ;

});