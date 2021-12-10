const fs = require('fs'); 
const parser = require('csv-parse');
const inputFile = "./testing_CSV.csv";

var i = 0
var trailing = "000000000000000000"
let converted = []

fs.createReadStream(inputFile)
.pipe(parser.parse({delimiter: ':'}))
.on('data', function(csvrow) {
    let row;
    if(i == 0){
        row = csvrow.toString().split("'").join('').split(",")
    }
    else {
        let parsed = JSON.parse('[' + csvrow + ']')
        if (i == 3) {
            for (let j = 0; j < parsed.length; j++) {
                converted.push(BigInt(parsed[j] + trailing).toString())
            }
            parsed = converted
        }
        row = parsed
    }
    console.log(row)
    i++
})