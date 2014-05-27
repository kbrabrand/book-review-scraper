var http    = require('http'),
    cheerio = require('cheerio'),
    _       = require('lodash'),
    async   = require('async');

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

        if (!reviews.length) {
            return false;
        }

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
        var highestOffset = 0,
            result        = [],
            resultLength  = 0,
            stop          = false;

        var queue = async.queue(function(task, done) {
            this.getReviewPage(task.offset, function(err, res) {
                console.log('Got page ' + task.offset);

                var reviews = this.getReviewLinksFromPage(res);

                if (!reviews) {
                    stop = true;
                    queue.kill();
                    done();

                    return;
                }

                result = result.concat(_.filter(reviews, function(review) {
                    return _.contains(sources, review.source);
                }));

                resultLength = result.length;
                console.log('Found ' + resultLength + ' so far..');

                done();
            }.bind(this));
        }.bind(this), 10);

        var intervalId = setInterval(function() {
            if (!queue.idle()) {
                return;
            }

            if (stop) {
                clearInterval(intervalId);
                callback(null, result);
            } else if (resultLength >= limit) {
                clearInterval(intervalId);
                callback(null, result.slice(0, limit));
            } else if (resultLength < limit) {
                for (var i = 0; i < 10; i++) {
                    queue.push({ offset: (highestOffset += 30)});
                }
            }
        }, 50);
    }
});

module.exports = ScraperBoknett;
