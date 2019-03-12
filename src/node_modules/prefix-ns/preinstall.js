/**
 * Created by pheyvaer on 18.04.17.
 */

let http = require('http');
let fs = require('fs');

http.get('http://prefix.cc/context', (res) => {
  const { statusCode } = res;

  if (statusCode === 200) {
    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        //const parsedData = JSON.parse(rawData);
        //console.log(parsedData);
        fs.writeFileSync('data.json', rawData);
      } catch (e) {
        console.error(e.message);
      }
    });
  }
});