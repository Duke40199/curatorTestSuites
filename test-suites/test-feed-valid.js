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
//Stubbing before testing
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

//Nock mocking http requests
afterEach(function () {
    nock.cleanAll();
    nock.restore();
})
describe('Test controller.getAll', () => {
    describe('At feeds/index.js: /', () => {
        it('Should return status 200 and result body', (done) => {
            chai.request(host)
                .get('/api/feeds/')
                //category types: 'active' , 'approved', 'rejected' , 
                //'draft', 'archived', 'sent', 'forApproval'

                //The API uses req.query, so use .query() instead of .set()
                .query({
                    'userId': 'knx30494',
                    'isPublisher': false,
                    'email': 'anh.nguyen0909@knorex.com',
                    'isAdmin': true,
                    'category': 'active'
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    //(!) Very long result
                    console.log(res.body)
                    done();
                })
        })
    })
})

describe('Test controller.getAllLazyLoaded', () => {
    describe('At feeds/index.js: GET /feeds/lazy', () => {
        it('Should return status 200 and result body', (done) => {
            chai.request(host)
                .get('/api/feeds/feeds/lazy')
                //category types: 'active' , 'approved', 'rejected' , 
                //'draft', 'archived', 'sent', 'forApproval'
                //The API uses req.query, so use .query() instead of .set()
                .query({
                    'category': 'active',
                    'email': 'anh.nguyen0909@knorex.com',
                    'facebookAccountId': '100753957068429',
                    //JSON.stringify will create a string from a JSON input
                    //HTTP Request is a string, therefore must convert JSON into a string.
                    'filter': JSON.stringify({ 'name': 'Knx18608_1_new_automobile_1' }),
                    'isAdmin': true,
                    'isPublisher': false,
                    'page': 1,
                    'per_page': 10,
                    'sorting': JSON.stringify({ 'sortBy': 'asc' }),
                    'userId': 'knx30494',

                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    //console.log(res.body)
                    done();
                })
        })
    })
})

describe('Test controller.getSummary', () => {
    describe('At feeds/index.js: GET /summary', () => {
        it('Should return status 200 and result body', (done) => {
            chai.request(host)
                .get('/api/feeds/summary')
                //category types: 'active' , 'approved', 'rejected' , 
                //'draft', 'archived', 'sent', 'forApproval'
                //The API uses req.query, so use .query() instead of .set()
                .query({
                    'userId': 'knx30494',
                    'isPublisher': false,
                    'email': 'anh.nguyen0909@knorex.com',
                    'isAdmin': true,
                    'category': 'active'
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    expect(res.body).to.not.equal('{}')
                    //console.log(res.body)
                    done();
                })
        })
    })
})

describe('Test controller.getTotal', function () {
    describe('At feeds/index.js: GET /summary/length', function () {
        it('Should return status 200 and result body', function (done) {
            chai.request(host)
                .get('/api/feeds/summary/length')
                //category types: 'active' , 'approved', 'rejected' , 
                //'draft', 'archived', 'sent', 'forApproval'
                //The API uses req.query, so use .query() instead of .set()
                .query({
                    'userId': 'knx30494',
                    'isPublisher': false,
                    'email': 'anh.nguyen0909@knorex.com',
                    'isAdmin': true,
                    'category': 'active'
                })
                .end(function (err, res) {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    expect(res.body).to.not.equal('{}')
                    //console.log(res.body)
                    done();
                })
        })
    })
})

describe('Test controller.getArticleById', () => {
    describe('At feeds/index.js: GET /getArticleById', () => {
        describe('With globalSearch and feedLevel disabled', () => {
            it('Should return status 200 and result body', (done) => {
                var articleId = '1436700772JZ38Y4TeUdPQF0eCtc7FmItSH4vzYN';
                chai.request(host)
                    .get('/api/feeds/getArticleById')
                    //The API uses req.query, so use .query() instead of .set()
                    .query({
                        'articleId': articleId,
                        //globalSearch and feedLevel disabled
                        'globalSearch': '0',
                        'feedLevel': '0',
                        'advertiserId': 'knx30494'
                    })
                    .end((err, res) => {
                        expect(err).to.be.null;
                        expect(res).to.have.status(200);
                        expect(res.body).to.not.null;
                        //console.log(res.body)
                        done();
                    })
            })
        })
    })
})

