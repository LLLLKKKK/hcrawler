
var crawler = require('../lib/hcrawler'),
    fs = require('fs'),
    http = require('http'),
    cheerio = require('cheerio'),
    request = require('request');

var site = 'http://www.dianping.com';

var no = 0;

var download = function(uri, filename){
  http.get(uri, function(res){
      var imagedata = '';
      res.setEncoding('binary');
      res.on('data', function(chunk){
          imagedata += chunk;
      });
      res.on('err', function() {
        console.log('err: ' + filename);
        download(uri, filename);
      });
      res.on('end', function(){
          fs.writeFile(filename, imagedata, 'binary', function(err){
              if (err) {
                console.log('err when end: ' + filename);
                download(uri, filename);
            }
          });
      });
  });
  //request(uri).pipe(fs.createWriteStream(filename));
};

var get_shop = function (data, href) {
  var $ = cheerio.load(data);
  var $shops = $('.BL');
  var next_hrefs = [];
  $shops.each(function(i, elem) {
    var href = $(this).attr('href');
    next_hrefs.push(site + href);
  });
  return next_hrefs;
};

var get_dish = function (data, href) {
  var $ = cheerio.load(data);
  var $div = $('.rec-dishes').find('div').next();
  var $dishs = $div.find('li');
  var $hide_script = $div.find('script').first();
  var $hide_dishs = (cheerio.load($hide_script.html()))('li');
  var next_hrefs = [];

  $dishs.each(function(i, elem) {
    var $a = $(this).find('a').first();
    var $img = $a.find('img').first();
    var name = $a.attr('title');
    var next_href = $a.attr('href');
    next_hrefs.push(site + next_href);
    var img_src = $img.attr('src');
    //console.log(name);
    //console.log(img_src);
    //download(img_src, 'food_no/' + no + '.jpg');
    no++;
  });

  $hide_dishs.each(function(i, elem) {
    var $a = $(this).find('a').first();
    var $img = $a.find('img').first();
    var name = $a.attr('title');
    var next_href = $a.attr('href');
    var img_src = $img.attr('data-src');
    next_hrefs.push(site + next_href);
    //console.log(name);
    //console.log(img_src);
    //download(img_src, 'food_no/' + no + '.jpg');
    no++;
  });
  
  return next_hrefs;
};

var get_image = function (data, href) {
  var $ = cheerio.load(data);
  var $lis = $('.J_list');
  console.log(href);
  console.log(data);
  $lis.each(function (i, elem) {
    console.log($(this).html())
    var $img = $(this).find('img').first();
    var img_src = $img.attr('src');
    console.log(img_src);
  });
}

href_array = [];
for (var i = 1; i <= 1; i++) {
    href = site + '/search/category/3/0/p' + i;
    console.log(href);
    href_array.push(href);
}

crawler.concurrency = 5;

crawler.run(
  href_array,
  [
    get_shop,
    get_dish,
    get_image
  ],
  function (results) {
  },
  'depth'
);
