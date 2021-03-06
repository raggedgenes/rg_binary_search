var BS = require('../index.js');
var file = '../test/test.fasta';
var dbname = 'testDB';

// First we need to make a database. The RG_DB turns all sequences into 4mers and keeps them in a binary format. 
// IDs are kept seperately, thus a RG_DB consists of two files (.rag and .ids). 
// This needs to be done only once!
//
// [file] is the input fasta file.
// The second argument is the outputdir for the database.
// [dbname] is the name of the file for the database.
BS.makeDB(file, '../test/', dbname).on('db_done', doSearch);

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