const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const { Payload } =require("dialogflow-fulfillment");
const app = express();

const MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var randomstring = require("randomstring"); 
var username="";
var mytoken="";

app.post("/dialogflow", express.json(), (req, res) => {
    const agent = new WebhookClient({ 
		request: req, response: res 
		});


async function identify_user(agent)
{
  const mobile_num = agent.parameters.number.toString();
  console.log(mobile_num);
  const client = new MongoClient(url);

  await client.connect();
  const snap = await client.db("internetissueservicebot").collection("User Details").findOne({mobile_no: mobile_num});
  console.log(snap);
  if(snap==null){
	  await agent.add("Re-Enter your mobile number");

  }
  else
  {
  username=snap.username;
  await agent.add("Welcome  "+username+"!!  \n How can I help you");}
}
	
function report_issue(agent)
{
 
  var issue_vals={1:"Internet Down",2:"Slow Internet",3:"Buffering problem",4:"No connectivity"};
  
  const intent_val=agent.parameters.number1;
  
  var val=issue_vals[intent_val];
  
  var trouble_ticket=randomstring.generate(7);

  //Generating trouble ticket and storing it in Mongodb
  //Using random module
  MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("internetissueservicebot");
    
	var u_name = username;    
    var issue_val=  val; 
    var status="pending";

	let ts = Date.now();
    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();

    var time_date=year + "-" + month + "-" + date;

	var myobj = { username:u_name, issue:issue_val,status:status,time_date:time_date,trouble_ticket:trouble_ticket };

    dbo.collection("Usre Issues").insertOne(myobj, function(err, res) {
    if (err) throw err;
    db.close();    
  });
 });
 agent.add("The issue reported is: "+ val +"\nThe ticket number is: "+trouble_ticket);
 mytoken=trouble_ticket;
}

//trying to load rich response
function custom_payload(agent)
{
	var payLoadData=
		{
  "richContent": [
    [
      {
        "type": "list",
        "title": "Internet Down",
        "subtitle": "Press '1' for Internet is down",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "Slow Internet",
        "subtitle": "Press '2' Slow Internet",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
	  {
        "type": "divider"
      },
	  {
        "type": "list",
        "title": "Buffering problem",
        "subtitle": "Press '3' for Buffering problem",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "No connectivity",
        "subtitle": "Press '4' for No connectivity",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      }
    ]
  ]
}
agent.add(new Payload(agent.UNSPECIFIED,payLoadData,{sendAsMessage:true, rawPayload:true }));
}




var intentMap = new Map();
intentMap.set("service", identify_user);
intentMap.set("service-custom-custom", report_issue);
intentMap.set("service-custom", custom_payload);

agent.handleRequest(intentMap);

});//Closing tag of app.post

app.listen(85,()=>console.log('server running'));
console.log(mytoken);