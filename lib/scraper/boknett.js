var http    = require('http'),
    cheerio = require('cheerio'),
    _       = require('lodash');

function ScraperBoknett() {}

_.extend(ScraperBoknett.prototype, {
    getReviewPage: function(offset, callback) {
        offset   = offset || 0;
        callback = callback || function() {};

        var data = '';

        var options = {
            host: 'www.boknett.no',
            path: '/Anmeldelser/(offset)/' + offset
        };

        http.get(options, function(res) {
            res.on('data', function(chunk) {
                data += chunk;
            }).on('end', function() {
                callback(null, data);
            }).on('error', function(err) {
                callback(true, []);
            });
        });
    },

    normalizeSource: function(source) {
        return source.toLowerCase().replace(" ", "-");
    },

    getReviewLinksFromPage: function(html) {
        var $       = cheerio.load(html),
            reviews = $('.reviews .review');

        return _.map(reviews, function(review) {
            var review = $(review);

            return {
                url: review.find('a').attr('href'),
                author: review.find('h2').text(),
                title: review.find('h1').text(),
                source: this.normalizeSource(review.find('.source em').text())
            };
        }.bind(this));
    },

    getReviewUrls: function(limit, sources, callback) {
        this.getReviewPage(0, function(err, res) {
            var reviews = this.getReviewLinksFromPage(res);

            callback(err, _.filter(reviews, function(review) {
                return _.contains(sources, review.source);
            }));
        }.bind(this));
    }
});

module.exports = ScraperBoknett;
