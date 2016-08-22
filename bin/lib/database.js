const AWS = require('aws-sdk');
AWS.config.update({region:'us-west-2'});

const Dynamo = new AWS.DynamoDB.DocumentClient();

function writeToDatabase(item, table){

	return new Promise( (resolve, reject) => {

		if(table === undefined || table === null){
			reject("'table' argument is undefined or null");
			return;
		}

		Dynamo.put({
			TableName : table,
			Item : item
		}, (err, result) => {

			if(err){
				reject(err);
			} else {
				resolve(result);
			}

		});

	});

}

function readFromDatabase(item, table){
	
	return new Promise( (resolve, reject) => {

		if(table === undefined || table === null){
			reject("'table' argument is undefined or null");
			return;
		}

		Dynamo.getItem({
			TableName : table,
			Key : item
		}, function(err, data) {
			
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	
	});

}

function scanDatabase(table){

	return new Promise( (resolve, reject) => {

		if(table === undefined || table === null){
			reject("'table' argument is undefined or null");
			return;
		}

		Dynamo.scan({
			TableName : table
		}, function(err, data){

			if(err){
				reject(err);
			} else {
				resolve(data);
			}

		})

	});


}

module.exports = {
	write : writeToDatabase,
	read : readFromDatabase,
	scan : scanDatabase
};