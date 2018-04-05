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
        console.log('scrapeGeolocations');
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
                console.log('converted source file');

		// scrape from JSON
		let scrapedRecords = await scrapeRecords(srcJSONArray);
                console.log('scraped records');

		return scrapedRecords;

	} catch(error) {
                console.log('scrapeGeolocations failed try');
		console.log(error);
		process.exit();
	}
}

async function scrapeRecords(records) {
        console.log('scrapeRecords');
	try {
		let resultArray = [];
		//for(let i = 0; i < records.length; i++){
		for(let i = 0; i < 1; i++){

			let scrapeURL = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nucleotide&id=${records[i].assession}&rettype=json`;
                        console.log('scrapeURL ' + scrapeURL);
			console.log(`scraping ${i + 1}/${records.length} - ${records[i].name}`);
			let scrapeResponse = await scrapeNCBI(scrapeURL);
                        console.log('scrapeResponse ' + scrapeResponse);
			resultArray.push(scrapeResponse);

		}
		return resultArray;
	} catch(error) {
                console.log('scrapeRecoreds error: ');
		console.log(error);
		process.exit();
	}
}

async function scrapeNCBI(url) {
        console.log('scrapeNCBI url: ' + url);
	try {
		let response = await axios.get(url);
                //console.log('response: ' + response.data);

		let data = await convertXMLToJSON(response.data);
                //console.log('data: ' + data);

		return data;

	} catch(error) {
                console.log('scrapeNCBI error: ');
		console.log(error);
		process.exit();
	}
}

async function convertXMLToJSON(xml) {
console.log('convertXMLToJSON');
	//console.log('xml: ' + xml);
	let assessionNo = '';
	try {
          console.log('inside try');
		const convert = require('xml-to-json-promise');
		let convertedData = await convert.xmlDataToJSON(xml);
		let isSeq = convertedData['Bioseq-set']['Bioseq-set_seq-set'][0]['Seq-entry'][0]['Seq-entry_seq'] ? true : false;
                console.log('isSeq' + isSeq);
		if(isSeq){
                  console.log('obj is a seq');
			let record = convertedData['Bioseq-set']['Bioseq-set_seq-set'][0]['Seq-entry'][0]['Seq-entry_seq'][0]['Bioseq'][0];
			let assessionObj = record['Bioseq_id'][0]['Seq-id'][0]['Seq-id_genbank'][0]['Textseq-id'][0];
			if (assessionObj['Textseq-id_accession'][0] != null) {
			  console.log('assessionObj position for assessionNo is not null');
			  console.log('data: ' + assessionObj['Textseq-id_accession'][0]);
			  assessionNo = assessionObj['Textseq-id_accession'][0];
			  console.log('assessionNo: ' + assessionNo);
			} else {
			  console.log('assessionObj position for assessionNo is not null');
			}
		        console.log('after assesion no');
			//let version = assessionObj['Textseq-id_version'][0];

			//let latLngString = record['Bioseq_descr'][0]['Seq-descr'][0]['Seqdesc'][1]['Seqdesc_source'][0]['BioSource'][0]['BioSource_subtype'][0]['SubSource'][2]['SubSource_name'][0];

			//let latLngStringArray = latLngString.split(" ");
			//let lat = `${latLngStringArray[0]} ${latLngStringArray[1]}`;
			//let lng = `${latLngStringArray[2]} ${latLngStringArray[3]}`;
			//let description = record['Bioseq_descr'][0]['Seq-descr'][0]['Seqdesc'][0]['Seqdesc_title'][0];

			//let sequence = record['Bioseq_inst'][0]['Seq-inst'][0]['Seq-inst_seq-data'][0]['Seq-data'][0]['Seq-data_ncbi4na'][0]['NCBI4na'][0];
			//let sequenceConverted = sequence.replace(/[1]/g, 'A').replace(/[2]/g, 'C').replace(/[4]/g, 'G').replace(/[8]/g, 'T');
                        console.log('end obj is a seq');

		} else {
                  console.log('obj is not a seq');

			let record = convertedData['Bioseq-set']['Bioseq-set_seq-set'][0]['Seq-entry'][0]['Seq-entry_set'][0]['Bioseq-set'][0];
			let assessionObj = record['Bioseq-set_seq-set'][0]['Seq-entry'][0]['Seq-entry_seq'][0]['Bioseq'][0]['Bioseq_id'][0]['Seq-id'][0]['Seq-id_genbank'][0]['Textseq-id'][0];
			if (assessionObj['Textseq-id_accession'][0] != null) {
			  let assessionNo = assessionObj['Textseq-id_accession'][0];
			}
			let version = assessionObj['Textseq-id_version'][0];
			let description = record['Bioseq-set_descr'][0]['Seq-descr'][0]['Seqdesc'][0]['Seqdesc_title'][0];
			let sequence = record['Bioseq-set_seq-set'][0]['Seq-entry'][0]['Seq-entry_seq'][0]['Bioseq'][0]['Bioseq_inst'][0]['Seq-inst'][0]['Seq-inst_seq-data'][0]['Seq-data'][0]['Seq-data_ncbi2na'][0]['NCBI2na'][0];

		}

                console.log('Before Converting to json');
                console.log('assessionNo: ' + assessionNo);
		//console.log('version: ' + version);
                //console.log('description: ' + description);
                //console.log('lat: ' + lat);
                //console.log('lng: ' + lng);
		let convertedObj = {
			assession: assessionNo
		};
		//let convertedObj = {
		//	assession: {
		//		no: assessionNo,
		//		version: version
		//	},
		//	description: description,
		//	lat: lat,
		//	lng: lng
		//};
                console.log('After Converting to json');
                console.log('convertedObj' + convertedObj);
		//console.log(``);
		return convertedObj;
	} catch(error) {
                console.log('failed try');
		console.log(error);
		process.exit();
	}
console.log('end convertXMLToJSON');
}

function convertFastaFileToJSON(srcFilePath){
        //console.log('convertFastaFileToJSON');
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
        //console.log('end convertFastaFileToJSON :'+ jsonSrcArray);
	return jsonSrcArray;
}
