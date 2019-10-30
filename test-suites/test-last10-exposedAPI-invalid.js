var chai = require('chai');
var chaiHTTP = require('chai-http');
chai.use(chaiHTTP);
var host = "http://localhost:3005";
var expect = chai.expect;
//sinon stub assets
var sinon = require('sinon');
var Middleware = require('../server/api/exposedAPI/feed.service.js');
var compose = require('composable-middleware');

//Stub SSO Authentication
before(function () {
    sinon.stub(Middleware, 'SSOAuthentication')
        .callsFake(function () {
            compose().use(
                function (next) {
                    return next();
                }
            )
        })
    console.log("Original SSO Authentication has been stubbed by Sinon mocking.");
});
//Restore SSO Authentication
after(function () {
    Middleware.SSOAuthentication.restore();
    console.log("Original SSO Authentication has been restored.");
})
//Work but will crash server
// describe("Test '/feed_id/:feed_id',controller.getFeedsDetails", function () {
//     describe("with mocked SSO Authenticator", function () {
//         it("should return status 500", function (done) {
//             var feedId = 'invalidFeedId';
//             chai.request(host)
//                 .get('/api/public/feeds/feed_id/' + feedId)
//                 .end((err, res) => {
//                     expect(err).to.be.null;
//                     expect(res).to.have.status(500);
//                     done();
//                 })
//         })
//     })
// })

describe("Test '/ftp_error', ftpErrors.insertFtpError ", () => {
    describe("with mocked SSO Authenticator", () => {
        describe("Without advertiserId", () => {
            it("should return status 400", (done) => {
                chai.request(host)
                    .post('/api/public/feeds/ftp_error')
                    //.set('advertiser-id', 'knx30494')
                    .set('instance-id', 'knx18608')
                    .set('error', 'Well it is time to fix bugs then? :> ')
                    .set('name', 'Knx18608_12automobile_0')
                    .end((err, res) => {
                        if (err) console.log(err);
                        expect(res).to.have.status(400);
                        expect(JSON.stringify(res.body)).to.be.equal('{}');
                        //console.log(res.body);
                        done();
                    })
            })
        })
    })
})

describe("Test '/ftp_error', ftpErrors.insertFtpError ", () => {
    describe("with mocked SSO Authenticator", () => {
        describe("Without instanceId", () => {
            it("should return status 400", (done) => {
                chai.request(host)
                    .post('/api/public/feeds/ftp_error')
                    .set('advertiser-id', 'knx30494')
                    //.set('instance-id', 'knx18608')
                    .set('error', 'Well it is time to fix bugs then? :> ')
                    .set('name', 'Knx18608_12automobile_0')
                    .end((err, res) => {
                        if (err) console.log(err);
                        expect(res).to.have.status(400);
                        expect(JSON.stringify(res.body)).to.be.equal('{}');
                        //console.log(res.body);
                        done();
                    })
            })
        })
    })
})

describe("Test '/ftp_error', ftpErrors.insertFtpError ", () => {
    describe("with mocked SSO Authenticator", () => {
        describe("Without error", () => {
            it("should return status 400", (done) => {
                chai.request(host)
                    .post('/api/public/feeds/ftp_error')
                    .set('advertiser-id', 'knx30494')
                    .set('instance-id', 'knx18608')
                    //.set('error', 'Well it is time to fix bugs then? :> ')
                    .set('name', 'Knx18608_12automobile_0')
                    .end((err, res) => {
                        if (err) console.log(err);
                        expect(res).to.have.status(400);
                        expect(JSON.stringify(res.body)).to.be.equal('{}');
                        //console.log(res.body);
                        done();
                    })
            })
        })
    })
})

describe("Test '/ftp_error', ftpErrors.insertFtpError ", () => {
    describe("with mocked SSO Authenticator", () => {
        describe("Without error", () => {
            it("should return status 400", (done) => {
                chai.request(host)
                    .post('/api/public/feeds/ftp_error')
                    .set('advertiser-id', 'knx30494')
                    .set('instance-id', 'knx18608')
                    .set('error', 'Well it is time to fix bugs then? :> ')
                    //.set('name', 'Knx18608_12automobile_0')
                    .end((err, res) => {
                        if (err) console.log(err);
                        expect(res).to.have.status(400);
                        //console.log(res.body);
                        done();
                    })
            })
        })
    })
})

describe("Test /update_feed, controller.updateFeed", () => {
    describe("with mocked SSO Authenticator", () => {
        describe("With invalid feedId input", () => {
            it("should return status 500", (done) => {
                //config invalid input
                var feedId = 'asdf';
                chai.request(host)
                    .post('/api/public/feeds/' + feedId + '/updateFeedFields')
                    .end((err, res) => {
                        if (err) console.log(err);
                        expect(res).to.have.status(500);
                        expect(JSON.stringify(res.body)).to.be.equal('{}');
                        //console.log(res.body);
                        done();
                    })
            })
        })
    })
})

