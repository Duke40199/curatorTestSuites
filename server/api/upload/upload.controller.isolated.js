'use strict';

var formidable = require('formidable');
var csv = require('../../components/dataFormatter/csv');
var config = require('../../config/csv');
var processing = require('../../config/processing');
var helper = require('../../components/helper/datasource.helper');
var general = require('../../components/helper');
var fs = require('fs');
var csvModel = require('./csv.model');
var ftpFileModel = require('./ftpFile.model');
var _ = require('lodash');
var request = require('request');
var Feed = require('../feeds/feed.model');
var Promise = require('bluebird');
const mb = require('../../config/mediaBroker');
const gi = require('../../components/genericIntegration');


function handleFtpFile(req, response, res) {
    console.log("the response recevived is--- ", response);
    console.log("the filename is--- ", req.headers['filename']);
    ftpFileModel.findOne({ name: req.headers['filename'] }, function (err, file) {
        if (err) res.send(500, { "error": true, "status": "Internal error occurred" });

        /**
         * If the mapping is not existing create one
         */
        if (!file) {
            var ftpfile = new ftpFileModel({
                name: req.headers['filename'],
                feeds: [response.feedId],
                totalChunks: req.headers['total-chunks']
            });
            ftpfile.add = [];
            ftpfile.update = [];
            ftpfile.delete = [];
            ftpfile.save(function (err, file) {
                console.log("the file saved is ", err, file);
                if (err) res.send(500, { "error": true, "status": "Error while creating ftpfile document" });
                return res.json(response);
            });
        }
        else {

            /**
             * IF the mapping is existing, update mapping
             */

            if (req.headers['chunk-number'] == 1) {
                file.update = [];
                file.add = [];
                file.delete = [];
                file.dcoIdsAddition = [];
                file.creatives = [];
                file.creativeIdsAddition = [];
                file.catalogId = [];
                file.dcoIds = [];

                if (file.totalChunks != req.headers['total-chunks']) {
                    console.log("the file doc is--- ", file);
                    if (file.totalChunks > req.headers['total-chunks']) {
                        var difference = req.headers['total-chunks'];
                        var tempFeeds = [];
                        for (var i = difference; i < file.totalChunks; i++) {
                            var deleteFeedId = file.feeds[i];
                            console.log("the deleteFeedId id-- ", deleteFeedId);
                            file.delete.push(deleteFeedId);
                            tempFeeds.push(deleteFeedId);
                            deleteFeed(deleteFeedId)
                                .then(function (result) {
                                    console.log("the archive is successful for feed: ", result);
                                })
                                .catch(function (err) {
                                    console.log("the error in archiving is--- ", err);
                                });
                        }//deleting the feed which are removed from uploaded file.
                        for (var i = 0; i < tempFeeds.length; i++) {
                            _.remove(file.feeds, function (id) {
                                return id == tempFeeds[i];
                            });
                        }
                    }//end of checking for shrinking of uploaded file.
                    console.log("the delete feed array is=== ", file.delete, file.feeds);
                    file.totalChunks = req.headers['total-chunks'];
                }// end of updating the number of chunks in file doc 
            }//end of special processing of first chunk of the uploaded file.

            var promisesCollection = [];//array to collect all the promises for getting the Catalog, Creative, DCO details.
            promisesCollection.push(getCatalog(response.feedId));
            promisesCollection.push(getDCO(response.feedId, response.feedUrl, response.advertiserId));
            promisesCollection.push(getCreative(response.feedId));

            var dupIndex = _.findIndex(file.feeds, function (id) {
                return id == response.feedId;
            });
            if (dupIndex == -1) {
                file.feeds.push(response.feedId);
            }

            Promise.all(promisesCollection)
                .then(function (results) {

                    //check for the result of getCatalog
                    if (results[0]) {
                        if (results[0].list.length != 0) {
                            file.update.push(response.feedId);
                            file.catalogId = [];
                            for (var catIndex = 0; catIndex < results[0].list.length; catIndex++) {
                                if (results[0].list[catIndex]["is_active"]) {
                                    if (_.findIndex(file.catalogId, function (id) { return id == results[0].list[catIndex].id }) == -1) {
                                        file.catalogId.push(results[0].list[catIndex].id)
                                    }
                                }
                            }
                            console.log("the catlog Id1 is ---- ", file.catalogId);
                        }
                        else {
                            file.add.push(response.feedId);
                        }
                    }
                    //end of get catalog result

                    //check for the result of getDCO
                    var dcoIds = [];
                    var dcoDetails = results[1];
                    console.log('DEBUG: got response from DCO API: ', dcoDetails)
                    if (dcoDetails && dcoDetails.result.length > 0) {
                        dcoDetails = dcoDetails.result
                        console.log('DEBUG: dcoDetails: ', dcoDetails, dcoDetails.length)
                        for (var i = 0; i < dcoDetails.length; i++) {
                            var dcoId = dcoDetails[i].ruleId
                            console.log('DEBUG: FEED ID: ', dcoDetails[i].feed)
                            console.log('DEBUG: dcoId: ', dcoId)
                            dcoIds.push(dcoId)
                        }
                        console.log('DEBUG: DCO array : ', dcoIds, file.dcoIds)
                        if (file.dcoIds != []) {
                            console.log('DEBUG: DCO detail already present in the mapping')
                            // Add only the Ids which is not present
                            for (var i = 0; i < dcoIds.length; i++) {
                                var dcoIdFromApi = dcoIds[i]
                                console.log('DEBUG: dcoIdFromApi ', dcoIdFromApi)
                                if (!(file.dcoIds.indexOf(dcoIdFromApi) > -1)) {
                                    console.log('DEBUG: Pushing into file array : ', dcoIdFromApi)
                                    file.dcoIds.push(dcoIdFromApi)
                                    console.log('DEBUG: file.dcoIds after every push: ', file.dcoIds)
                                } else {
                                    console.log('DEBUG: dcoIdFromApi else ', file.dcoIds.indexOf(dcoIdFromApi), file.dcoIds, dcoIdFromApi)
                                }
                            }

                        } else {
                            console.log('DEBUG: initial stage: ', dcoIds)
                            file.dcoIds = dcoIds
                        }
                    }
                    else if (dcoDetails && !dcoDetails.used) {
                        if (file.dcoIds.length > 0) {
                            file.dcoIdsAddition.push(response.feedId);
                        }
                    }
                    else {
                        console.log('Looks like the response from DCO API has some issues : ', dcoDetails)
                    }
                    //end of getDCo results

                    //check for getCreative results
                    var creativeResult = results[2];
                    console.log("the result of fetching the creatives for feedId: ", response.feedId);
                    console.log("is--- ", creativeResult);
                    if (creativeResult[0].components.length > 0) {

                        for (var i = 0; i < creativeResult[0].components.length; i++) {
                            var creativeIndex = _.findIndex(file.creatives, function (c) {
                                return c.component_id === creativeResult[0].components[i].component_id && c.widget_id === creativeResult[0].components[i].widget_id;
                            });
                            console.log("the creative index is--- ", creativeIndex);
                            creativeIndex === -1 || creativeIndex == undefined ? file.creatives.push(creativeResult[0].components[i]) : '';
                        }

                    }
                    else {
                        if (file.creatives.length > 0) {
                            file.creativeIdsAddition.push(response.feedId);
                        }
                    }
                    //end of getCreative Results
                    file.catalogId = _.uniq(file.catalogId);
                    // var feed1 = [];
                    // var chIndex ;
                    // for(var i=0 ; i < file.feeds.length; i++){
                    //    chIndex = _.findIndex(feed1,function(id){
                    //      return id == file.feeds[i];
                    //    })
                    //    if(chIndex === -1){
                    //      feed1.push(file.feeds[i]);
                    //    }
                    // }
                    //saving the file doc after all the required updates
                    var fileId = file._id;
                    delete file._id;
                    ftpFileModel.update({ _id: fileId }, file, function (err, updateDoc) {
                        console.log("the doc updated is-- ", updateDoc);
                        ftpFileModel.findOne({ _id: fileId }, function (err, file) {
                            console.log("error in save method1---- ", err, file);
                            if (err) res.send(500, { "error": true, "status": "Error while updating ftpfile document" });
                            file.delete = _.uniq(file.delete);
                            file.feeds = _.uniq(file.feeds);
                            console.log("the delete array after unique function is-- ", file.delete);

                            //code to remove the feed from catalog, dco, creative
                            if (file.delete.length > 0) {
                                //create promises to fetch the feed url of feeds which are to kept in catalog.
                                var filteredFeedIds = [];
                                for (var j = 0; j < file.delete.length; j++) {
                                    filteredFeedIds = _.filter(file.feeds, function (id) {
                                        return id !== file.delete[j];
                                    });
                                }//filtering out the delete feedIds from feeds array.
                                console.log("the filtered ids are--- ", filteredFeedIds)

                                //check for presence of catalogId before removing feeds from catalog.
                                if (file.catalogId) {
                                    var feedUrlsPromise = [];
                                    for (var i = 0; i < filteredFeedIds.length; i++) {
                                        feedUrlsPromise.push(getFeed(filteredFeedIds[i]));
                                    }
                                    Promise.all(feedUrlsPromise)
                                        .then(function (results) {
                                            var feedUrls = '';
                                            for (var i = 0; i < results.length; i++) {
                                                feedUrls += "https:" + results[i] + ',';
                                            }
                                            var len = feedUrls.length - 1;
                                            feedUrls = feedUrls.substring(0, len);
                                            console.log("the feed1 urls are-- ", feedUrls);
                                            updateCatalog(feedUrls, file.catalogId)
                                                .then(function (result) {
                                                    console.log("the result of catalog updation is-- ", result);
                                                })
                                                .catch(function (err) {
                                                    return res.send(err);
                                                });
                                        })
                                        .catch(function (err) {
                                            return res.status(400).send("error occured while deleting the feed from catalog.")
                                        });
                                }//code to create promises to fetch and delte the feed from catalog

                                //loop to delete the feeds from DCO and creatives
                                for (var delIndex = 0; delIndex < file.delete.length; delIndex++) {

                                    //check for presence of dcoIds before removing feed from dco 
                                    if (file.dcoIds) {
                                        Feed.findOne({ _id: file.delete[delIndex] }, function (err, feed) {
                                            if (err) {
                                                console.log("Error in findind the feed for removal from dco.")
                                            }
                                            else {
                                                console.log("the feed found for removal from dco is--- ", feed);
                                                removeFeedFromDCO(file.dcoIds, feed._id, feed.remarks.jsonURL)
                                                    .then(function (result) {
                                                        console.log("the result of removal of dco is-- ", result);
                                                        res.status(200).send(result);
                                                    })
                                                    .catch(function (err) {
                                                        console.log("Error in removing feed from dco is--- ", err);
                                                        return;
                                                    })
                                            }
                                        });
                                    }
                                    //end of removing feed from dco

                                    //check for presence of creative before removing feed from creatives.
                                    if (file.creatives) {
                                        var tempFeedIdArray = [];
                                        tempFeedIdArray.push(file.delete[delIndex]);
                                        for (var i = 0; i < file.creatives.length; i++) {
                                            file.creatives[i].feeds = tempFeedIdArray;
                                        }
                                        removeFeedFromCreative(file.creatives)
                                            .then(function (removalOfFeedResult) {
                                                console.log("the result of remobval of feed from creative is--- ", removalOfFeedResult);
                                            })
                                            .catch(function (err) {
                                                console.log("error in removing feed from creative ", err);
                                            });
                                    }
                                    //end of removing feed from creative
                                }//end of looping over the delete feedd array.
                            }//end deleting the feed from catalog, dco, creative

                            return res.json(response);
                        })
                    })//end of save method.

                })
                .catch(function (err) {
                    console.log("Error in getting the catalog/dco/creative for the feed: ", response.feedId, err)
                    var fileId = file._id;
                    delete file._id;
                    ftpFileModel.update({ _id: fileId }, file, function (err, result) {
                        console.log("error in save method---- ", err, result);
                        if (err) res.send(500, { "error": true, "status": "Error while updating ftpfile document" });
                        return res.json(response);
                    })
                });
        }
    });
}
//Remove Feed From Creative
function removeFeedFromCreative(creativeFeeds) {
    return new Promise(function (resolve, reject) {
        gi.getProductToken(function (err, productAccessToken) {
            console.log('creative components are--- ', creativeFeeds);
            console.log('product access token: ' + productAccessToken);
            var dcoUrl = mb.removeFeedFromCreative
            console.log('creative URL: ', dcoUrl)

            let params = {};
            params.product_access_token = productAccessToken;
            params.creative_feeds = creativeFeeds;
            var optionsRemoveFeeds = {
                'method': 'post',
                'url': dcoUrl,
                headers: {
                    'Content-type': 'application/json'
                },
                body: params,
                json: true
            };
            request(optionsRemoveFeeds, function (err, response, body) {
                if (err) {
                    console.log("Failed to remove feeds from creatives");
                    reject(err);
                }

                resolve(body);
            });
        });
    });
}
//getCatalog
function getCatalog(feedId) {
    return new Promise(function (resolve, reject) {
        gi.getProductToken(function (err, productAccessToken) {
            if (err) {
                console.log("Failed to get product token.");
                reject(err);
            }
            var optionsGetCatalog = {
                'method': 'get',
                'url': mb.catalogId + feedId,
                headers: {
                    'Content-type': 'application/json',
                    'X-Auth-Token': productAccessToken
                },
                json: true
            };
            console.log("the get catalog Url is--- ", optionsGetCatalog.url);
            console.log("the auth token for get catalog is--- ", optionsGetCatalog.headers['X-Auth-Token'], feedId);
            request(optionsGetCatalog, function (err, response, body) {
                if (err) {
                    console.log("Failed to get catalog");
                    reject(err);
                }
                console.log("the body of get catalog is--- ", body, feedId);
                resolve(body);
            });
        });
    });
}
//getDCO
function getDCO(feedId, feedUrl, advertiserId) {
    return new Promise(function (resolve, reject) {
        console.log('Feed ID and Feed URL', feedId, feedUrl)
        var dcoUrl = mb.getDCO + '?advertiserId=' + advertiserId + '&feedUrl=' + feedUrl + '&feedId=' + feedId

        console.log('DCO URL: ', dcoUrl)
        var optionsGetCatalog = {
            'method': 'get',
            'url': dcoUrl,
            headers: {
                'Content-type': 'application/json'
            },
            json: true
        };
        request(optionsGetCatalog, function (err, response, body) {
            if (err) {
                console.log("Failed to get catalog");
                reject(err);
            }

            resolve(body);
        });

    });
}
//getCreative
function getCreative(feedId) {
    return new Promise(function (resolve, reject) {
        gi.getProductToken(function (err, productAccessToken) {
            if (err) {
                console.log("Failed to get product token.");
                reject(err);
            }
            let params = {};
            params.feed_ids = [];
            params.feed_ids.push(feedId);
            params.product_access_token = productAccessToken;
            var optionsGetCreative = {
                'method': 'post',
                'url': 'https://dsp-test.knorex.com/api/plugins/curator/feed/detail/',
                headers: {
                    'Content-type': 'application/json'
                },
                body: params,
                json: true
            };
            request(optionsGetCreative, function (err, response, body) {
                if (err) {
                    console.log("Failed to get creative");
                    reject(err);
                }
                console.log("the body of get creative is--- ", body, feedId);
                resolve(body);
            });
        });
    });
}
//get Feed
function getFeed(feedId) {
    return new Promise(function (resolve, reject) {
        Feed.findOne({ _id: feedId }, function (err, feed) {
            if (err) {
                console.log("Error in finding feed.");
                reject(err);
            }
            else if (!feed) {
                console.log("feed not found.");
                reject("feed not found");
            }
            else {
                console.log("feed url is-- ", feed.remarks.jsonURL);
                resolve(feed.remarks.jsonURL);
            }
        });
    });
}
//remove feed from DCO
function removeFeedFromDCO(ruleIds, feedId, feedUrl) {
    return new Promise(function (resolve, reject) {
        console.log('Feed ID and Feed URL, ruleIds', feedId, feedUrl, ruleIds);
        var ruleId = "";
        for (var i = 0; i < ruleIds.length; i++) {
            ruleId += ruleIds[i] + ",";
        }
        var len = ruleId.length - 1;
        ruleId = ruleId.substring(0, len);
        console.log("the ruleId is----- ", ruleId);
        var dcoUrl = mb.removeFeedFromDCO + '?ruleId=' + ruleId + '&feedUrl=' + feedUrl + '&feedId=' + feedId

        console.log('DCO URL: ', dcoUrl)
        var optionsGetCatalog = {
            'method': 'post',
            'url': dcoUrl,
            headers: {
                'Content-type': 'application/json'
            },
            json: true
        };
        request(optionsGetCatalog, function (err, response, body) {
            if (err) {
                console.log("Failed to get catalog");
                reject(err);
            }

            resolve(body);
        });
    });
}
module.exports.sample = function (req, res) {
    var type = req.params.type;
    res.sendfile('templates/' + type + '.csv', { root: __dirname });
}





