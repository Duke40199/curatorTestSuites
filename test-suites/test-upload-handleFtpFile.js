//Test case assets
var chai = require('chai');
var agent = require('superagent');
var chaiHTTP = require('chai-http');
chai.use(chaiHTTP);

var expect = chai.expect;
//Test data
var host = "http://localhost:3005";
var feedId = '5c93605ab3553272c78180c7';
var crawlerId = '1442806682C4RAwVsoS_5ncx5PvWfiSDSrDDgcAK';
//Mock assets
var sinon = require('sinon');
var nock = require('nock');
var mockReqRes = require('mock-req-res');
var rewire = require('rewire');
//Models
var FeedModel = require('../server/api/feeds/feed.model');
var DataSourceModel = require('../server/api/sources/datasource.model.js');
var mongoose = require('mongoose')
var ftpFileModel = require('../server/api/upload/ftpFile.model.js');
//Controllers
var amazonUploader = require('../server/components/amazonUploader/index.js');
const uploadController = require("../server/api/upload/upload.controller.js");
const controller = rewire("../server/api/upload/upload.controller.isolated.js");
//Other assets
const FormData = require('form-data');
const formidable = require('formidable');
const fs = require('fs');
const requestObj = require('request');
//mock form
var form = new formidable.IncomingForm();
form.type = 'multipart/form-data';
form.multiples = true;

//Mock Request-Response
var req = mockReqRes.mockRequest({
    headers: {
        'filename': 'mockFilename',
        'instance-id': 'knx18608',
        'total-chunks': '2',
        'chunk-number': '0',
    },
});
var response = mockReqRes.mockRequest({
    feedId: 'dummyFeedId',
    advertiserId: 'knx30494',
    feedUrl: 'dummyFeedUrl'
});
var res = mockReqRes.mockResponse({
    body: {
        'status': 200,
        message: 'Oh hi success? :>'
    }
});
//Mock a valid FTPFile
var mockFTPFile = new ftpFileModel({
    'name': 'dummy_ftp_file',
    'totalChunks': '2',
    'creativeIdsAddition': [],
    'dcoIdsAddition': ['dummyDcoIdAdd1', 'dummyDcoIdAdd2'],
    'update': ['dummyUpdateId1', 'dummyUpdateId2'],
    'delete': ['dummyDeleteId1', 'dummyDeleteId2'],
    'dcoIds': ['dummyDcoId1', 'dummyDcoId2'],
    'catalogId': 'dummyCatalogId1',
    'isArchived': false,
    'createdAt': Date.now(),
    'updatedAt': Date.now(),
    'feeds': ["dummyFeed1", "dummyFeed2", "dummyFeed3"]
});
//Mock a valid Feed
var mockFeed = new FeedModel({
    name: 'dummyFeedModel',
    created: Date.now(),
    updatedAt: Date.now(),
    remarks: {
        'status': 'dummyStatus',
        'jsonURL': 'dummyJsonURL',
        'recentSearch': []
    }
})
//Mock sub-functions results
var mockCatalogResult = {
    list: [{
        id: 'dummyCatList1',
        catIndex: "is_active"
    }, {
        id: 'dummyCatList2',
        catIndex: "is_not_active"
    }],
}
var mockDCOResult = {
    result: [{
        ruleId: 'dummyRuleId1',
        feed: 'feed1'
    }, {
        ruleId: 'dummyRuleId2',
        feed: 'feed2'
    }]
}
var mockCreativeResult = [
    {
        name: 'dummyCreativeResult1',
        components: [{ feeds: 'component1' }, { feeds: 'component2' }]
    },
    {
        name: 'dummyCreativeResult2',
        components: [{ feeds: 'component3' }, { feeds: 'component4' }]
    },
    {
        name: 'dummyCreativeResult3',
        components: [{ feeds: 'component5' }, { feeds: 'component6' }]
    }
]

before(function () {
    return new Promise(function (resolve) {
        //mock Mongoose functions

        //ftpFileModel
        var callback = sinon.stub(ftpFileModel, 'findOne');
        callback.onCall(0).yields(null, mockFTPFile);
        callback.onCall(1).yields(null, mockFTPFile);
        sinon.stub(ftpFileModel, 'update')
            .yields(null, mockFTPFile);
        sinon.stub(ftpFileModel.prototype, 'save')
            .yields(null, 'save mocked!');

        //FeedModel
        sinon.stub(FeedModel, 'findOne')
            .yields(null, mockFeed);
        sinon.stub(FeedModel, 'update')
            .yields(null, null, 'update feed has been mocked!');
        //AWS Uploader
        sinon.stub(amazonUploader, 'uploadJSON')
            .callsFake(function () {
                return new Promise(function (resolve) {
                    resolve('mockDestination');
                })
            });
        //Request API
        sinon.stub(requestObj, 'post')
            .returns(null, mockFTPFile);

        //File System
        sinon.stub(fs, 'unlink')
            .yields('mockedPath', 'fs.unlink has been mocked!');
        //mock sub functions of handleFTPFile
        controller.__set__("getCatalog", function () {
            console.log("Get Catalog has been stubbed!");
            return new Promise(function (resolve) {
                resolve(mockCatalogResult);
            })
        });

        controller.__set__("getDCO", function () {
            console.log('GetDCO has been stubbed!');
            return new Promise(function (resolve) {
                resolve(mockDCOResult);
            })
        });
        controller.__set__("getCreative", function () {
            console.log('Get Creative has been stubbed!');
            return new Promise(function (resolve) {
                resolve(mockCreativeResult);
            })
        });
        controller.__set__("getFeed", function () {
            console.log('Get Feed has been stubbed!');
            return new Promise(function (resolve) {
                resolve(mockFeed.remarks.jsonURL);
            })
        });
        controller.__set__("removeFeedFromCreative", function () {
            console.log('Remove Feed From Creative has been stubbed!');
            return new Promise(function (resolve) {
                resolve('removeFeedFromCreative stubbed!');
            })
        });
        controller.__set__("removeFeedFromDCO", function () {
            console.log('Remove Feed From DCO has been stubbed!');
            return new Promise(function (resolve) {
                resolve('removeFeedFromDCO stubbed!');
            })
        })

        resolve();
    });
})

after(function () {

})
// describe('Test isolated handleFTPFile', function () {
//     describe('At server/api/upload/upload.controller.isolated.js', function () {
//         it('should work?', function (done) {
//             const handleFtpFile = controller.__get__("handleFtpFile");
//             handleFtpFile(req, response, res);
//             expect(res.body.status).to.be.equal(200);
//             expect(res.body.message).to.be.equal('Oh hi success? :>')
//             done();
//         })
//     })
// })

describe('Test handleFTPFile at uploadController', function () {
    describe('At upload.controller', function () {
        it('should work?', function (done) {
            agent
                .post('http://localhost:3005/api/upload/csv/')
                .set({
                    'filename': 'mockFilename',
                    'instance-id': 'knx18608',
                    'total-chunks': '2',
                    'chunk-number': '0',
                })
                .field('startDate', '2019-11-20')
                .field('endDate', '2019-12-31')
                .attach('file', './server/components/dataFormatter/csv/file.csv')
                .end(function (err, res) {
                    if (err) console.log(err);
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    done();
                })
        })
    })
})
