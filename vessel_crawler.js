
var crawler = require('./crawler'),
    fs = require('fs');

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

var from = parseInt(process.argv[2]);
var to = parseInt(process.argv[3]);

var href_array = [];
for (var i = from; i < to + 1; i++) {
  href_array.push('/vessels?Vessel_page=' + i);
}
// fs.readFileSync('./SHIPS.csv').toString().split('\n').forEach(
//   function (line) {
//     href_array.push('/vessels?name=' + line);
//   }
// );

crawler.run(
  href_array, 
  
  [
    parse_href,
    parse_vessel_array
  ],

  function (results) {
    save_csv(results, from + '-' + to + '.csv');
  }
);
