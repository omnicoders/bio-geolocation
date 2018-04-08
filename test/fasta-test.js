'use strict';

var expect = require('chai').expect;
var fastaParser = require('../fasta.js');

describe('#fastaParser', function() {
    it('should convert fasta files', function() {
        var result = fastaParser('./fasta/suillus.fas');
        //expect(result).to.equal();
        expect(result).to.be.a('array');
    });
});