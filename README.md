UniprotParserJS
---

UniprotParserJS is a JavaScript library for retrieving Uniprot data in tabulated text format from Uniprot Accession IDs.

## Installation

```bash
npm install uniprotparserjs
```

## Usage

```javascript
import {Parser} from 'uniprotparserjs';

const parser = new Parser();
const uniprotAcc = ["Q71U36", "P62805", "P68032"];

const parsing = async (ids) => {
    const results = []
    for await (const result of parser.parse(ids)) {
        results.push(result)
    }
    return results
}

// Parsing Uniprot Accession IDs and return an array of tabulated text table that can be easily read by a CSV parser.
parsing(uniprotAcc).then((results) => {
    console.log(results)
})
```