module.exports.update = function (req, res) {
    var crawlingId = req.params.crawlingId;
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        if (err) {
            return res.json({
                success: false,
                error: err.toString()
            })
        }
        var path = files.file.path;
        csv.parseCSV(path).then(csv.transform).spread(function (data, templateType) {
            var response = {
                success: true,
                in_background: false,
                crawlingId: crawlingId
            };
            data = _.map(data, function (article) { //add unique id to each article
                article._id = general.randomId();
                article._trackingId_ = article._id;
                article.crawlingId = crawlingId;
                article.uri = helper.createURI(article._id);
                article.created = Math.floor((+new Date()) / 1000) * 1000;
                article.processed = false;
                return article;
            });
            csvModel.update({
                crawlingId: crawlingId,
            }, {
                $set: {
                    data: data,
                    processed: false,
                    updatedAt: new Date(),
                    template: templateType
                }
            }, function (err, model) {
                if (err) return res.send(500, err.toString());
                if (data.length > config.bgLimit) {
                    response.in_background = true;
                    request.post({
                        url: processing.CSVProcess + crawlingId,
                        form: {
                            delayed: true
                        }
                    }, function (err, proc_res, body) {
                        if (err) {
                            response.success = false;
                            response.error = err.toString();
                        }
                        return res.json(response);
                    });
                    //send request to process
                } else {
                    request.post({
                        url: processing.CSVProcess + crawlingId,
                        form: {
                            delayed: false
                        }
                    }, function (err, proc_res, body) {
                        if (err) {
                            response.success = false;
                            response.error = err.toString();
                        }
                        return res.json(response);
                    });
                }
            });
        })
            .catch(function (err) {
                return res.json({ success: false, error: err.toString() });
            })
            .then(function () {
                fs.unlink(path);
            });
    });
}

