var XForwardedFor = context.getVariable("request.header.X-Forwarded-For");
var requestMessageUri = context.getVariable("request.uri");
var requestVerb = context.getVariable("request.verb");
var clientReceivedStartTimeStamp = context.getVariable("client.received.start.timestamp");
var systemTimeStamp = context.getVariable("system.timestamp");
var requestHeaderAccept = context.getVariable("request.header.Accept");
var requestMessageSize = context.getVariable("request.header.Content-Length");

var totalRequestTime = (systemTimeStamp-clientReceivedStartTimeStamp) +'';
var logMessage =  "system.timestamp = " + systemTimeStamp 
				 + " | request.header.X-Forwarded-For = " + XForwardedFor
			     + " | client.received.start.timestamp = " + clientReceivedStartTimeStamp
			     + " | request.uri = " + requestMessageUri
			     + " | request.verb = " + requestVerb
			     + " | request.header.Accept = " + requestHeaderAccept
			     + " | requestMessageSize = " + requestMessageSize

context.setVariable("logging.message",logMessage); 