# RG's motif search utility.


Usage
------

```javascript
var BS = require('rg_binary_search');
var file = '../test/test.fasta';
var dbname = 'testDB';
// First we need to make a database. The RG_DB turns all sequences into 4mers and keeps the in a binary format. 
// IDs are kept seperately, thus a RG_DB consists of two files (.rag and .ids). 
// This needs to be done only once!
BS.makeDB(file, '../test/', dbname).on('end', doSearch);

//This is called when the RG_DB is ready, so search can be done.
//teszt.xml contains the motifs sequences in a restricted RegEX format.
function doSearch() {
    function onHit(hit) {
        console.log(hit);
    };
    function onErr(e) {
        console.log(e);
    }
    BS.search('../test/teszt.xml', '../test/', 'testDB').on('hit', onHit).on('error', onErr);
}
```

Motif file
------

The 'entry' tag is used. Motif and label properties are necessary.

```xml
	<entry>
		<motif>[GA]CGTGTAAAGTAAATTTACAAC</motif>
		<label>23BPZM27KDAZEIN </label>
	</entry>
```
TODO
-----
To make gapped motif search possible.