module.exports.delete = function (req, res) {
    csvModel.remove({
        crawlingId: req.params.crawlingId
    }, function (err) {
        if (err) res.send(500, err.toString());
        return res.send(200);
    });
}
module.exports.count = function (req, res) {
    csvModel.count({
        advertiserId: req.headers['advertiser-id'],
        publisherId: req.headers['publisher-id']
    }, function (err, count) {
        if (err) res.send(500, err.toString());
        res.json({
            total: count
        });
    })
}
module.exports.getData = function (req, res) {
    csvModel.findOne({ crawlingId: req.params.crawlingId }, function (err, data) {
        if (err) return res.send(500, err.toString());
        res.json(data.data);
    });
}

function createFeed(payload, cb) {
    var feed = JSON.parse(JSON.stringify(sampleCSVFeed));
    feed.name = payload.name;
    feed.advertiserId = payload.advertiserId || "";
    feed.publisherId = payload.publisherId || "";
    feed.created = new Date();
    feed.updatedAt = new Date();
    feed.userInfo = {
        firstName: payload.first_name,
        lastName: payload.last_name,
        email: payload.email
    }
    feed.crawlingIds.push(payload.crawlingId);
    feed.startDate = payload.startDate;
    if (payload.selectedFacebookAccount) {
        feed.selectedFacebookAccount = payload.selectedFacebookAccount
    }
    if (payload.endDate == 'Invalid Date') {
        payload.endDate = null;
    }
    if (feed.endDate == null && payload.endDate != null) {
        feed.endDate = payload.endDate
    } else {
        delete feed.endDate;
    }
    console.log('status of isUpdate', payload.isUpdate, payload.old_feed_id)
    if (payload.isUpdate) {
        feed.old_feed_id = payload.old_feed_id
    }

    feed.template = true; // init
    feed.templateType = ''; //init
    Feed.create(feed, function (err, feed) {
        if (err) console.error("Error while creating csv draft feed: ", err.toString());
        cb(err, feed);
    });
}

var sampleCSVDS = {
    "name": "",
    "type": "static",
    "data": [],
    "publisherId": "",
    "advertiserId": "",
    "crawlingId": "",
    "status": "Processing",
    "hashTags": [],
    "isScheduleActive": false,
    "obsolete": true,
    "processed": true,
    "banWords": [],
};

var sampleCSVFeed = {
    name: "", //set it
    data: [],
    advertiserId: "", //set it
    publisherId: "", //set it
    startDate: null, //set it
    endDate: null, //set it
    remarks: {
        status: "draft",
        jsonURL: "", //set it
        recentSearch: []
    },
    created: null, //set it
    updatedAt: null, //set it
    editedBy: "", //set it
    userInfo: {
        email: "",
        firstName: "",
        lastName: ""
    },
    logId: "", //set it
    automated: false,
    crawlingIds: [], //set it
    approvers: [], // array of string emails
    messageToApprover: "", // message when sending
    isScrapee: false,
    isScrappy: null,
    sourceOfContent: "new", // new for new data, existing for data from market
    configuration: [],
    isCSV: true
}

