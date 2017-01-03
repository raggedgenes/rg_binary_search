; (function () {
	'use strict'

	var BE = require('rg_binaryencoder');
	var KM = require('rg_motifs_kmer');
	var Parser = require('rg_parser');
	var events = require('events');
	var fs = require('fs'),
		byline = require('byline');

	var rg = new events.EventEmitter();
	rg.test = function (tosay) {
		console.log(tosay);
		rg.emit('end');
	}
	rg.makeDB = function (fastafile, outputdir, dbname) {
		var widsstream = fs.createWriteStream(outputdir + dbname + ".ids");
		var binarystream = fs.createWriteStream(outputdir + dbname + ".rag", { encoding: 'binary' });
		var rstream = fs.createReadStream(fastafile, { encoding: 'utf8' });
		var fasta = {};
		var counter = 0; //counts the kmer serial number for ID mapping
		rstream = byline.createStream(rstream);
		rstream
			.on('readable', function () {
				var line;
				while (null !== (line = rstream.read())) {
					if (line.match(/^>/)) {
						if (fasta.desc) {
							makeKmers(fasta.seq);
							writeID(fasta.desc, counter);
							fasta = {};
						}
						fasta.desc = line;
						//console.log("desc: "  + fasta.desc);
						fasta.seq = "";
					} else {
						fasta.seq += line;
					}
				}
			})
			.on('end', function () {
				//console.log(fasta.desc);
				makeKmers(fasta.seq);
				writeID(fasta.desc, counter);
				binarystream.end();
				rg.emit("db_done");
			})
			.on('error', (err) => {
				rg.emit('error', err);
			})
		function makeKmers(seq) {
			var b = BE.scan16bit(seq);
			binarystream.write(b);
			var end = new Uint16Array(1);
			end[0] = 7;
			counter += b.length;
		}
		function writeID(id, c) {
			widsstream.write(id + "\t" + c + " \n");
		}
		return this;
	}
	rg.search = function (motfile, dbpath, dbname) {
		var ids = Object.create(null);
		var motifs = [];
		KM.process(motfile, BE.scan16bit).on('data', onData).on('end', readDB);
		function onData(m) {
			motifs.push(m);
		}
		function readDB() {
			fs.readFile(dbpath + dbname + ".ids", 'utf8', function (err, data) {
				if (err) {
					rg.emit('error', err);;
				}
				var lines = data.split('\n');
				for (var i = 0; i < lines.length; ++i) {
					var d = lines[i].split('\t');
					ids[d[1]] = d[0];
				}
				searchBinary();
			})
		}
		var bytes = 0;
		function searchBinary() {
			var teststream = fs.createReadStream(dbpath + dbname + ".rag", { encoding: 'binary' });
			teststream
				.on('data', function (chunk) {
					var obj = Buffer.from(chunk, 'binary');
					motifs.forEach(function (entry) {
						entry.binary.forEach(function (searchMotif, i, a) {
							//console.log("searching: " + entry.label + "\r");
							lookUp4mer(obj, searchMotif, entry.motif[i], entry.label);
						});
					});
					bytes += chunk.length;
				})
				.on('end', () => {
					rg.emit('search_done');
				})
		}
		function lookUp4mer(ab, a, mot, label) {
			var m = 0;
			var s = 0;
			var mbuf = Buffer.from(a.buffer);
			var sbuf = Buffer.from(ab);
			while (s <= (sbuf.length - 2)) {
				if (sbuf.readUInt16LE(s) == mbuf.readUInt16LE(m)) {
					m++;
					if (m == (mbuf.length - 1)) {
						var hit = Object.create(null);
						var h = whichID(bytes + s);
						hit.id = ids[h[1]];
						hit.pos = (bytes + s - (m - 1) - h[0]) / 2;
						hit.motif = BE.bin2seq16bit(mbuf);
						hit.label = label;
						rg.emit("hit", hit);
						m = 0;
					}
				} else {
					//console.log("No hit! " + s);
					m = 0;
				}
				s++;
			}
		}
		function whichID(index) {
			var start = 0;
			for (var key in ids) {
				//console.log(key);
				if (key > index) {
					return [start, key];
				}
				start = key;
			}
		}
		return this;
	}
	module.exports = rg;
}).call(this)