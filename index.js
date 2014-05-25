'use strict';

var config         = require('./config'),
    ScraperBoknett = require('./lib/scraper/boknett'),
    boknett        = new ScraperBoknett();

boknett.getReviewUrls(2000, config.sources, function(err, urls) {
    console.log(err);
    console.log(urls);
});
