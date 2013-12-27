#HCrawler

A hierachical crawler with concurrency control. Provide DOM facility for fetch data from web sites.

## Quick Example
```javascript
crawler.run(

  //href array
  href_array,

  // parse function for each level
  [
    parse_href,
    parse_info
  ],
  
  // callback function
  function (results) {
    save_csv('info.csv');
  },

  // breadth first strategy
  'breadth'
);
```

## How to
Pls see vessel_crawler.js for detail.

## Require
async, cheerio