try{
	var contentType = null;
    var reasonPhrase = null;
        
	// Obtain the current payload's content type
	//if the messageTextis not a part of the response object, it's a part of the error Object
	if(context.getVariable("response.header.Content-Type")){
		contentType = context.getVariable("response.header.Content-Type");
	}else if(context.getVariable("error.header.Content-Type")){
		contentType = context.getVariable("error.header.Content-Type");
	}else{
		contentType = null;
	}



	// if the reason phrase is not a part of the response object, it's a part of the error Object
	if(context.getVariable("message.reason.phrase")){
        reasonPhrase = context.getVariable("message.reason.phrase");
	}else if(context.getVariable("response.reason.phrase")){
		reasonPhrase = context.getVariable("response.reason.phrase");
	}else{
		reasonPhrase = context.getVariable("error.reason.phrase");
	}



	// if the status code is not a part of the response object, it's a part of the error Object
	if(context.getVariable("message.status.code")){
        statusCode = context.getVariable("message.status.code").toString();
	}else if(context.getVariable("response.status.code")){
		var statusCode = context.getVariable("response.status.code").toString();
	}else if(context.getVariable("error.status.code")) {
		var statusCode = context.getVariable("error.status.code").toString(); 
	}else{
		var statusCode = "NA";
	}


	// If a messageTextexists, handle the neccesary parsing to standardize fault responses
	if(contentType !== null || contentType === "" ){	
				
		// Obtain the current message payload.  Again, if it's not a part of the response object,
		// it's a part of the error object from a platform fault
		var messageText = context.getVariable("response.content");
		if((messageText === null) || (messageText === "")){
			messageText= context.getVariable("error.content");
			var payloadOrigin = "apigee";
		}
		
		// parse Apigee fault messages and force them cleanly into the template
		if(payloadOrigin == "apigee"){
			var faultName = context.getVariable("fault.name");
			if(faultName == "InvalidClientIdForGivenResource"){
				var statusCode = 403;
				var reasonPhrase = "Forbidden";
				messageText = "You are not authorized to access this API. Invalid input value for message part %1";
				var messageVariables = "[client_id]";
				var exceptionType = "Unauthorized";
				var messageId = "POL70002";
			}else if(faultName === "AppKeyNotResolved" || faultName === "apiresource_doesnot_exist" || faultName === "invalid_consumer_key" || faultName === "FailedToResolveAPIKey"){
				var statusCode = 401;
				var reasonPhrase = "Unauthorized";
				messageText = "Invalid Key. Invalid input value for message part %1";
				var messageVariables = "[client_id]";
				var exceptionType = "Unauthorized";
				var messageId = "POL70002";
			}else if( faultName == "InvalidAccessToken" || faultName == "invalid_access_token" || faultName == "access_token_expired" || faultName == "access_token_not_approved"){
				var statusCode = 401;
				var reasonPhrase = "Unauthorized";
				messageText = "Invalid access token. Invalid input value for message part %1";
				var messageVariables = "[access_token]";
				var exceptionType = "Unauthorized";
				var messageId = "POL70002";
			}else if(faultName == "SpikeArrestViolation"){
				var statusCode = 403;
				var reasonPhrase = "Forbidden";
				messageText = "SpikeArrest-The API call rate limit has been exceeded. Please try after 1000 ms.";
				var messageVariables = "[NA]";
				var exceptionType = "Forbidden";
				var messageId = "POL00009";
			}else if(faultName == "QuotaViolation"){
				var statusCode = 403;
				var reasonPhrase = "Forbidden";
				messageText = "The API call Quota limit has been exceeded for the hour. Please try again later.";
				var messageVariables = "[NA]";
				var exceptionType = "Forbidden";
				var messageId = "POL00009";
			}else if(faultName == "ServiceUnavailable"){
				var statusCode = 503;
				var reasonPhrase = "Service Unavailable";
				//messageText is set to context.getVariable("error.content")
				var messageVariables = "[NA]";
				var exceptionType = "ServiceUnavailable";
				var messageId = "SVC00000";
			}else {
				var statusCode = context.getVariable("cp.fault.statusCode");
				var reasonPhrase = context.getVariable("cp.fault.reasonPhrase");
				var exceptionType = context.getVariable("cp.fault.exceptionType");
				var messageId = context.getVariable("cp.fault.messageId");
				messageText = context.getVariable("cp.fault.messageText");
				var messageVariables = context.getVariable("cp.fault.messageVariables");
			}	
		}
	}
	
	if(reasonPhrase == "NA" || typeof reasonPhrase == 'undefined'){
		reasonPhrase = context.getVariable("message.reason.phrase");
		if(typeof reasonPhrase == 'undefined')
		{
			reasonPhrase = "Internal Server Error";
		}
	}
	if(exceptionType == "NA" || typeof exceptionType == 'undefined'){
		exceptionType = context.getVariable("message.reason.phrase");
		if(typeof exceptionType == 'undefined')
		{
			exceptionType = "NA";
		}
	} 
  	if(statusCode == "NA"  || typeof statusCode == 'undefined'){
		statusCode = context.getVariable("message.status.code");
		if(typeof statusCode == 'undefined')
		{
			statusCode = "500";
		}
	}
	if(messageText == "NA"  || typeof messageText == 'undefined'){
		messageText = context.getVariable("error.content");
		if(typeof messageText == 'undefined')
		{
			messageText = "NA";
		}
	}
  	if(messageId == "NA"  || typeof messageId == 'undefined'){
			messageId = "NA";
	}
  	if(messageVariables == "NA"  || typeof messageVariables == 'undefined'){	
			messageVariables = ["NA"];
	}  
	//set the fault response information used in the templates
	context.setVariable("custom.error.code", statusCode);
	context.setVariable("custom.error.reasonphrase", reasonPhrase);
  	context.setVariable("custom.error.exceptionType",exceptionType);
	context.setVariable("custom.error.messageId",messageId);
	context.setVariable("custom.error.messageVariables", messageVariables);
	context.setVariable("custom.error.messageText", messageText);
	context.setVariable("Status_Code", statusCode);  

}catch(e){

	// return a 500 ISE if javascript catches an un-handled exception
	var statusCode = 500;
	var reasonPhrase = "Internal Server Error";
	var messageText= "NA";
	var messageVariables = ["NA"];
	var messageId = "NA";

	//set the status_code for analytics.
	context.setVariable("Status_Code", statusCode);
	//set the fault response information used in the templates
	context.setVariable("custom.error.code", statusCode);
	context.setVariable("custom.error.reasonphrase", reasonPhrase);
	context.setVariable("custom.error.exceptionType",exceptionType);
	context.setVariable("custom.error.messageId",messageId);
	context.setVariable("custom.error.messageVariables", messageVariables);
	context.setVariable("custom.error.messageText", messageText);
	
}
