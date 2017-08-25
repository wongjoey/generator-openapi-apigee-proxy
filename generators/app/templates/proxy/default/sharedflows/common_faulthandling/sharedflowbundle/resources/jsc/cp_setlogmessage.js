var XForwardedFor = context.getVariable("request.header.X-Forwarded-For");
var requestMessageUri = context.getVariable("request.uri");
var requestVerb = context.getVariable("request.verb");
var clientReceivedStartTimeStamp = context.getVariable("client.received.start.timestamp");
var systemTimeStamp = context.getVariable("system.timestamp");
var requestHeaderAccept = context.getVariable("request.header.Accept");
var requestMessageSize = context.getVariable("request.header.Content-Length");
var correlationId = context.getVariable("request.queryparam.correlationId");
var responseStatusCode = context.getVariable("response.status.code");
var productName = context.getVariable("apiproduct.name");
var errorState = context.getVariable("error.state");
var targetSentStartTimeStamp = context.getVariable("target.sent.start.timestamp");
var targetReceivedEndTimeStamp = context.getVariable("target.received.end.timestamp");
var targetURL = context.getVariable("target.url");
var targetReceivedContentLength = context.getVariable("target.received.content.length");
var rateLimitExceedCount = context.getVariable("ratelimit.rate_limit.class.exceed.count");
var targetMessageSize = context.getVariable("response.header.Content-Length");

var totalRequestTime = (systemTimeStamp-clientReceivedStartTimeStamp) +'';
var totalTargetTime = (targetReceivedEndTimeStamp-targetSentStartTimeStamp)+'';
var logMessage =  "system.timestamp = " + systemTimeStamp 
				 + " | request.header.X-Forwarded-For = " + XForwardedFor
			     + " | client.received.start.timestamp = " + clientReceivedStartTimeStamp
			     + " | request.uri = " + requestMessageUri
			     + " | request.verb = " + requestVerb
			     + " | request.header.Accept = " + requestHeaderAccept
			     + " | requestMessageSize = " + requestMessageSize
			     + " | correlationId = " + correlationId
			     + " | response.status.code = " + responseStatusCode
			     + " | productName = " + productName
			     + " | rateLimitExceedCount = " + rateLimitExceedCount
			     + " | error.state = " + errorState
			     + " | target.url = " + targetURL
			     + " | targetMessageSize = " + targetMessageSize
			     + " | target.sent.start.timestamp = " + targetSentStartTimeStamp
			     + " | target.received.end.timestamp = " + targetReceivedEndTimeStamp
			     + " | targetReceivedContentLength = " + targetReceivedContentLength 
			     + " | totalRequestTimeinMillis = " + totalRequestTime
			     + " | totalTargetTimeinMillis = " + totalTargetTime
			     
context.setVariable("logging.loglevel","ERROR");			     
context.setVariable("logging.message",logMessage); 