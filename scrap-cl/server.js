//////////////////////////////////////////////////////////
//// scrape multiple pages

var cheerio = require('cheerio');
var request = require('request');

// This example demonstrates how to define a Blueprint in CerealScraper and then executing the scrape job
var CerealScraper = require('cerealscraper'),
    TextSelector = CerealScraper.Blueprint.TextSelector,
    ConstantSelector = CerealScraper.Blueprint.ConstantSelector,
    TransformSelector = CerealScraper.Blueprint.TransformSelector,
    Promise = require('bluebird');

var blueprint = new CerealScraper.Blueprint({
    requestTemplate: { // The page request options -- see https://www.npmjs.com/package/request
        method: 'GET',
        uri: 'http://losangeles.craigslist.com/search/apa', // This is an example only, please do not abuse!
        qs: {}
    },
    itemsSelector: '.content .rows', // jQuery style selector to select the row elements
    skipRows: [], // we don't want these rows
    // Our model fields and their associated jQuery selectors -- extend your own by overriding Blueprint.Selector.prototype.execute($, context)
    // In this example the data model represents a craigslist apartment/housing listing
    fieldSelectors: {
        type: new ConstantSelector('rent'),
        title: new TextSelector('.result-title', 0),
        link: new TextSelector('.result-info'.attr('href')),
        // Transform selectors can be used to manipulate the extracted field using the original jQuery element
        postDate: new TransformSelector('.result-date', 0, function(el){
            return new Date(el.attr('datetime'));
        }),
        location: new TransformSelector('.result-hood', 0, function(el){
            return el.text().replace("(", "").replace(")", "");
        }),
        price: new TransformSelector('.result-price', 0, function(el){
            return parseFloat(el.text().replace('$',''));
        }),
    },
    // The itemProcessor is where you do something with the extracted PageItem instance, e.g. save the data or run some deeper scraping tasks
    itemProcessor: function(pageItem){
        return new Promise(function(resolve, reject){
            console.log(pageItem);
            console.log(resolve);
            resolve();
        });
    },
    // The paginator method -- construct and return the next request options, or return null to indicate there are no more pages to request
    getNextRequestOptions: function(){
        var dispatcher = this,
            pagesToLoad = 1,
            rowsPerPage = 10,
            requestOptions = dispatcher.blueprint.requestTemplate;

        dispatcher.pagesRequested = (dispatcher.pagesRequested === undefined)? 0 : dispatcher.pagesRequested;
        dispatcher.pagesRequested++;
        if (dispatcher.pagesRequested > pagesToLoad){
            return null;
        } else {
            requestOptions.qs['s'] = dispatcher.pagesRequested * rowsPerPage - rowsPerPage; // s is the query string Craigslist uses to paginate
            return requestOptions;
        }
    },
    // Set the following to false to wait for one page to finish processing before scraping the next
    parallelRequests: false,
    // The rate limit for making page requests. See https://www.npmjs.com/package/limiter
    requestLimiterOptions: {requests: 5, perUnit: 'second'},
    // The rate limit for calling your `itemProcessor` method
    processLimiterOptions: {requests: 10, perUnit: "second"}
});

// Setup the scraper by creating a dispatcher with your blueprint
var dispatcher = new CerealScraper.Dispatcher(blueprint);

// Start the scraping!
dispatcher.start()
    .then(function(){
        console.log("End of the craigslist example.");
    });
