'use strict';

var expect = require('chai').expect;
var fasta = require('../fasta.js');

const pry = require('pryjs');

describe('#fastaParser', function() {
    it('should convert fasta files', function() {
        var result = fasta('./examples/singlesample.fas');
        //eval(pry.it)
        expect(result[0]['name']).to.equal('Suillus variegatus');
        expect(result[0]['assession']).to.equal('JQ711926');
        expect(result).to.be.a('array');
        expect(result).to.have.lengthOf(1);
        expect(result[0]).to.be.a('object');
    });
});