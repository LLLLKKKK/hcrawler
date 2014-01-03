
var crawler = require('../lib/hcrawler'),
    fs = require('fs'),
    http = require('http'),
    cheerio = require('cheerio'),
    request = require('request');

var site = 'http://www.dianping.com';


var cookie = '_hc.v="\"b82ddef7-f09f-4103-b17b-a727853b9452.1385291757\""; is=120786334143; tc=3; dper=1492136e149d3f26b24d674a222461bf4d2001e42aab5b7f01f51f46c78f3d61; ua=578011206%40qq.com; ctu=91970570cb3a1a8ae99190e1fd8ed4b56b5add82b0c330058ae2981e5da7b805; _tr.u=WaRxf6jNT0wGC9Fz; TGSeenRecomDealTest=b; t_track=T:T; abtest="25,68\|29,78"; ll=7fd06e815b796be3df069dec7836c3df; sid=1brk3aeqmorllgbtia2qrm55; JSESSIONID=1495A8C0A1AE979A54EF3329394B81B1; aburl=1; cy=5; cye=nanjing; __utma=1.302393606.1388776521.1388776521.1388776521.1; __utmb=1.33.10.1388776521; __utmc=1; __utmz=1.1388776521.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); ab=; s_ViewType=1; lb.dp=2540175626.20480.0000'

var no = 0;

var nameMap = {};

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
    if (href.search('top') == -1) {
      next_hrefs.push(site + href);
    }
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
    console.log(name + ' ' + no);
    nameMap[no] = name;
    //console.log(img_src);
    download(img_src, 'food_no/' + no + ' ' + name + '.jpg');
    no++;
  });

  $hide_dishs.each(function(i, elem) {
    var $a = $(this).find('a').first();
    var $img = $a.find('img').first();
    var name = $a.attr('title');
    var next_href = $a.attr('href');
    var img_src = $img.attr('data-src');
    next_hrefs.push(site + next_href);
    console.log(name + ' ' + no);
    nameMap[no] = name;
    //console.log(img_src);
    download(img_src, 'food_no/' + no + ' ' + name + '.jpg');
    no++;
  });
  
  return next_hrefs;
};

var get_image = function (data, href) {
  var $ = cheerio.load(data);
  var $lis = $('.J_list');
  console.log(href);
  $lis.each(function (i, elem) {
    var $img = $(this).find('img').first();
    var img_src = $img.attr('src');
    console.log(img_src);
  });
};

href_array = [];
for (var i = 1; i <= 50; i++) {
    for (var j = 1; j <= 5; j++) {
	href = site + '/search/category/' + j + '/0/p' + i;
	href_array.push(href);
    }
}

crawler.concurrency = 3;
crawler.headers['Host'] = 'www.dianping.com';
crawler.headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8';
//crawler.headers['Accept-Encoding'] = 'gzip'
crawler.headers['Accept-Language'] = 'zh-CN,zh;q=0.8,en-US;q=0.6,en;q=0.4'
crawler.headers['Cache-Control'] = 'max-age=0'
crawler.headers['Connection'] = 'keep-alive'

crawler.cookie = cookie;

crawler.run(
  href_array,
  [
    get_shop,
    get_dish,
    get_image
  ],
  function (results) {
    // var m = JSON.stringify(nameMap);
    // fs.writeFile('names.map', m, function(err){
    // 	    if (err) {
    // 		console.log(err);
    // 	    }
    // });
  },
  'depth'
);
