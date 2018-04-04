// load module dependencies
const fs = require('fs');
const axios = require('axios');


// start script
initialize();

function initialize() {
	
	scrapeGeolocations()
	.then(results => {
		fs.writeFileSync(process.argv[3], JSON.stringify(results, null, "  "));
		console.log('done');
		process.exit();
	});

}

async function scrapeGeolocations() {
	try {
		// get source and destination from command line arguments
		let srcFilePath = process.argv[2];
		let destFilePath = process.argv[3];

		// if there is no source or destination file paths provided, error and exit
		if(!srcFilePath || !destFilePath){
			console.log('Error: Missing Source File Path and Destination File Path Parameters.\nExample:');
			console.log('node geolocate ./source.fas ./destination.json');
			process.exit();
		}

		// convert source file to JSON
		let srcJSONArray = convertFastaFileToJSON(srcFilePath);

		// scrape from JSON
		let scrapedRecords = await scrapeRecords(srcJSONArray);

		return scrapedRecords;

	} catch(error) {
		console.log(error);
		process.exit();
	}
}

async function scrapeRecords(records) {
	try {
		let resultArray = [];
		for(let i = 0; i < records.length; i++){
	
			let scrapeURL = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nucleotide&id=${records[i].assession}&rettype=json`;
			console.log(`scraping ${i + 1}/${records.length} - ${records[i].name}`);
			let scrapeResponse = await scrapeNCBI(scrapeURL);
			resultArray.push(scrapeResponse);
		
		}
		return resultArray;
	} catch(error) {
		console.log(error);
		process.exit();
	}
}

async function scrapeNCBI(url) {
	try {
		let response = await axios.get(url);
		
		let data = await convertXMLToJSON(response.data);
		
		return data;

	} catch(error) {
		console.log(error);
		process.exit();
	}	
}

async function convertXMLToJSON(xml) {
	try {
		const convert = require('xml-to-json-promise');
		let convertedData = await convert.xmlDataToJSON(xml);
		let isSeq = convertedData['Bioseq-set']['Bioseq-set_seq-set'][0]['Seq-entry'][0]['Seq-entry_seq'] ? true : false;
		if(isSeq){
			let record = convertedData['Bioseq-set']['Bioseq-set_seq-set'][0]['Seq-entry'][0]['Seq-entry_seq'][0]['Bioseq'][0];
			let assessionObj = record['Bioseq_id'][0]['Seq-id'][0]['Seq-id_genbank'][0]['Textseq-id'][0];
			let assessionNo = assessionObj['Textseq-id_accession'][0];
			let version = assessionObj['Textseq-id_version'][0];
			
			let latLngString = record['Bioseq_descr'][0]['Seq-descr'][0]['Seqdesc'][1]['Seqdesc_source'][0]['BioSource'][0]['BioSource_subtype'][0]['SubSource'][2]['SubSource_name'][0];

			let latLngStringArray = latLngString.split(" ");
			let lat = `${latLngStringArray[0]} ${latLngStringArray[1]}`;
			let lng = `${latLngStringArray[2]} ${latLngStringArray[3]}`;
			let description = record['Bioseq_descr'][0]['Seq-descr'][0]['Seqdesc'][0]['Seqdesc_title'][0];
			
			let sequence = record['Bioseq_inst'][0]['Seq-inst'][0]['Seq-inst_seq-data'][0]['Seq-data'][0]['Seq-data_ncbi4na'][0]['NCBI4na'][0];
			let sequenceConverted = sequence.replace(/[1]/g, 'A').replace(/[2]/g, 'C').replace(/[4]/g, 'G').replace(/[8]/g, 'T');

		} else {

			let record = convertedData['Bioseq-set']['Bioseq-set_seq-set'][0]['Seq-entry'][0]['Seq-entry_set'][0]['Bioseq-set'][0];
			let assessionObj = record['Bioseq-set_seq-set'][0]['Seq-entry'][0]['Seq-entry_seq'][0]['Bioseq'][0]['Bioseq_id'][0]['Seq-id'][0]['Seq-id_genbank'][0]['Textseq-id'][0];
			let assessionNo = assessionObj['Textseq-id_accession'][0];
			let version = assessionObj['Textseq-id_version'][0];			
			let description = record['Bioseq-set_descr'][0]['Seq-descr'][0]['Seqdesc'][0]['Seqdesc_title'][0];
			let sequence = record['Bioseq-set_seq-set'][0]['Seq-entry'][0]['Seq-entry_seq'][0]['Bioseq'][0]['Bioseq_inst'][0]['Seq-inst'][0]['Seq-inst_seq-data'][0]['Seq-data'][0]['Seq-data_ncbi2na'][0]['NCBI2na'][0];
			
		}

		let convertedObj = {
			assession: {
				no: assessionNo,
				version: version
			}, 
			description: description,
			sequence: sequenceConverted,
			lat: lat,
			lng: lng
		};
		//console.log(``);
		return convertedObj;
	} catch(error) {
		console.log(error);
		process.exit();
	}
}

function convertFastaFileToJSON(srcFilePath){
	const srcFile = fs.readFileSync(srcFilePath, "utf8");
	let jsonSrcArray = [];
	let srcArray = srcFile.split('>');
	for(let i = 0; i < srcArray.length; i++){
		let record = srcArray[i];
		if(record.length > 10){
			let recordArray = record.split('.1');
			let assession = recordArray[0].trim();
			let description = recordArray[1];
			if(description && description.length > 0){
				let descriptionArray = description.split(' ');
				let name = `${descriptionArray[1]} ${descriptionArray[2]}`;
				let jsonObj = {
					assession: assession,
					name: name
				};
				jsonSrcArray.push(jsonObj);
			}
		}
	}
	return jsonSrcArray;
}