var mongoose = require('mongoose');
var settings = require('./settings.json');
var util = require('util');
mongoose.connect(settings.mongodb.uri);

var fs = require('fs');
var lineList = fs.readFileSync(settings.import_file).toString().split('\n');
lineList.shift(); // Shift the headings off the list of records.

var schemaKeyList = [ 'Address', 'ListPrice' ];

var PropertySchema = new mongoose.Schema({
	Address : String,
	ListPrice : Number
});
var Property = mongoose.model('Property', PropertySchema);

function queryAllEntries() {
	Property.count({}, function(err, count) {
		console.log("Number of records:", count);
		process.exit(0);
	});

}

// Recursively go through list adding documents.
// (This will overload the stack when lots of entries
// are inserted. In practice I make heavy use the NodeJS
// "async" module to avoid such situations.)
function createDocRecurse(err) {
	if (err) {
		console.log(err);
		process.exit(1);
	}
	if (lineList.length) {
		var line = lineList.shift();

		var doc = new Property();
		line.split(',').forEach(function(entry, i) {
			doc[schemaKeyList[i]] = entry;
		});

		function insertOrUpdate(err, property) {
			var ops = "updated";
			if (!err) {
				if (!property) {
					property = doc;
					ops = "inserted";
				} else {
					property.ListPrice = doc.ListPrice;
				}

				property
						.save(function(err) {
							if (!err) {
								console.log("property " + property.Address
										+ " " + ops);
							} else {
								console.log("Error: could not save property "
										+ property.Address);
							}
						});
			}

		}
		Property.findOne({
			Address : doc.Address
		}, insertOrUpdate);

		createDocRecurse(err);
	} else {
		// After the last entry query to show the result.
		queryAllEntries();

	}
}

createDocRecurse(null);
