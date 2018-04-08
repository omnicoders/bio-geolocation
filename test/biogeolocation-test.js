'use strict';

var expect = require('chai').expect;
var bioGeolocation = require('../biogeolocation.js');

describe('#bioGeolocation', function() {
    it('should convert fasta files', function() {
        var result = bioGeolocation('./fasta/suillus.fas');
        expect(result).to.be.a('array');
    });
});