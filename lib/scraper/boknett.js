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

        // Set up the queue and worker
        var queue = async.queue(function(task, done) {
            this.getReviewPage(task.offset, function(err, res) {
                var reviews = this.getReviewLinksFromPage(res);

                if (!reviews) {
                    stop = true;
                    queue.empty();
                    done();

                    return;
                }

                result = result.concat(_.filter(reviews, function(review) {
                    return _.contains(sources, review.source);
                }));

                resultLength = result.length;

                done();
            }.bind(this));
        }.bind(this), 10);

        // Callback called when queue is emptied by the worker
        queue.empty = function() {
            if (stop || resultLength >= limit) {
                if (stop) {
                    queue.kill();
                }

                if (resultLength >= limit) {
                    result = result.slice(0, limit);
                }

                callback(null, result);
            } else if (resultLength < limit) {
                for (var i = 0; i < 10; i++) {
                    queue.push({ offset: (highestOffset += 30)});
                }
            }
        };

        // Add ten tasks to the queue
        for (var i = 0; i < 10; i++) {
            queue.push({ offset: (highestOffset += 30)});
        }
    }
});

module.exports = ScraperBoknett;
