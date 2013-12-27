
var request = require('request'),
    assert = require('assert');

(function() {

  var crawler = {};

  var root = this;
  root.crawler = crawler;

  var levelProcessors = [];

  var encoding = 'utf8';

  var runningCount = 0;

  var mapCount = 0;

  var jar = request.jar();

  crawler.concurrency = 5;

  crawler.proxy = undefined;

  crawler.cookie = undefined;

  crawler.headers = { 'User-Agent' : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.57 Safari/537.36'};

  var fetchPage = function (href, callback) {

    assert(href);
    assert(href.length > 0);

    var options = { uri : href , headers : crawler.headers } ;
    if (crawler.proxy) {
      options['proxy'] = crawler.proxy;
    }
    if (crawler.cookie) {
      options['jar'] = jar;
    }

    request(
      options,
      function (error, response, body) {
        if (!error && response.statusCode == 200) {
          callback(body, href);
        }
        else {
          if (!response) {
            console.log('error: ' + error);
          } else {
            console.log(href);
            console.log('statusCode: ' + response.statusCode + ' error: ' + error);
          }
          fetchPage(href, callback);
        }
      }
    );
  };

  var unique = function(arr) {
      var a = arr.concat();
      for(var i=0; i<a.length; ++i) {
          for(var j=i+1; j<a.length; ++j) {
              if(a[i] === a[j])
                  a.splice(j--, 1);
          }
      }
      return a;
  };

  var mergeArray = function (array) {
    var merged_results = [];
    for (var i = array.length - 1; i >= 0; i--) {
      merged_results = unique(merged_results.concat(array[i]));
    }
    return merged_results;
  };

  var asyncMap = function (arr, fn, reduceCallback) {

    if (arr.length === 0) {
      runningCount++;
      reduceCallback();
      mapCount--;

      return;
    }

    // too many async waiting
    if (runningCount > crawler.concurrency) {
      mapCount++;
      setTimeout(asyncMap, 10 * 1000, arr, fn, reduceCallback);
    }

    // map async within concurrency limit
    else {
      var qRun = arr.slice(0, crawler.concurrency - runningCount);
      var qWait = arr.slice(crawler.concurrency - runningCount, arr.length);

      if (qRun.length > 0) {
        runningCount += qRun.length;
        for (var i = qRun.length - 1; i >= 0; i--) {
          fn.apply(null, [qRun[i], reduceCallback]);
        }
      }

      if (qWait.length > 0) {
        console.log('wait for enough window');
        mapCount++;
        setTimeout(asyncMap, 5 * 1000, qWait, fn, reduceCallback);
      }
    }

    mapCount--;
  };


  // strategy function must be called with itself bind 

  var depthStrategy = function (callback) {
    var summary = [];
    var ds = function (level, result) {

      //console.log(runningCount + ' ' + mapCount);

      if (runningCount === 0 && mapCount === 0) {
        callback(summary);
      }

      if (level === levelProcessors.length - 1) {
        if (result) {
          summary.push(result);
        }
      }
      else {
        if (result && result.length > 0) {
          startLevel(level + 1, mergeArray(result), depthStrategy(callback));
        }
      }
    };
    return ds.bind(ds);
  };

  var breadthStrategy = function (callback) {
    var summary = [];
    var bs = function (level, result) {

      if (result) {
        summary.push(result);
      }

      if (runningCount === 0 && mapCount === 0) {
        if (level === levelProcessors.length - 1) {
          callback(summary);
        }
        else {
          var arr = mergeArray(summary);
          summary = [];
          startLevel(level + 1, arr, breadthStrategy(callback));
        }
      }
    };
    return bs.bind(bs);
  };

  var reduce = function (level, strategy) {
    return function (data, href) {
      var result;
      if (data) {
        result = levelProcessors[level](data, href);
      }

      runningCount--;

      strategy(level, result);
    };
  };

  var startLevel = function (level, arr, strategy) {
    console.log('start level ' + level);
    mapCount++;
    asyncMap(arr, fetchPage, reduce(level, strategy));
  };

  var pushLevel = function(levelProcessor) {
    levelProcessors.push(levelProcessor);
  };

  crawler.run = function (arr, processors, callback, strategy) {
    runningCount = 0;
    levelProcessors = processors;
    var stat;

    if (strategy == 'breadth') {
      stat = breadthStrategy(callback);
    }
    else {
      stat = depthStrategy(callback);
    }

    if (crawler.cookie) {
      var cookie = request.cookie(crawler.cookie);
      jar.add(cookie);
    }

    if (levelProcessors.length === 0) {
      throw new Error("Empty callbacks!");
    } else {
      startLevel(0, arr, stat);
    }
  };

}());

module.exports = crawler;
