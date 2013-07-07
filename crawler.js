
var async = require('async'),
    jsdom = require('jsdom'),
    http = require('http'),
    fs = require('fs'),
    jquery = fs.readFileSync('./jquery.js').toString();

(function() {

  var crawler = {};

  var root = this;
  root.crawler = crawler;

  var _level_callbacks = [];

  var _site = 'http://www.vesselfinder.com';

  var _log_level = 'verbose';

  var _conn_in_poll = 0;

  var _callback = function (results) {
    console.log(results);
    console.log(results.length);
  };

  var _fetch_with_dom = function (href, callback) {
    if (_log_level == 'verbose') {
      _conn_in_poll++;
    }

    var req = http.get(href, function (res) {
      var data = '';
      res.setEncoding(crawler.encoding);
      res.on('data', function (chunk) {
        data += chunk;
      });
      res.on('end', function () {
        jsdom.env({
          html: data,
          src: [jquery],
          done: callback
        });
        if (_log_level == 'verbose') {
          _conn_in_poll--;
        }
      });
    }).on('error', function (e) {
      console.log(e);
    });
  };

  var _unique = function(arr) {
      var a = arr.concat();
      for(var i=0; i<a.length; ++i) {
          for(var j=i+1; j<a.length; ++j) {
              if(a[i] === a[j])
                  a.splice(j--, 1);
          }
      }
      return a;
  };

  var _merge_array = function (array) {
    var merged_results = [];
    for (var i = array.length - 1; i >= 0; i--) {
      merged_results = _unique(merged_results.concat(array[i]));
    }
    return merged_results;
  };

  var _start_level = function (level, arr) {
    async.mapLimit(arr, crawler.concurrency,

      function (item, callback) {
        if (_log_level == 'verbose') {
          console.log('level ' + level + ' item ' + item + ' start');
          console.log(_conn_in_poll + ' connections in pool');
        }

        _fetch_with_dom(_site + item, function(e, window) {
          var results = _level_callbacks[level](window);
          if (_log_level == 'verbose') {
            console.log('level ' + level + ' item ' + item + ' finished');
          }
          callback(null, results);
        });
      },

      function (err, results) {
        if (_log_level == 'verbose') {
          console.log('level ' + level + ' finished');
        }

        if (level < _level_callbacks.length - 1) {
          var merged = _merge_array(results);
          _start_level(level + 1, merged);
        } else {
          _callback(results);
        }
      });

  };

  crawler.encoding = 'utf8';

  crawler.concurrency = 15;

  crawler.push_level = function(level_callback) {
    _level_callbacks.push(level_callback);
  };

  crawler.start = function(arr, callback) {
    if (callback) {
      _callback = callback;
    }

    if (_level_callbacks.length === 0) {
      throw new Error("Empty callbacks!");
    } else {
      _start_level(0, arr);
    }
  };

}());

crawler.push_level(function (window) {
  var $ = window.$;
  var hrefs = [];
  $.each($('.info a'), function(k, v) {
    hrefs.push($(v).attr('href'));
  });
  return hrefs;
});


crawler.push_level(function (window) {
  var $ = window.$;
  var vessel_fields = $('td');
  var vessel_name = $('.ship-name')[0].textContent.trim();
  var vessel_info = [];

  vessel_info.push(vessel_name);

  vessel_info.push(vessel_fields[0].textContent.trim());
  vessel_info.push(vessel_fields[2].textContent.trim());
  vessel_info.push(vessel_fields[3].textContent.trim());
  vessel_info.push(vessel_fields[4].textContent.trim());
  vessel_info.push(vessel_fields[5].textContent.trim());

  vessel_info.push(vessel_fields[7].textContent.trim());
  vessel_info.push(vessel_fields[9].textContent.trim());
  vessel_info.push(vessel_fields[10].textContent.trim());
  vessel_info.push(vessel_fields[11].textContent.trim());
  vessel_info.push(vessel_fields[12].textContent.trim());

  // vessel_info['Flag'] = vessel_fields[0].textContent.trim();
  // vessel_info['AIS Type'] = vessel_fields[2].textContent.trim();
  // vessel_info['Built'] = vessel_fields[3].textContent.trim();
  // vessel_info['GT'] = vessel_fields[4].textContent.trim();
  // vessel_info['DWT'] = vessel_fields[5].textContent.trim();

  // vessel_info['IMO'] = vessel_fields[7].textContent.trim();
  // vessel_info['MMSI'] = vessel_fields[9].textContent.trim();
  // vessel_info['Callsign'] = vessel_fields[10].textContent.trim();
  // vessel_info['Size'] = vessel_fields[11].textContent.trim();
  // vessel_info['Draught'] = vessel_fields[12].textContent.trim();

  // vessel_info['Name'] = vessel_name;
  // vessel_info['Destination'] = vessel_fields[14].textContent;
  // vessel_info['ETA'] = vessel_fields[15].textContent;
  // vessel_info['Last report'] = vessel_fields[16].textContent;

  // vessel_info['Position'] = vessel_fields[19].textContent;
  // vessel_info['Course/Speed'] = vessel_fields[20].textContent;
  // vessels[vessel_name] = vessel_info;
  //console.log(vessel_name);
  //console.log(vessel_info);

  return vessel_info;
});

var href_array = [];
for (var i = 1; i <  247847 / 12 + 1; i++) {
  href_array.push('/vessels?FullLastSeen_page=' + i);
}

var start_time = new Date().getTime();
var end_time;

crawler.start(href_array, function (results) {
  // console.log(results);
  // console.log(results.length);
  var end_time = new Date().getTime();
  console.log('Time escaped: ' + (end_time - start_time) / 1000 + ' seconds');
  save_csv(results);
});

function save_csv (data) {
  //var csvContent = "data:text/csv;charset=utf-8,";
  var csvContent = '';
  csvContent += ['Name', 'Flag', 'AIS Type', 'Built', 'GT', 'GWT', 'DWT',
   'IMO', 'MMSI', 'Callsign', 'Size', 'Draught'].join(",") + '\n';

  data.forEach(function (infoArray, index) {
     dataString = infoArray.join(",");
     csvContent += dataString + "\n";
  });

  fs.writeFile("out.csv", csvContent.substring(0, csvContent.length - 1), function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("The file was saved!");
    }
  });
}