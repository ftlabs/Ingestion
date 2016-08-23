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

	})

}

function readFromDatabase(item, table){
	
	return new Promise( (resolve, reject) => {

		if(table === undefined || table === null){
			reject("'table' argument is undefined or null");
		} else {

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

		}
	
	});

}

function scanDatabase(table, filter){

	return new Promise( (resolve, reject) => {

		if(table === undefined || table === null){
			reject("'table' argument is undefined or null");
		} else {
			
			Dynamo.scan({
				TableName : table,
				ScanFilter : filter
			}, function(err, data){

				if(err){
					reject(err);
				} else {
					resolve(data);
				}

			})

		}

	});

}

function removeItemFromDatabase(item, table){

	return Promise.resolve()
		.then(function(){
			if(table === undefined || table === null){
				throw "'table' argument is undefined or null";
			}
			item.available = false;
			return writeToDatabase(item, table);
		})
	;

}

module.exports = {
	write : writeToDatabase,
	read : readFromDatabase,
	scan : scanDatabase,
	remove : removeItemFromDatabase
};