
var async = require('async'),
    cheerio = require('cheerio'),
    http = require('http'),
    fs = require('fs');

(function() {

  var crawler = {};

  var root = this;
  root.crawler = crawler;

  var _level_callbacks = [];

  var _site = 'http://www.vesselfinder.com';

  var _log_level = 'verbose';

  var _level_strategy = 'bfs';

  var _conn_in_poll = 0;

  var _concurrency = 40;

  var _counter = 0;

  var _results = [];

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
        callback(null, cheerio.load(data));
        if (_log_level == 'verbose') {
          _conn_in_poll--;
        }
      });
    }).on('error', function (e) {
      console.log(e);
      _fetch_with_dom(href, callback);
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

    var start_time = new Date().getTime();

    var _level_finish_callback = function (e, $) {
      var re_now = _level_callbacks[level]($);

      if (_level_strategy == 'dfs') {
        console.log(_counter)
        _counter--;
        if (level === _level_callbacks.length - 1) {
          _results.push(re_now);
          if (_counter === 0) {
            _callback(_results);
          }
        } else {
          _start_level(level + 1, _merge_array(re_now));
        }
      }

      else if (_level_strategy == 'bfs') {
        _results.push(re_now);
        _counter--;

        console.log(_counter + ' finished');
        if (_counter === 0) {
          
          var end_time = new Date().getTime();
          console.log(_results.length + ' results');
          console.log('level ' + level + ' cost ' + (end_time - start_time) / 1000 + ' seconds');
          
          if (level === _level_callbacks.length - 1) {
            _callback(_results);
          } else {
            var level_result = _merge_array(_results);
            _results = [];
            _start_level(level + 1, level_result);
          }
        }
      }

      else {
        throw new Error('unknown level_strategy');
      }
    };
    
    var wrapper = function () {
      if (_counter < _concurrency - arr.length) {
        console.log('start level ' + level);
        _counter += arr.length;
        for (var i = arr.length - 1; i >= 0; i--) {
          _fetch_with_dom(_site + arr[i], _level_finish_callback);
        };
      } else {
        console.log('wait for enough window');
        setTimeout(wrapper, 5 * 1000);
      }
    };
    wrapper();
  };

  crawler.encoding = 'utf8';

  crawler.concurrency = 7;

  crawler.push_level = function(level_callback) {
    _level_callbacks.push(level_callback);
  };

  crawler.start = function(arr, callback) {
    if (callback) {
      _callback = callback;
    }
    _counter = 0;
    _results = [];

    if (_level_callbacks.length === 0) {
      throw new Error("Empty callbacks!");
    } else {
      _start_level(0, arr);
    }
  };

}());

var parse_href = function (window) {
  var $ = window;
  var hrefs = [];
  $('.info a').each(function (k, v) {
    hrefs.push($(this).attr('href'));
  });
  return hrefs;
};

var parse_vessel_array = function ($) {
  var vessel_fields = $('td');
  var vessel_name = $('.ship-name').eq(0).text().trim();
  var vessel_info = [];

  vessel_info.push(vessel_name);

  vessel_info.push(vessel_fields.eq(0).text().trim());
  vessel_info.push(vessel_fields.eq(2).text().trim());
  vessel_info.push(vessel_fields.eq(3).text().trim());
  vessel_info.push(vessel_fields.eq(4).text().trim());
  vessel_info.push(vessel_fields.eq(5).text().trim());

  vessel_info.push(vessel_fields.eq(7).text().trim());
  vessel_info.push(vessel_fields.eq(9).text().trim());
  vessel_info.push(vessel_fields.eq(10).text().trim());
  vessel_info.push(vessel_fields.eq(11).text().trim());
  vessel_info.push(vessel_fields.eq(12).text().trim());
  
  return vessel_info;
};

var parse_vessel_object = function ($) {
  var vessel_fields = $('td');
  var vessel_name = $('.ship-name')[0].textContent.trim();
  var vessel_info = [];

  vessel_info['Flag'] = vessel_fields[0].textContent.trim();
  vessel_info['AIS Type'] = vessel_fields[2].textContent.trim();
  vessel_info['Built'] = vessel_fields[3].textContent.trim();
  vessel_info['GT'] = vessel_fields[4].textContent.trim();
  vessel_info['DWT'] = vessel_fields[5].textContent.trim();

  vessel_info['IMO'] = vessel_fields[7].textContent.trim();
  vessel_info['MMSI'] = vessel_fields[9].textContent.trim();
  vessel_info['Callsign'] = vessel_fields[10].textContent.trim();
  vessel_info['Size'] = vessel_fields[11].textContent.trim();
  vessel_info['Draught'] = vessel_fields[12].textContent.trim();

  vessel_info['Name'] = vessel_name;
  vessel_info['Destination'] = vessel_fields[14].textContent;
  vessel_info['ETA'] = vessel_fields[15].textContent;
  vessel_info['Last report'] = vessel_fields[16].textContent;

  vessel_info['Position'] = vessel_fields[19].textContent;
  vessel_info['Course/Speed'] = vessel_fields[20].textContent;
  
  return {vessel_name : vessel_info};
};

function save_links (data, filename) {
  var csvContent = '';
  data.forEach(function (infoArray, index) {
     dataString = infoArray.join("\n");
     csvContent += dataString + "\n";
  });

  fs.writeFile(filename, csvContent.substring(0, csvContent.length - 1), function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("The file was saved!");
    }
  });
}

function save_csv (data, filename) {
  var csvContent = '';
  csvContent += ['Name', 'Flag', 'AIS Type', 'Built', 'GT', 'GWT', 'DWT',
   'IMO', 'MMSI', 'Callsign', 'Size', 'Draught'].join(",") + '\n';

  data.forEach(function (infoArray, index) {
     dataString = infoArray.join(",");
     csvContent += dataString + "\n";
  });

  fs.writeFile(filename, csvContent.substring(0, csvContent.length - 1), function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("The file was saved!");
    }
  });
}

crawler.push_level(parse_href);
crawler.push_level(parse_vessel_array);

var from = parseInt(process.argv[2]);
var to = parseInt(process.argv[3]);

var href_array = [];
for (var i = from; i < to + 1; i++) {
  href_array.push('/vessels?FullLastSeen_page=' + i);
}
// fs.readFileSync('./SHIPS.csv').toString().split('\n').forEach(
//   function (line) {
//     href_array.push('/vessels?name=' + line);
//   }
// );

crawler.start(href_array, function (results) {
  save_csv(results, from + '-' + to + '.csv');
  console.log('file saved');
});

