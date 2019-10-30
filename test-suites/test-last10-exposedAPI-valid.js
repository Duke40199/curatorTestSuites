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
var exposedAPIController = require('../server/api/exposedAPI/controller.js');
var ftpController = require('../server/api/ftpErrors/ftpErrors.contorller.js')
var aws = require('../server/components/amazonUploader/index.js');
var Middleware = require('../server/api/exposedAPI/feed.service.js');
//Stub SSO Authentication
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
        sinon.stub(Middleware, 'SSOAuthentication')
            .callsFake(function () {
                compose().use(
                    function (next) {
                        return next();
                    }
                )
            })
        console.log("Original SSO Authentication has been replaced by Sinon mocking.");
        resolve();
    });
});
//Restore SSO Authentication
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
        Middleware.SSOAuthentication.restore();
        console.log("Original SSO Authentication has been restored.");
        resolve();
    })
})
describe("Test exports.health", () => {
    describe("at get('/health',controller.health)", () => {
        it("Should return status 200 and health status", (done) => {
            chai.request(host)
                .get('/api/public/feeds/health')
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res.body).to.not.null;
                    expect(res).to.have.status(200);
                    //console.log(res.body);
                    done();
                })
        })
    })
})

describe("Test exports.getFeedDetail", () => {
    describe("at post('/getFeedDetail', controller.getFeedDetail)", () => {
        it("should return 200 and the feed info", (done) => {
            var feedId = '5d9ac2d1064b192d58c40801';
            chai.request(host)
                .get('/api/public/feeds/feed_id/' + feedId)
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    expect(JSON.stringify(res.body.data)).to.not.equal('[]');
                    //console.log(res.body);
                    done();
                })
        })
    })
})
//If there's no error during the FTP upload, no error will be caught by this function.
describe("Test exports.getFtpError ", () => {
    describe("at router.get(/ftp_error/get,ftpErrors.getFtpError)", () => {
        it("should return status 200", (done) => {
            chai.request(host)
                .get('/api/public/feeds/ftp_error/get')
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    //console.log(res.body)
                    done();
                })
        })
    })
})
//Disabled for spamming into the DB
// describe('test /updateFeed, controller.updateFeed', () => {
//     describe('at POST/update_feed ', () => {
//         it('should return 200', () => {
//             var feedId = '5c93605ab3553272c78180c7';
//             var req = mockReqRes.mockRequest({
//                 body: {
//                     'id': feedId,
//                     'data': feedId,
//                     'dataId': feedId
//                 }
//             })
//             var res = mockReqRes.mockResponse({ body: { 'success': 'controller mocked!' } })
//             exposedAPIController.updateFeed(req, function (err, result) {
//                 console.log('update result: ' + result.body);
//             });
//         })
//     })
// })

describe("Test /update_feed, controller.updateFeedFields", () => {
    describe("with mocked SSO Authenticator", () => {
        it("should return status 200", (done) => {
            var feedId = '5d9ac2d1064b192d58c40801';
            var req = mockReqRes.mockRequest({ params: { 'feedId': feedId } });
            var res = mockReqRes.mockResponse({ body: { 'success': 'controller mocked!' } });
            exposedAPIController.updateFeedFields(req, res);
            expect(res.body.success).to.be.equal('controller mocked!')
            //Mock the request
            nock(host)
                .log(console.log)
                .post('/api/public/feeds/' + feedId + '/updateFeedFields')
                .reply(200, 'mocked');
            chai.request(host)
                .post('/api/public/feeds/' + feedId + '/updateFeedFields')
                .end((err, res) => {
                    if (err) console.log(err);
                    expect(res).to.have.status(200);
                    console.log(res.body);
                    nock.restore();
                    done();
                })
        })
    })
})

describe("Test exports.getTemplateDetails ", () => {
    describe("At post('/template_details', controller.getTemplateDetails)", () => {
        it("should return status 200", (done) => {
            //The key is the baseline key, not the baseline ID.
            var key = 'ecom';
            chai.request(host)
                .post('/api/public/feeds/template_details')
                .set('key', key)
                .end((err, res) => {
                    if (err) console.log(err);
                    expect(res).to.have.status(200);
                    expect(JSON.stringify(res.body.success)).to.be.equal('true');
                    expect(JSON.stringify(res.body.data)).to.not.equal('[]');
                    //console.log(res.body);
                    done();
                })
        })
    })
})

