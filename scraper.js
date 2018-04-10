// load module dependencies
const fs       = require('fs');
// Concurrency
// Helper functions for dealing with concurrent requests.
// axios.all(iterable)
// axios.spread(callback)
const axios    = require('axios');
const inquirer = require('inquirer');
const clear    = require('clear');
const colors   = require('colors');
const convert  = require('xml-to-json-promise');

// Add debugger
// eval(pry.it) to pause execution
// https://github.com/blainesch/pry.js
const pry = require('pryjs');

// run main sync script
initialize();

// sync main function 
function initialize() {
	clear();
	printHeader();
	runScraper();
}

// the header
function printHeader() {
	console.log('\n-----------------------------------------------------'.bold.grey);
	console.log('FASTA SCRAPER'.bold);
	console.log('-----------------------------------------------------\n'.bold.grey);
}

// sync async container
function runScraper() {
	scrapeRecords()
	.then(message => {
		console.log(message + '\n');
	});
}

// async main function
async function scrapeRecords() {
	try {
		let config = await askConfigQuestions();
		let srcJsonArray = convertFastaFileToJSON(config.srcFilePath);
		let resultFastaArray = [];
		let fastaFileString = "";
		for(let i = 0; i < srcJsonArray.length; i++){
			let record = srcJsonArray[i];
			console.log(`fetching record ${i + 1}/${srcJsonArray.length} from GenBank`);
			let country = await getCountry(record.assession) || "No Location Provided";
			record['country'] = country;
			let fastaRecord = `>${record.assession}.${record.version} ${record.name} ${record.country}`;
			for(let j = 0; j < record.sequence.length; j++){
				fastaRecord += `\n${record.sequence[j]}`;
			}
			resultFastaArray.push(fastaRecord);
		}
		for(let k = 0; k < resultFastaArray.length; k++){
			fastaFileString += '\r\n' + resultFastaArray[k];
		}
		fs.writeFileSync(config.destFilePath, fastaFileString);
		return "Done!";
	} catch(error) {
		console.log("scrapeRecords():" + error);
		process.exit();
	}
}

// set config by asking user via prompt
async function askConfigQuestions() {
	try {
		let questions = [
			{
			"type": "input",
			"name": "srcFilePath",
			"message": "Enter the source file path:",
			"default": "./fasta/suillus.fas"
			},
			{
			"type": "input",
			"name": "destFilePath",
			"message": "Enter the destination file path:",
			"default": "./result.fas"
			}
		];
		let answers = await inquirer.prompt(questions);
		return answers;
	} catch(error) {
		console.log("askConfigQuestions():" + error);
		process.exit();
	}
}

// name says it all
function convertFastaFileToJSON(srcFilePath){
	console.log('lickity split converting fasta source file to json...');

	// read file from path entered on prompt
	const srcFile = fs.readFileSync(srcFilePath, "utf8");
	
	// empty array we will populate and return
	let convertedSrcArray = [];

	// easy record split
	let srcArray = srcFile.split('>');
	

	// loop through records, 
	// convert to json
	// populate result array
	for(let i = 0; i < srcArray.length; i++){
		let record = srcArray[i];
		
		if(record.length > 0) {
			// get assession
			let assession = record.split('.')[0].trim();

			// if(
			// 	assession == 'FJ475559' || assession == 'FN565360' || assession == 'FN565362'
			// ){
			// 	//console.log('\n\nNot Working:\n' + srcArray[i] + '\n\n');
			// 	//fs.writeFileSync('./notworking.json', JSON.stringify(record, null, '  '));
			// } else {
			// 	//fs.writeFileSync('./works.json', JSON.stringify(record, null, '  '));	
			// }

			// get version
			let version = record.split('.').length > 1 ? String(record.split('.')[1])[0] : 0;
			
			// split by new line gives us sequence on all lines but the first
			let recordLineArray = record.split('\n');

			// if(
			// 	assession == 'FJ475559' || assession == 'FN565360' || assession == 'FN565362'
			// ){
			// 	console.log(recordLineArray)
			// }
			
			// the first line has our name in the same 
			// array index every time if we split by space
			let nameLineArray = recordLineArray[0].split(" ");
			let name = `${nameLineArray[1]} ${nameLineArray[2]}`;

			// sequence array we will populate line by line to match destination write to source format
			let sequence = [];


			// loop over lines and populate sequence
			/* WORK IN PROGRESS */
			for(let j = 1; j < (recordLineArray.length - 1); j++){
				sequence.push(recordLineArray[j]);
			}

			// setup our converted record object to add to result array
			let convertedRecord = {
				assession: assession,
				version: version,
				name: name,
				sequence: sequence
			};

			// if(
			// 	assession == 'FJ475559' || assession == 'FN565360' || assession == 'FN565362'
			// ){
			// 	console.log(convertedRecord)
			// }

			// add our converted record to result array
			convertedSrcArray.push(convertedRecord);			 
		}	
	}
  console.log('converting fasta source complete');

	//fs.writeFileSync('./convertedSrc.json', JSON.stringify(convertedSrcArray, null, '  '));
	
	return convertedSrcArray;                                                                                                                                                        
}

