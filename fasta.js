'use strict';

const fs = require('fs');
const axios = require('axios');

// eval(pry.it);
const pry = require('pryjs');

/**
 * Parses fasta files
 * @param {string} srcFilePath
 * @param {string} topic
 * @return {array}
 */
module.exports = function(srcFilePath) {

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
};