describe('Test controller.getOne', () => {
    describe('At feeds/index.js: GET /:feedId', () => {
        it('Should return status 200', (done) => {
            chai.request(host)
                .get('/api/feeds/' + feedId)
                //The API uses req.query, so use .query() instead of .set()
                .set('feedId', feedId)
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res.body).to.not.null;
                    expect(res).to.have.status(200);
                    expect(res.body).to.not.equal('{}');
                    //console.log(res.body)
                    done();
                })
        })
    })
})

describe('Test controller.create', () => {
    describe('At feeds/index.js: POST /', () => {
        it('Should return status 200', (done) => {
            var paramsObject = {
                'name': 'newSpacePotato',
                'startDate': '1999-04-01'
            };
            //Mock HTTP request / response arguments
            var req = mockReqRes.mockRequest({ body: { 'name': 'newSpacePotato', 'startDate': '1999-04-01' } })
            var res = mockReqRes.mockResponse({ body: { 'success': 'controller mocked' } });
            //Run the controller with the mocked request / response
            FeedController.create(req, res);
            expect(res.body.success).to.be.equal('controller mocked');
            //Mock the query request
            nock(host)
                .post('/api/feeds/', paramsObject)
                .reply(200, 'mocked');
            chai.request(host)
                .post('/api/feeds/')
                .send({
                    'name': 'newSpacePotato',
                    'startDate': '1999-04-01'
                })
                //The API uses req.query, so use .query() instead of .set()
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    done();
                })
        })
    })
})

describe('Test controller.update', () => {
    describe('At feeds/index.js: PUT /:feedId', () => {
        it('Should return status 200', (done) => {
            var paramsObject = {
                'feed': feedId,
                'category': 'potatoCategory',
                'editedBy': 'potatoEditor',
                'status': 'approved'
            }
            var req = mockReqRes.mockRequest({ body: paramsObject })
            var res = mockReqRes.mockResponse({ body: { 'success': 'controller mocked' } });
            FeedController.update(req, res);
            expect(res.body.success).to.be.equal('controller mocked');
            nock(host)
                .put('/api/feeds/', feedId)
                .reply(200, 'mocked');
            chai.request(host)
                .put('/api/feeds/' + feedId)
                .send({
                    'feedId': feedId,
                    'category': 'potatoCategory',
                    'editedBy': 'SpacePotato',
                    'status': 'approved'
                })
                //The API uses req.query, so use .query() instead of .set()
                .end(function (err, res) {
                    expect(err).to.be.null;
                    expect(res.body).to.not.null;
                    expect(res).to.have.status(200);
                    console.log(res.body)
                    done();
                })
        })
    })
})

describe('Test controller.bindToSource', () => {
    describe('At feeds/index.js: PUT /:feedId/bind/:crawlingId', () => {
        it('Should return status 200', function (done) {
            var req = mockReqRes.mockRequest({
                body: {
                    'feedId': feedId,
                    'isScrapee': true,
                    'isScrappy': true,
                    'limitNumberArticles': 0
                }
            })
            var res = mockReqRes.mockResponse({ body: { 'success': 'controller mocked' } })
            FeedController.bindToSource(req, res);
            expect(res.body.success).to.be.equal('controller mocked');
            nock(host)
                .put('/api/feeds/' + feedId + '/bind/' + crawlerId)
                .reply(200, 'mocked');
            chai.request(host)
                .put('/api/feeds/' + feedId + '/bind/' + crawlerId)
                .send({
                    'feedId': feedId,
                    'isScrapee': true,
                    'isScrappy': true,
                    'limitNumberArticles': 0
                })
                //The API uses req.query, so use .query() instead of .set()
                .end(function (err, res) {
                    expect(err).to.be.null;
                    expect(res.body).to.not.null;
                    expect(res).to.have.status(200);
                    done();
                })
        })
    })
})

describe('Test controller.getSearchQuery', function () {
    describe('At feeds/index.js: GET /:feedId/search', function () {
        describe('With input', function () {
            it('Should return status 200', function (done) {
                chai.request(host)
                    .get('/api/feeds/' + feedId + '/search')
                    .send({
                        'feedId': feedId
                    })
                    //The API uses req.query, so use .query() instead of .set()
                    .end(function (err, res) {
                        expect(err).to.be.null;
                        expect(res.body).to.not.null;
                        expect(res).to.have.status(200);
                        console.log(res.body)
                        done();
                    })
            })
        })
    })
})

describe('Test controller.clearSearchQuery', function () {
    describe('At feeds/index.js: POST /:feedId/search/clear', function () {
        describe('With input', function () {
            it('Should return status 200', function (done) {
                chai.request(host)
                    .post('/api/feeds/' + feedId + '/search/clear')
                    .send({
                        'feedId': feedId,
                        'editedBy': 'SpacePotatoEditor'
                    })
                    //The API uses req.query, so use .query() instead of .set()
                    .end(function (err, res) {
                        expect(err).to.be.null;
                        expect(res.body).to.not.null;
                        expect(res).to.have.status(200);
                        console.log(res.body)
                        done();
                    })
            })
        })
    })
})