async function getCountry(assession) {
	try {
		
		// set the url to the api
		// return type json returns xml?!
		let url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nucleotide&id=${assession}&rettype=json`;
		
		// call the api
		let response = await axios.get(url);
		
		// set the response data to variable
		let xml = response.data;

		//console.log(`scraping ${assession} complete`);
		//console.log(`converting xml response to JSON...`);
		
		// convert xml to json
		let convertedData = await convert.xmlDataToJSON(xml);
		
		//console.log(convertedData);

		// the api returns two types of structure
		let isSingleFormat = false;
		let isSetFormat    = false;

		// determine format
		if(
			convertedData['Bioseq-set'] &&
			convertedData['Bioseq-set']['Bioseq-set_seq-set'] &&
			convertedData['Bioseq-set']['Bioseq-set_seq-set'][0] &&
			convertedData['Bioseq-set']['Bioseq-set_seq-set'][0]['Seq-entry'] &&
			convertedData['Bioseq-set']['Bioseq-set_seq-set'][0]['Seq-entry'] &&
			convertedData['Bioseq-set']['Bioseq-set_seq-set'][0]['Seq-entry'][0] &&
			convertedData['Bioseq-set']['Bioseq-set_seq-set'][0]['Seq-entry'][0]['Seq-entry_seq']
		){
			isSingleFormat = true;
		} else if(
			convertedData['Bioseq-set'] &&
			convertedData['Bioseq-set']['Bioseq-set_seq-set'] &&
			convertedData['Bioseq-set']['Bioseq-set_seq-set'][0] &&
			convertedData['Bioseq-set']['Bioseq-set_seq-set'][0]['Seq-entry'] &&
			convertedData['Bioseq-set']['Bioseq-set_seq-set'][0]['Seq-entry'] &&
			convertedData['Bioseq-set']['Bioseq-set_seq-set'][0]['Seq-entry'][0] &&
			convertedData['Bioseq-set']['Bioseq-set_seq-set'][0]['Seq-entry'][0]['Seq-entry_set']			
		){
			isSetFormat = true;
		} else {
			console.log('Error: Unsupported Response Format');
		}

		/* traverse by format type */
		let sequenceEntry = convertedData['Bioseq-set']['Bioseq-set_seq-set'][0]['Seq-entry'][0];
		let bioSequence;
		let sequenceDescriptionArray;
		let bioSource;
		let subSourceArray;
		let country = null;

		if(isSingleFormat) {

			bioSequence = sequenceEntry['Seq-entry_seq'][0]['Bioseq'][0];
			
		} else if(isSetFormat) {
	
			bioSequence = sequenceEntry['Seq-entry_set'][0]['Bioseq-set'][0]['Bioseq-set_seq-set'][0]['Seq-entry'][0]['Seq-entry_seq'][0]['Bioseq'][0];

		}
		
		sequenceDescriptionArray = bioSequence['Bioseq_descr'][0]['Seq-descr'][0]['Seqdesc'];

		bioSource = getBioSourceFromDescriptionArray(sequenceDescriptionArray);
		subSourceArray = bioSource['BioSource_subtype'][0]['SubSource'];
		
		for(let i = 0; i < subSourceArray.length; i++){
			let subSource = subSourceArray[i];
			let value = subSource['SubSource_subtype'][0]['$']['value'];
	
			if(String(value) == 'country'){
				country = subSource['SubSource_name'][0];
				return country;
			}
		}

		// if not located return null;
		return country;
	} catch(error) {
		//console.log(error);
		return null;
	}
}

function getBioSourceFromDescriptionArray(descArray) {
	for(let i = 0; i < descArray.length; i++){
		let desc = descArray[i];
		let descKeys = Object.keys(desc);
		for(let j = 0; j < descKeys.length; j++){
			let key = descKeys[j];
			//console.log(key);
			if(String(key) == 'Seqdesc_source'){
				//console.log(key);
				return desc['Seqdesc_source'][0]['BioSource'][0];
			}
		}
	}
	return null;
} 	

