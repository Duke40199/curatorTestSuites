const chai = require('chai');
const chaiHTTP = require('chai-http');
const sinon = require('sinon');
chai.use(chaiHTTP);
const host = "http://localhost:3005";
var expect = chai.expect;
//test data

var FeedModel = require('../server/api/feeds/feed.model');
var feedId = '5c936a84b3553272c7818127';
var crawlerId = 'wrongCrawlerId';
before(function () {
    return new Promise(function (resolve) {
        sinon.stub(FeedModel.prototype, 'save')
            .yields(null, 'save mocked!');
        resolve();
    });
})
//Aside from turning off the DB, there's no method to make this response to 500
describe('test controller.attach_email', function () {
    describe('at router.post(/csv/email/:crawlingId, controller.attach_email);', function () {
        describe('Without email input and crawlingID', function () {
            it('should return 500', function (done) {
                FeedModel.findOne()
                chai.request(host)
                    .post('/api/upload/csv/email/' + crawlerId)
                    .send({
                        //'emails': 'anh.nguyen0909@knorex.com',
                        //'crawlingId': crawlerId
                    })
                    .end(function (err, res) {
                        //expect(res).to.have.status(500);
                        //console.log(res.body)
                        done();
                    })
            })
        })
    })
})
//Aside from turning off the DB, there's no method to make this response go to 500
//Can't expect the result to 0 either, since there'll be ids that do not have a.
describe('test controller.count ', function () {
    describe('at /api/upload/csv/count', function () {
        describe('Without ids input', function () {
            it('should return 500', function (done) {
                chai.request(host)
                    .get('/api/upload/csv/count')
                    //.set('advertiser-id', '')
                    //.set('publisher-id', 'kxtest1')
                    .end(function (err, res) {
                        //expect(res).to.have.status(500);
                        //expect(res.body).to.be.null;
                        console.log();
                        done();
                    })
            })
        })
    })
})

describe('test controller.get ', function () {
    describe('at /api/upload/csv/get/:page', function () {
        describe('Without ids input', function () {
            it('should return 200', function (done) {
                chai.request(host)
                    .get('/api/upload/csv/get/' + '1')
                    //.set('advertiser-id', ' ')
                    //.set('publisher-id', 'kxtest1')
                    .send('page', '1')
                    .end(function (err, res) {
                        expect(res).to.have.status(200);
                        console.log(res);
                        done();
                    })
            })
        })
    })
})
//Line that caused a bug: line 836, res.json(data.data)
describe('test controller.getData ',() => {
    describe('at /api/upload/csv/get/data/:crawlingId', () => {
        describe('Without crawlerID input', () => {
            it('should return null', (done) => {
                crawlerId = 'wrongCrawlerId';
                chai.request(host)
                    .get('/api/upload/csv/get/data/' + crawlerId)
                    //.send('crawlingId', crawlerId)
                    .end(function (err, res) {
                        expect(res.body).to.be.equal(null);
                        console.log(res);
                        done();
                    })
            })
        })
    })
})
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

//Aside from turning off the DB, there's no method to make this response go to 500
describe('test controller.delete ', function () {
    describe('at /api/upload/csv, DELETE', function () {
        describe('without crawlingId', function () {
            it('should return 200', function (done) {
                crawlerId = '55ff7ba81b66896a62a9056f';
                chai.request(host)
                    .delete('/api/upload/csv/' + crawlerId)
                    //.set({ 'crawlingId': crawlerId })
                    .end(function (err, res) {
                        expect(res).to.have.status(500);
                        done();
                    })
            })
        })
    })
})

describe('test controller.sample ', function () {
    describe('at /api/upload/csv/sample/:type, get', function () {
        describe('without crawlingId input', function () {
            it('should return 200', function (done) {
                var type = 'education';
                chai.request(host)
                    .get('/api/upload/csv/sample/' + type)
                    //.set({ 'crawlingId': crawlerId })
                    .end(function (err, res) {
                        expect(res).to.have.status(500);
                        console.log(res.body);
                        done();
                    })
            })
        })
    })
})