
var async = require('async'),
    jsdom = require('jsdom'),
    http = require('http'),
    fs = require('js'),
    jquery = fs.readFileSync('./jquery.js').toString();

vessels = {};

function fetch_with_dom(href, selector) {
  var req = http.get(href, function(res) {
    var data = '';
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      data += chunk;
    });
    res.on('end', function() {
      jsdom.env({
        html: data,
        src: [jquery],
        done: function(e, window) {
          var $ = window.$;
          $(selector).each(function() {
            console.log($(this).text());
          });
        }
      });
    });
  }).on('error', function(e) {
    console.log(e);
  });
}

function save() {
  var csvContent = "data:text/csv;charset=utf-8,";
  csvContent += ['Name', 'Flag', 'AIS Type', 'Built', 'GT', 'DWT', 'IMO', 'MMSI',
  'Callsign', 'Size', 'Draught'].join(',') + "\n";
  for (var key in vessels) {
    var data = [];
    data.push(key);
    data.push(vessels[key]['Flag']);
    data.push(vessels[key]['AIS Type']);
    data.push(vessels[key]['Built']);
    data.push(vessels[key]['GT']);
    data.push(vessels[key]['DWT']);
    data.push(vessels[key]['IMO']);
    data.push(vessels[key]['MMSI']);
    data.push(vessels[key]['Callsign']);
    data.push(vessels[key]['Size']);
    data.push(vessels[key]['Draught']);
    //console.log(data);
    var dataString = data.join(",");
    csvContent += dataString + "\n";
  }
  csvContent = csvContent.substring(0, csvContent.length - 1);
  var encodedUri = encodeURI(csvContent);
  var link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "my_data.csv");
  link.click();
}

(function start_from(num) {
  for (var i = num; i < num+10; i += 1) {
    var href = 'http://www.vesselfinder.com/vessels?FullLastSeen_page='+i;
    $.ajax({
      url : href,
      success: parse_href
    });
  };
  if (num < 247924 / 12 + 1) {
    setTimeout(start_from, 10000, num + 10);
  }
})(1);

function fetch_page(href) {
  $.ajax({
    url : href,
    // error: function(xhr, status, err) {
    //   setTimeout(fetch_page, 10000, href);
    // },
    success: parse_vessel
  });
}

function parse_href(data) {
  var doc = document.implementation.createHTMLDocument('temp');
  doc.documentElement.innerHTML = data;
  var infos = doc.getElementsByClassName('info');
  for (var i = infos.length - 1; i >= 0; i--) {
    //console.log(infos[i].getElementsByTagName('a')[0]);
    //console.log(infos[i].getElementsByTagName('a')[0].getAttribute('href'));
    fetch_page(infos[i].getElementsByTagName('a')[0].getAttribute('href'))
  };
}

function parse_vessel(data) {
  var doc = document.implementation.createHTMLDocument('temp');
  doc.documentElement.innerHTML = data;
  var table = doc.getElementsByTagName('table')[0];
  var vessel_fields = table.getElementsByTagName('td');
  var vessel_name = doc.getElementsByClassName('ship-name')[0].textContent.trim();
  var vessel_info = {};
  
  console.log(vessel_name);
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

  // vessel_info['Destination'] = vessel_fields[14].textContent;
  // vessel_info['ETA'] = vessel_fields[15].textContent;
  // vessel_info['Last report'] = vessel_fields[16].textContent;

  // vessel_info['Position'] = vessel_fields[19].textContent;
  // vessel_info['Course/Speed'] = vessel_fields[20].textContent;
  vessels[vessel_name] = vessel_info;
  //return vessel_info;
}
