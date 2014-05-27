'use strict';

var config         = require('./config'),
    ScraperBoknett = require('./lib/scraper/boknett'),
    boknett        = new ScraperBoknett();

boknett.getReviewUrls(200, config.sources, function(err, urls) {

});
