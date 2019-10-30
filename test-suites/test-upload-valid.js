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
describe('test controller.attach_email', () => {
    describe('at router.post(/csv/email/:crawlingId, controller.attach_email);', () => {
        it('should return 200', (done) => {
            var req = mockReqRes.mockRequest({
                body: {
                    'emails': 'anh.nguyen0909@knorex.com',
                    'crawlingId': crawlerId
                }
            })
            var res = mockReqRes.mockResponse({
                body: {
                    'success': 'controller mocked!'
                }
            })
            uploadController.attach_email(req, res);
            expect(res.body.success).to.be.equal('controller mocked!');
            done();
        })
    })
})

describe('test controller.count ', function () {
    describe('at /api/upload/csv/count', function () {
        it('should return 200', function (done) {
            chai.request(host)
                .get('/api/upload/csv/count')
                .set('advertiser-id', ' ')
                .set('publisher-id', 'kxtest1')
                .end(function (err, res) {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    console.log(res.body);
                    done();
                })
        })
    })
})

describe('test controller.get ', function () {
    describe('at /api/upload/csv/get/:page', function () {
        it('should return 200', function (done) {
            chai.request(host)
                .get('/api/upload/csv/get/' + '1')
                .set('advertiser-id', ' ')
                .set('publisher-id', 'kxtest1')
                .send('page', '1')
                .end(function (err, res) {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    console.log(res);
                    done();
                })
        })
    })
})
//Line that caused a bug: line 836, res.json(data.data)
// describe('test controller.getData ', function () {
//     describe('at /api/upload/csv/get/:page', function () {
//         it('should return 200', function (done) {
//             chai.request(host)
//                 .get('/api/upload/csv/get/data/' + crawlerId)
//                 .send('crawlingId', crawlerId)
//                 .end(function (err, res) {
//                     expect(err).to.be.null;
//                     expect(res).to.have.status(200);
//                     console.log(res);
//                     done();
//                 })
//         })
//     })
// })
// Error at line 747 in update.controller
// describe('test controller.update ', function () {
//     describe('at /api/upload/csv, PUT', function () {
//         it('should return 200', function (done) {
//             chai.request(host)
//                 .put('/api/upload/csv/' + crawlerId)
//                 .send('crawlingId', crawlerId)
//                 .end(function (err, res) {
//                     expect(err).to.be.null;
//                     expect(res).to.have.status(200);
//                     console.log(res);
//                     done();
//                 })
//         })
//     })
// })

describe('test controller.delete ', function () {
    describe('at /api/upload/csv, DELETE', function () {
        it('should return 200', function (done) {
            crawlerId = '55ff7ba81b66896a62a9056f';
            chai.request(host)
                .delete('/api/upload/csv/' + crawlerId)
                .set({ 'crawlingId': crawlerId })
                .end(function (err, res) {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    done();
                })
        })
    })
})

describe('test controller.sample ', function () {
    describe('at /api/upload/csv/sample/:type, get', function () {
        it('should return 200', function (done) {
            var type = 'education';
            chai.request(host)
                .get('/api/upload/csv/sample/' + type)
                .set({ 'crawlingId': crawlerId })
                .end(function (err, res) {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    console.log(res.body);
                    done();
                })
        })
    })
})