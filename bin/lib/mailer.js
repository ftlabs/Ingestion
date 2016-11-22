const debug = require('debug')('bin:lib:mailer');
const fetch = require('node-fetch');

// via https://email-webservices.ft.com/docs/email-simple/#api-Send-Post_send_by_address

const recipients           = (process.env.MAIL_RECIPIENTS !== undefined) ? process.env.MAIL_RECIPIENTS.split(',') : ['ftlabs@ft.com'];
const from_email_subdomain = process.env.FROM_EMAIL_SUBDOMAIN;
const from_email_prefix    = process.env.MAIL_FROM_PREFIX;
const from_email_name      = process.env.MAIL_FROM_NAME;
const mail_post_url        = process.env.MAIL_POST_URL;
const mail_post_auth_token = process.env.MAIL_POST_AUTH_TOKEN;

const from_email_address   = from_email_prefix + '@' + from_email_subdomain;
const defaultSubject       = 'Audio file retrieved from Spoken Layer';

function sendMessage(data){
	debug('sendMessage: data=' + JSON.stringify(data));

	let subject = `Audio file retrieved from Spoken Layer: ${data.title}, ${data.itemUUID}`;
	let plainTextContent = `
This email is being sent to ${recipients.join(", ")}.

A new audio file has been retrieved from Spoken Layer
for article ${data.itemUUID},
title: ${data.title}.

You can find the FT copy at 
${data.ftCopyUrl}

and the Spoken Layer copy at 
${data.slCopyUrl}.

The Ingestor admin page is
${data.ingestorAdminUrl}
`;

	var post_body_data = {
		transmissionHeader: {
			description: "alerting that Spoken Layer have generated a human-voiced audio file for another article",
		    metadata: {
		        uuid: data.itemUUID
		    },
		},
		to: {
		    address: recipients
		},
		from: {
		    address: from_email_address,
		    name:    from_email_name
		},
		subject:          subject,
		htmlContent: "",
		plainTextContent: plainTextContent
	};

	debug(`sendMessage: post_body_data=${JSON.stringify(post_body_data)}`);

	fetch(mail_post_url, {
		method       : 'POST', 
		body         :  JSON.stringify(post_body_data),
		headers      : {
  			'Content-Type'  : 'application/json',
  			'Authorization' : mail_post_auth_token
  		}
	})
		.then(res => {

			if(res.status !== 200){
				let errMsg = `An error occurred sending email for data=${JSON.stringify(data)},\nres=${JSON.stringify(res)}`;
				debug(errMsg);
				throw errMsg;
			} else {
				debug(`Email sent, for data=${JSON.stringify(data)},\nwith res=${JSON.stringify(res)}`);
			}
		})
	;
}

module.exports = {
	send : sendMessage
};