describe("Test exports.getFeedsByName", () => {
    describe("At post('/list_by_name',controller.getFeedsByName)", () => {
        it("should return status 200", (done) => {
            var feedName = 'SpacePotato';
            //not required
            //var advertiserId = 'knx30494';
            chai.request(host)
                .post('/api/public/feeds/list_by_name')
                .set('name', feedName)
                //.set('advertiser-id', advertiserId)
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    expect(JSON.stringify(res.body.success)).to.be.equal('true');
                    expect(JSON.stringify(res.body.data)).to.not.equal('[]');
                    //console.log(res.body.data);
                    done();
                })
        })
    })
})
//(!) Long request time
describe("Test exports.getMyriadFeedsDetails", () => {
    describe("At get('/myriad/advertisers/:advertiser_id',controller.getMyriadFeedsDetails)", () => {
        it("should return status 200", (done) => {
            var advertiserId = 'knx30494'
            chai.request(host)
                .get('/api/public/feeds/myriad/advertisers/' + advertiserId)
                .end((err, res) => {
                    if (err) console.log(err);
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    expect(JSON.stringify(res.body.success)).to.be.equal('true');
                    expect(JSON.stringify(res.body.data)).to.not.equal('[]');
                    //console.log(res.body);
                    done();
                })
        })
    })
})

describe("Test exports.getAllFeedsDetails ", () => {
    describe("At post('/all/advertisers/:advertiser_id', controller.getAllFeedsDetails)", () => {
        it("should return status 200", (done) => {
            var status = 'approved';
            var advertiserId = 'knx30494'
            chai.request(host)
                .post('/api/public/feeds/all/advertisers/' + advertiserId)
                .set('status', status)
                .end((err, res) => {
                    if (err) console.log(err);
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    expect(JSON.stringify(res.body.success)).to.be.equal('true');
                    expect(JSON.stringify(res.body.data)).to.not.equal('[]');
                    //console.log(res.body);
                    done();
                })
        })
    })
})

describe("Test exports.updateNotified", () => {
    describe("at post('/ftp_error/update_notified',ftpErrors.updateNotified)", () => {
        it("should return status 200", (done) => {
            var feedId = '5d9ac2d1064b192d58c40801';
            chai.request(host)
                .post('/api/public/feeds/ftp_error/update_notified')
                .set('ids', feedId)
                .end((err, res) => {
                    if (err) console.log(err);
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    expect(JSON.stringify(res.body.success)).to.be.equal('true');
                    //console.log(res.body);
                    done();
                })
        })
    })
})
describe('test ftp_error', function () {
    describe('at ftpErrors.insertFtpError', function () {
        it('should return status 200', function (done) {
            var req = mockReqRes.mockRequest({
                headers: {
                    'advertiser-id': 'knx30494',
                    'instance-id': 'curator_admin',
                    'error': 'Is it time to fix bugs then? :>',
                    'name': 'testNewError'
                }
            })
            var res = mockReqRes.mockResponse({
                body: {
                    'success': 'controller mocked!'
                }
            })
            ftpController.insertFtpError(req, res)
            expect(res.body.success).to.be.equal('controller mocked!');
            done();
        })
    })
})
//Test bypassing the GI
describe("Test '/advertiser', controller.getFeedByAdvertiser", () => {
    describe("When requesting to Curator", () => {
        it("Should return status 200", (done) => {
            var advertiserId = 'knx30494';
            var userAccessToken = 'curator_admin';
            var productAccessToken = '1729oct18@VN';
            chai.request(host)
                //header
                .post('/api/public/feeds/advertiser')
                .send({
                    'advertiserId': advertiserId,
                    'userAccessToken': userAccessToken,
                    'productAccessToken': productAccessToken
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    expect(JSON.stringify(res.body.success)).to.be.equal('true');
                    expect(JSON.stringify(res.body.results)).to.not.equal('[]');
                    //console.log(res.body);
                    done();
                })
        })
    })
})