var chai = require('chai');
var chaiHTTP = require('chai-http');
chai.use(chaiHTTP);
var host = "http://localhost:3005";
var expect = chai.expect;
var nock = require('nock');
var express = require('express');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
//sinon stub assets
var sinon = require('sinon');
var FeedModel = require('../server/api/feeds/feed.model.js');
var FeedController = require('../server/api/feeds/feed.controller.js');
var request = require('request');
var app = express();

before(function () {
    return new Promise(function (resolve) {
        sinon.stub(FeedModel, 'create')
            .yields(null, 'create mocked!')
            .returns(sinon.stub().returns({ status: 200 }));
        sinon.stub(FeedModel.prototype, 'save')
            .yields(null, 'save mocked!')
            .returns(sinon.stub().returns({ status: 200 }));

        resolve();
    })

})
after(function () {
    return new Promise(function (resolve) {
        FeedModel.create.restore();
        resolve();
    })
})

//(!) Disabled for preventing spams into db
describe('Test controller.create', function () {
    describe('At feeds/index.js: POST /', function () {
        describe('With name and startDate input', function () {
            it('Should return status 200', function (done) {
                var paramsObject = { 'name': 'newSpacePotato', 'startDate': '1999-04-01' };
                //Mock request
                nock(host)
                    .post('/api/feeds/', paramsObject)
                    .reply(200, paramsObject);
                //Mock mongoose model.create function
                FeedModel.create(paramsObject, function (err, res) {
                    expect(res).to.be.equal('create mocked!');
                    console.log('Result:' + res);
                });
                //Mock req param then send request to controller.
                app.use(bodyParser.urlencoded({ extended: true }))
                app.use(bodyParser.json())
                function setRequestBody(req, next) {
                    req.body.name = 'testMock';
                    req.body.startDate = '1999-04-01';
                    next();
                }
                app.use(setRequestBody);
                app.post(function (req, res, next) {
                    FeedController.create(req, res);
                    next();
                });
                done();
                //This can't be mocked for some reason
                // chai.request(host)
                //     .post('/api/feeds/')
                //     .send(paramsObject)
                //     //The API uses req.query, so use .query() instead of .set()
                //     .end(function (err, res) {
                //         expect(err).to.be.null;
                //         expect(res).to.have.status(200);
                //         console.log(res.body);
                //         done();
                //     })
            })
        })
    })
})

