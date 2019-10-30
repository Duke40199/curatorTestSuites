var chai = require('chai');
var chaiHTTP = require('chai-http');
chai.use(chaiHTTP);
var host = "http://localhost:3005";
var expect = chai.expect;
//test data
//sinon stub assets
var sinon = require('sinon');
var aws = require('../server/components/amazonUploader/index.js');
var feedModel = require('../server/api/feeds/feed.model.js');
before(function () {
    sinon.stub(aws, 'uploadImage')
        .callsFake(function () {
            console.log("aws upload has been mocked!");
            return callback(null, "aws upload has been mocked!");
        })
 
})
after(function () {
    aws.uploadImage.restore();
    console.log("Original aws has been restored!");

})
describe('Test controller.getAll', function () {
    describe('At feeds/index.js: /', function () {
        describe('With no userId input', function () {
            it('Should return status 401', function (done) {
                chai.request(host)
                    .get('/api/feeds/')
                    //category types: 'active' , 'approved', 'rejected' , 
                    //'draft', 'archived', 'sent', 'forApproval'

                    //The API uses req.query, so use .query() instead of .set()
                    .query({

                    })
                    .end(function (err, res) {
                        expect(err).to.be.null;
                        expect(res).to.have.status(401);
                        done();
                    })
            })
        })
    })
})

describe('Test controller.getAllLazyLoaded', function () {
    describe('At feeds/index.js: GET /feeds/lazy', function () {
        describe('With no userId input', function () {
            it('Should return status 401 and result body', function (done) {
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
                    })
                    .end(function (err, res) {
                        expect(err).to.be.null;
                        expect(res).to.have.status(401);
                        done();
                    })
            })
        })
    })
})

describe('Test controller.getSummary', function () {
    describe('At feeds/index.js: GET /summary', function () {
        it('Should return status 401', function (done) {
            chai.request(host)
                .get('/api/feeds/summary')
                //category types: 'active' , 'approved', 'rejected' , 
                //'draft', 'archived', 'sent', 'forApproval'
                //The API uses req.query, so use .query() instead of .set()
                .query({
                    'isPublisher': false,
                    'email': 'anh.nguyen0909@knorex.com',
                    'isAdmin': true,
                    'category': 'active'
                })
                .end(function (err, res) {
                    expect(err).to.be.null;
                    expect(res).to.have.status(401);
                    console.log(res.body)
                    done();
                })
        })
    })
})

describe('Test controller.getTotal', function () {
    describe('At feeds/index.js: GET /summary/length', function () {
        it('Should return status 401', function (done) {
            chai.request(host)
                .get('/api/feeds/summary/length')
                //category types: 'active' , 'approved', 'rejected' , 
                //'draft', 'archived', 'sent', 'forApproval'
                //The API uses req.query, so use .query() instead of .set()
                .query({
                    'userId': '',
                    'isPublisher': false,
                    'email': 'anh.nguyen0909@knorex.com',
                    'isAdmin': true,
                    'category': 'active'
                })
                .end(function (err, res) {
                    expect(err).to.be.null;
                    expect(res).to.have.status(401);
                    console.log(res.body.message);
                    done();
                })
        })
    })
})

describe('Test controller.getArticleById', function () {
    describe('At feeds/index.js: GET /getArticleById', function () {
        describe('Without inputting articleId', function () {
            it('Should return status 200', function (done) {
                chai.request(host)
                    .get('/api/feeds/getArticleById')
                    //The API uses req.query, so use .query() instead of .set()
                    .query({
                        'articleId': '',
                    })
                    .end(function (err, res) {
                        expect(err).to.be.null;
                        expect(res).to.have.status(200);
                        console.log(res.body)
                        done();
                    })
            })
        })

    })
})

// (!) Disabled for preventing spams into db
describe('Test controller.create', function () {
    describe('At feeds/index.js: POST /', function () {
        describe('Without name input', function () {
            it('Should return status 403', function (done) {
                chai.request(host)
                    .post('/api/feeds/')
                    .send({
                        'startDate': '1999-04-01'
                    })
                    //The API uses req.query, so use .query() instead of .set()
                    .end(function (err, res) {
                        expect(err).to.be.null;
                        expect(res.body).to.not.null;
                        expect(res).to.have.status(403);
                        done();
                    })
            })
        })
    })
})

// (!) Disabled for preventing spams into db
describe('Test controller.create', function () {
    describe('At feeds/index.js: POST /', function () {
        describe('Without name input', function () {
            it('Should return status 403', function (done) {
                chai.request(host)
                    .post('/api/feeds/')
                    .send({
                        'startDate': '1999-04-01'
                    })
                    //The API uses req.query, so use .query() instead of .set()
                    .end(function (err, res) {
                        expect(err).to.be.null;
                        expect(res.body).to.not.null;
                        expect(res).to.have.status(403);
                        done();
                    })
            })
        })
    })
})

describe('Test controller.bindToSource', function () {
    describe('At feeds/index.js: PUT /:feedId/bind/:crawlingId', function () {
        describe('With invalid feedId and crawlerId input', function () {
            it('Should return status 500', function (done) {
                chai.request(host)
                    .put('/api/feeds/' + 'asdf' + '/bind/' + 'asdf')
                    .send({
                        'feedId': 'asdf',
                        'isScrapee': true,
                        'isScrappy': true,
                        'limitNumberArticles': 0
                    })
                    //The API uses req.query, so use .query() instead of .set()
                    .end(function (err, res) {
                        expect(err).to.be.null;
                        expect(res.body).to.not.null;
                        expect(res).to.have.status(500);
                        done();
                    })
            })
        })
    })
})

describe('Test controller.getSearchQuery', function () {
    describe('At feeds/index.js: GET /:feedId/search', function () {
        describe('With input', function () {
            it('Should return status 500', function (done) {
                var feedId = 'asdf';
                chai.request(host)
                    .get('/api/feeds/' + feedId + '/search')
                    .send({
                        'feedId': feedId
                    })
                    //The API uses req.query, so use .query() instead of .set()
                    .end(function (err, res) {
                        expect(err).to.be.null;
                        expect(res.body).to.not.null;
                        expect(res).to.have.status(500);
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
                var feedId = 'asdf';
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
                        expect(res).to.have.status(500);
                        done();
                    })
            })
        })
    })
})

describe('Test controller.postSearchQuery', function () {
    describe('At feeds/index.js: POST /:feedId/search', function () {
        describe('With invalid feedId input', function () {
            it('Should return status 500', function (done) {
                var feedId = 'asdf'
                chai.request(host)
                    .post('/api/feeds/' + feedId + '/search')
                    .send({
                        'feedId': feedId
                    })
                    //The API uses req.query, so use .query() instead of .set()
                    .end(function (err, res) {
                        expect(err).to.be.null;
                        expect(res.body).not.null;
                        expect(res).to.have.status(500);
                        done();
                    })
            })
        })
    })
})

describe('Test controller.checkIfAlreadyEdited', function () {
    describe('At feeds/index.js: GET /:feedId/checkIfAlreadyEdited', function () {
        describe('With invalid feedIds input', function () {
            it('Should return status 500', function (done) {
                var feedId = 'asdf';
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
                        //Not available
                        expect(res.body.message).equal('NA');
                        done();
                    })
            })
        })
    })
})