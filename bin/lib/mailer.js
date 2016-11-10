const debug = require('debug')('bin:lib:mailer');
const helper = require('sendgrid').mail;

const recipients = process.env.ALERT_MAIL_RECIPIENTS !== undefined ? process.env.ALERT_MAIL_RECIPIENTS.split(',') : ['ftlabs@ft.com'];

const from_email = new helper.Email(process.env.SENDGRID_SENT_FROM || 'sean.tracey@ft.com');
const subject = 'Audio file retrieved from Spoken Layer';

function sendMessage(message){
	debug('sendMessage: message=' + message);
	const content = new helper.Content('text/plain', message);

	recipients.forEach(person => {

		const to_email = new helper.Email(person);

		const mail = new helper.Mail(from_email, subject, to_email, content);

		const sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
		const request = sg.emptyRequest({
			method: 'POST',
			path: '/v3/mail/send',
			body: mail.toJSON(),
		});
		
		debug(`Attempting to send email from: ${from_email.email} to: ${to_email.email}.`);

		sg.API(request, function(error, response) {
			debug(response.statusCode);
			debug(response.body);
			debug(response.headers);
		});

	});


}

module.exports = {
	send : sendMessage
};