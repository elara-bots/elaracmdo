'use strict';
let xml2JS = require("xml2js");

module.exports = class Weather {
    constructor(){ };
    find(options, callback){
        let xmlParser = new xml2JS.Parser({ charkey: "C$", attrkey: "A$", explicitArray: true });

        if(typeof callback !== 'function') callback = function callback(err, result) { return err || result; };
        if(!options || typeof options !== 'object') return callback('invalid options');
        if(!options.search) return callback('missing search input');
        let result     = [],
            lang       = options.lang || "en-US",
            degreeType = options.degreeType || "F",
            timeout    = options.timeout || 10000,
            search     = new URLSearchParams(options.search ?? "").toString();
      require("superagent")
      .get(`http://weather.service.msn.com/find.aspx?src=outlook&weadegreetype=${degreeType}&culture=${lang}&weasearchstr=${search}`, (err, res) => {
      if(err) return callback(err);
      if(res.status !== 200) return callback(new Error(`request failed (${res.status})`));
      const body = res.body;
      if(!body) return callback(new Error('failed to get body content'));

      // Check body content
      if(body.indexOf('<') !== 0) {
        if(body.search(/not found/i) !== -1) return callback(null, result);
        return callback(new Error('invalid body content'));
      }

      // Parse body
      xmlParser.parseString(body, function(err, resultJSON) {
          if(err) return callback(err);
          if(!resultJSON || !resultJSON.weatherdata || !resultJSON.weatherdata.weather) return callback(new Error('failed to parse weather data'));
          if(resultJSON.weatherdata.weather['A$'] && resultJSON.weatherdata.weather['A$'].errormessage) return callback(resultJSON.weatherdata.weather['A$'].errormessage);
          if(!(resultJSON.weatherdata.weather instanceof Array)) return callback(new Error('missing weather info'));
          // Iterate over weather data
          let weatherLen = resultJSON.weatherdata.weather.length,
              weatherItem;
        
          for(var i = 0; i < weatherLen; i++) {
            if(typeof resultJSON.weatherdata.weather[i]['A$'] !== 'object') continue;
            weatherItem = {
              location: {
                name: resultJSON.weatherdata.weather[i]['A$']['weatherlocationname'],
                zipcode: resultJSON.weatherdata.weather[i]['A$']['zipcode'],
                lat: resultJSON.weatherdata.weather[i]['A$']['lat'],
                long: resultJSON.weatherdata.weather[i]['A$']['long'],
                timezone: resultJSON.weatherdata.weather[i]['A$']['timezone'],
                alert: resultJSON.weatherdata.weather[i]['A$']['alert'],
                degreetype: resultJSON.weatherdata.weather[i]['A$']['degreetype'],
                imagerelativeurl: resultJSON.weatherdata.weather[i]['A$']['imagerelativeurl']
              },
              current: null,
              forecast: null
            };
            if(resultJSON.weatherdata.weather[i]['current'] instanceof Array && resultJSON.weatherdata.weather[i]['current'].length > 0) {
              if(typeof resultJSON.weatherdata.weather[i]['current'][0]['A$'] === 'object') {
                weatherItem.current = resultJSON.weatherdata.weather[i]['current'][0]['A$'];
                weatherItem.current.imageUrl = `${weatherItem.location.imagerelativeurl}law/${weatherItem.current.skycode}.gif`;
              }
            };
            if(resultJSON.weatherdata.weather[i]['forecast'] instanceof Array) {
              weatherItem.forecast = [];
              for(var k = 0; k < resultJSON.weatherdata.weather[i]['forecast'].length; k++) {
                if(typeof resultJSON.weatherdata.weather[i]['forecast'][k]['A$'] === 'object')
                  weatherItem.forecast.push(resultJSON.weatherdata.weather[i]['forecast'][k]['A$']);
                }
              }
              result.push(weatherItem);
            }
          return callback(null, result);
      });
    });
  
  }
}