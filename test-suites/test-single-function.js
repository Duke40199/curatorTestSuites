//Test case assets
var chai = require('chai');
var chaiHTTP = require('chai-http');
chai.use(chaiHTTP);
var expect = chai.expect;
//Test data
var host = "http://localhost:3005";
var feedId = '5c93605ab3553272c78180c7';
var crawlerId = '1442806682C4RAwVsoS_5ncx5PvWfiSDSrDDgcAK';
//Stub assets
var sinon = require('sinon');
var nock = require('nock');
var mockReqRes = require('mock-req-res');
//Models
var FeedModel = require('../server/api/feeds/feed.model');
var DataSourceModel = require('../server/api/sources/datasource.model.js');
var mongoose = require('mongoose');
//Controllers
var FeedController = require('../server/api/feeds/feed.controller.js');
var aws = require('../server/components/amazonUploader/index.js');
const uploadController = require('../server/api/upload/upload.controller.js');
//Stubbing before testing
//test data
var FeedModel = require('../server/api/feeds/feed.model');
var feedId = '5c936a84b3553272c7818127';
var crawlerId = '55ff7ba81b66896a62a9056f';
before(function () {
    return new Promise(function (resolve) {
        //Mongoose stubs
        sinon.stub(FeedModel, 'create')
            .yields(null, 'create stubbed!');
        sinon.stub(FeedModel.prototype, 'save')
            .yields(null, 'save stubbed!');
        sinon.stub(FeedModel, 'update')
            .yields(null, 'update stubbed!')
        sinon.stub(FeedModel.prototype, 'remove')
            .yields(null, 'delete stubbed!');
        sinon.stub(FeedModel, 'remove')
            .yields(null, 'delete stubbed!');
        //DataSource mocks
        sinon.stub(DataSourceModel, 'update')
            .yields(null, 'DS update stubbed!');
        sinon.stub(mongoose.Model, 'remove')
            .yields(null, 'remove mocked!');
        resolve();
    });
})
after(function () {
    return new Promise(function (resolve) {
        FeedModel.prototype.save.restore();
        FeedModel.create.restore();
        FeedModel.update.restore();
        FeedModel.remove.restore();
        FeedModel.prototype.remove.restore();
        mongoose.Model.remove.restore();
        console.log("Original feed model has been restored.");
        DataSourceModel.update.restore();
        console.log("Original DataSource has been restored!");
        resolve();
    })
})
afterEach(function () {
    nock.cleanAll();
    nock.restore();
})

describe('Test controller.csv ', function () {
    describe('At /api/upload/csv', function () {
        it('should return 200', function (done) {
            chai.request(host)
                .post('/api/upload/csv/')
                .set('advertiser-id', 'knx30494')
                .send({
                    'name': 'SpacePotato',
                    'advertiser-id': 'knx30494',
                    'first_name': 'Tuan Anh',
                    'last_name': 'Nguyen',
                    'email': 'anh.nguyen0909@knorex.com',
                    'crawlingId': '14691740090ie5ANGVq9SxI0AH0Qw_ue6aBDnZd1',
                    'startDate': new Date('1999-04-04'),
                    'endDate': 'Invalid Date'
                })
                .end(function (err, res) {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    done();
                })
        })
    })
})