var BS = require('rg_binary_search');
var assert = require('assert');

var file = './test/test.fasta';

describe('BS', () => {
    describe('.makeDB', () => {
        it('should make DB without errors', (done) => {
            BS.makeDB(file, './test/', 'testDB')
            .on('error', (err) => {
                console.log(err);
            })
            .on('db_done', done);
        })
    });
    describe('.search', (done) => {
        it('should search for motives', (done) => {
            function onHit(hit) {
                console.log(hit);
            }
            function onErr(e) {
                console.log(e);
            }
            BS.search('./test/teszt.xml', './test/', 'testDB').on('hit', onHit).on('error', onErr).on('search_done', done);
        })
    })
})