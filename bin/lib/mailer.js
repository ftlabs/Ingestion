const debug = require('debug')('bin:lib:mailer');
const helper = require('sendgrid').mail;
const sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
// via examples in https://github.com/sendgrid/sendgrid-nodejs/blob/master/examples/helpers/mail/example.js#L10

const recipients = process.env.ALERT_MAIL_RECIPIENTS !== undefined ? process.env.ALERT_MAIL_RECIPIENTS.split(',') : ['ftlabs@ft.com'];
const to_emails = recipients.map(r => { return new helper.Email(r); });
const personalization = new helper.Personalization();
to_emails.forEach(t => { personalization.addTo(t); });

const from_email = new helper.Email(process.env.SENDGRID_SENT_FROM || 'sean.tracey@ft.com');

function sendMessage(message, subject = 'Audio file retrieved from Spoken Layer'){
	debug('sendMessage: message=' + message);

	var mail = new helper.Mail();
	mail.setFrom(from_email);
	mail.setSubject(subject);
	mail.addContent(new helper.Content("text/plain", message));
	mail.addPersonalization(personalization);

	const request = sg.emptyRequest({
		method: 'POST',
		path: '/v3/mail/send',
		body: mail.toJSON(),
	});
	
	sg.API(request, function(error, response) {
		debug(response.statusCode);
		debug(response.body);
		debug(response.headers);
	});
}

module.exports = {
	send : sendMessage
};