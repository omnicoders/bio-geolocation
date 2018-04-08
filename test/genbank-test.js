'use strict';

var expect = require('chai').expect;
var genBank = require('../genbank.js');

describe('#genBank', function() {
    it('should pull genBank data from url', function() {
        var result = genBank('http://url');
        expect(result).to.be.a('array');
    });
});