// load module dependencies
const fs       = require('fs');
const axios    = require('axios');
const inquirer = require('inquirer');
const clear    = require('clear');
const colors   = require('colors');
//const cheerio  = require('cheerio');
const xpath    = require('xpath')
const dom      = require('xmldom').DOMParser
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
		for(let i = 0; i < srcJsonArray.length; i++){
			let record = srcJsonArray[i];
			console.log(`scraping ${i + 1}/${srcJsonArray.length} - ${record.assession}`);
			let country = await getCountry(record.assession);
		}
		//console.log(srcJsonArray[1]);
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
	console.log('converting fasta source file to json...');
	
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
			
			// get version
			let version = record.split('.').length > 1 ? String(record.split('.')[1])[0] : 0;

			
			// split by new line gives us sequence on all lines but the first
			let recordLineArray = record.split('\n');
			
			// the first line has our name in the same 
			// array index every time if we split by space
			let nameLineArray = recordLineArray[0].split(" ");
			let name = `${nameLineArray[1]} ${nameLineArray[2]}`;

			// sequence array we will populate line by line to match destination write to source format
			let sequence = [];

			// loop over lines and populate sequence
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

			// add our converted record to result array
			convertedSrcArray.push(convertedRecord);			 
		}	
	}
  console.log('converting fasta source complete');
	return convertedSrcArray;
}

async function getCountry(assession) {
	try {
		let url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nucleotide&id=${assession}&rettype=json`;
		let response = await axios.get(url);
		let xml = response.data;
		//console.log(`scraping ${assession} complete`);
		//console.log(`converting xml response to JSON...`);
		
		// XML Conversion
		const convert = require('xml-to-json-promise');
		let convertedData = await convert.xmlDataToJSON(xml);
		//console.log(convertedData);

		/* TODO: Parse For Country */
		let isSingleFormat = false;
		let isSetFormat    = false;

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

		if(isSingleFormat) {
			console.log(`${assession} is single format`);
		} else if(isSetFormat) {
			console.log(`${assession} is set format`);
		}

	} catch(error) {
		//console.log(error);
		return null;
	}
}