describe('Test controller.postSearchQuery', function () {
    describe('At feeds/index.js: POST /:feedId/search', function () {
        describe('With input', function () {
            it('Should return status 200', function (done) {
                chai.request(host)
                    .post('/api/feeds/' + feedId + '/search')
                    .send({
                        'feedId': feedId
                    })
                    //The API uses req.query, so use .query() instead of .set()
                    .end(function (err, res) {
                        expect(err).to.be.null;
                        expect(res.body).not.null;
                        expect(res).to.have.status(200);
                        console.log(res.body)
                        done();
                    })
            })
        })
    })
})


describe('Test controller.checkIfAlreadyEdited', function () {
    describe('At feeds/index.js: GET /:feedId/checkIfAlreadyEdited', function () {
        describe('With input', function () {
            it('Should return status 200', function (done) {
                chai.request(host)
                    .get('/api/feeds/' + feedId + '/checkIfAlreadyEdited')
                    .send({
                        'feedId': feedId
                    })
                    //The API uses req.query, so use .query() instead of .set()
                    .end(function (err, res) {
                        expect(err).to.be.null;
                        expect(res.body).not.null;
                        expect(res).to.have.status(200);
                        console.log(res.body)
                        done();
                    })
            })
        })
    })
})
//Working on mocking the HTTP Request, since it cannot be stubbed by Nock atm
describe('Test controller.delete', function () {
    describe('At feeds/index.js: DELETE /:feedId', function () {
        it('Should return status 200', function (done) {
            var feedId = '5c936a38b3553272c7818119';
            var req = mockReqRes.mockRequest({ params: { 'feedId': feedId } });
            var res = mockReqRes.mockResponse({ body: { 'success': 'controller mocked!' } })
            FeedController.delete(req, res);
            expect(res.body.success).to.be.equal('controller mocked!');
            FeedModel.findById(feedId, function (err, feed) {
                if (err) console.log(err);
                expect(err).to.be.null;
                console.log('Feed result:' + feed);
            })
            done();
        })
    })
})

//(Bugged?)
// describe('Test controller.syncFeedToDataSource', function () {
//     describe('At feeds/index.js: PUT /:feedId/sync/:crawlingId', function () {
//         describe('With input', function () {
//             it('Should return status 200', function (done) {
//                 chai.request(host)
//                     .put('/api/feeds/' + feedId + '/sync/' + crawlerId)
//                     .send({
//                         'feedId': feedId,
//                         'crawlingId': crawlerId
//                     })
//                     //The API uses req.query, so use .query() instead of .set()
//                     .end(function (err, res) {
//                         expect(err).to.be.null;
//                         expect(res.body).to.not.null;
//                         expect(res).to.have.status(200);
//                         done();
//                     })
//             })
//         })
//     })
// })

// //Bugged due to corrupted images from aws
// describe('Test controller.updateDynamicFeed', function () {
//     describe('At feeds/index.js: PUT /dynamic/update', function () {
//         describe('With input', function () {
//             it('Should return status 200', function (done) {
//                 chai.request(host)
//                     .put('/api/feeds/dynamic/update')
//                     .send({
//                         'name': 'SpacePotato',
//                         '_id': feedId,
//                     })
//                     //The API uses req.query, so use .query() instead of .set()
//                     .end(function (err, res) {
//                         expect(err).to.be.null;
//                         expect(res.body).not.null;
//                         console.log('Check if already edited:' + res.body);
//                         expect(res).to.have.status(200);
//                         done();
//                     })
//             })
//         })
//     })
// })

//Bugged due to corrupted images of aws
// describe('Test controller.updateFeedConfig', function () {
//     describe('At feeds/index.js: POST /:feedId/updateConfig', function () {
//         describe('With input', function () {
//             it('Should return status 200', function (done) {
//                 chai.request(host)
//                     .post('/api/feeds/' + feedId + '/updateConfig')
//                     .send({
//                         'feedId': feedId
//                     })
//                     //The API uses req.query, so use .query() instead of .set()
//                     .end(function (err, res) {
//                         expect(err).to.be.null;
//                         expect(res.body).not.null;

//                         expect(res).to.have.status(200);
//                         done();
//                     })
//             })
//         })
//     })
// })