describe("Test '/list_by_name', controller.getFeedsByName ", () => {
    describe("with mocked SSO Authenticator", () => {
        describe("With invalid feedName", () => {
            it("should return status 200 but no data found", (done) => {
                //Config invalid input
                var feedName = 'asdfasdf';
                var advertiserId = 'knx30494';
                chai.request(host)
                    .post('/api/public/feeds/list_by_name')
                    .set('name', feedName)
                    .set('advertiserid', advertiserId)
                    .end((err, res) => {
                        if (err) console.log(err);
                        expect(res).to.have.status(200);
                        expect(JSON.stringify(res.body.data)).to.be.equal('[]');
                        //console.log(res.body);
                        done();
                    })
            })
        })

    })
})

describe("Test '/myriad/advertisers/:advertiser_id', controller.getMyriadFeedsDetails ", () => {
    describe("with mocked SSO Authenticator", () => {
        it("should return status 200 and no data found", (done) => {
            //Config invalid input
            var advertiserId = 'invalidAdId';
            chai.request(host)
                .get('/api/public/feeds/myriad/advertisers/' + advertiserId)
                .end((err, res) => {
                    if (err) console.log(err);
                    expect(res).to.have.status(200);
                    expect(JSON.stringify(res.body.data)).to.be.equal('[]');
                    //console.log(res.body);
                    done();
                })
        })
    })
})

describe("'/advertiser', controller.getFeedByAdvertiser", () => {
    describe("When requesting to Curator", () => {
        describe("With invalid advertiserID input", () => {
            it("Should return status 200 and a void results", (done) => {
                //config invalid input
                var advertiserId = 'invalidAdId';
                chai.request(host)
                    //header
                    .post('/api/public/feeds/advertiser')
                    .send({
                        'advertiserId': advertiserId,
                        'userAccessToken': 'curator_admin',
                        'productAccessToken': '1729oct18@VN'
                    })
                    .end((err, res) => {
                        expect(res).to.have.status(200);
                        expect(JSON.stringify(res.body.results)).to.be.equal('[]');
                        //console.log(res.body);
                        done();
                    })
            })
        })

    })
})

describe("Test '/:feedId/updateFeedFields', controller.updateFeedFields ", () => {
    describe("with mocked SSO Authenticator", () => {
        describe("With invalid feedID input", () => {
            it("should return status 200 but no data found", (done) => {
                //config invalid input
                var feedId = 'invalidFeedId'
                chai.request(host)
                    .post('/api/public/feeds/' + feedId + '/updateFeedFields')
                    .end((err, res) => {
                        if (err) console.log(err);
                        expect(res).to.have.status(500);
                        expect(JSON.stringify(res.body)).to.be.equal('{}');
                        //console.log(res.body);
                        done();
                    })
            })
        })

    })
})

describe("Test '/all/advertisers/:advertiser_id', controller.getAllFeedsDetails ", () => {
    describe("with mocked SSO Authenticator", () => {
        describe("With invalid adID input", () => {
            it("should return status 200 but no data found", (done) => {
                //config invalid input here
                var advertiserId = 'invalidAdId';
                var status = 'approved';
                chai.request(host)
                    .post('/api/public/feeds/all/advertisers/' + advertiserId)
                    .set('status', status)
                    .end((err, res) => {
                        if (err) console.log(err);
                        expect(res).to.have.status(200);
                        expect(JSON.stringify(res.body.data)).to.be.equal('[]');
                        //console.log(res.body);
                        done();
                    })
            })
        })
    })
})

describe("Test '/all/advertisers/:advertiser_id', controller.getAllFeedsDetails ", () => {
    describe("with mocked SSO Authenticator", () => {
        describe("With no advertiserId input", () => {
            it("should return status 404", (done) => {
                //config invalid input here
                //var advertiserId = 'invalidAdId';
                var status = 'approved';
                chai.request(host)
                    .post('/api/public/feeds/all/advertisers/' + '')
                    .set('status', status)
                    .end((err, res) => {
                        if (err) console.log(err);
                        expect(res).to.have.status(404);
                        expect(JSON.stringify(res.body)).to.be.equal('{}');
                        //console.log(res.body);
                        done();
                    })
            })
        })
    })
})

describe("Test '/ftp_error/update_notified', ftpErrors.updateNotified ", () => {
    describe("with mocked SSO Authenticator", () => {
        describe("With invalid feedId", () => {
            it("should return status 500", (done) => {
                var feedId = 'invalidFeedId';
                chai.request(host)
                    .post('/api/public/feeds/ftp_error/update_notified')
                    .set('ids', feedId)
                    .end((err, res) => {
                        if (err) console.log(err);
                        expect(res).to.have.status(500);
                        expect(JSON.stringify(res.body)).to.be.equal('{}');
                        //console.log(res.body);
                        done();
                    })
            })
        })

    })
})