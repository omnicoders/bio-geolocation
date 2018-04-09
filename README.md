Bio-Geolocation with GenBank and Fasta files [![Build Status](https://travis-ci.org/omnicoders/bio-geolocation.svg?branch=master)](https://travis-ci.org/omnicoders/bio-geolocation)
============


Looks up the location of sequences in GenBank and adds it to a FASTA file. - https://omnicoders.org/

## Installation

  `npm install @miamiruby/bio-geolocation`

## Requirements

[Node JS](https://nodejs.org/en/download/) and [Git](https://git-scm.com/downloads) are required to clone, install and run this project.

### Clone
In your terminal, clone the project to a local subdirectory:
```
git clone https://github.com/omnicoders/bio-geolocation.git
```

### Change Directory To Project
```
cd bio-geolocation
```

### Install Dependencies
```
npm install
```

## Usage
```
node scraper
```

## Code Usage

    var bioGeolocation = require('@miamiruby/bio-geolocation');

    var result = bioGeolocation('filename');
  
  
  Output should be `something`

## Tests

  `npm test`

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.

## Authors

    Mathew Stewart https://github.com/matthewstewart

    Paul Kruger    https://github.com/miamiruby
