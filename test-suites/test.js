var chai = require('chai');
var chaiHTTP = require('chai-http');
chai.use(chaiHTTP);

describe('Test-feed-valid', function () {
    require('./test-feed-valid.js');
})
describe('Test-feed-invalid', function () {
    require('./test-feed-invalid.js');
})
describe('Test-last10-exposedAPI', function () {
    require('./test-last10-exposedAPI-valid.js');
})
describe('Test-last10-exposedAPI', function () {
    require('./test-last10-exposedAPI-invalid.js')
})
describe('Test-upload-valid', function () {
    require('./test-upload-valid.js')
})
// describe('Test-upload-invalid', function () {
//     require('./test-upload-invalid.js')
// })
describe('test-upload-handleFtpFile',function(){
    require('./test-upload-handleFtpFile.js')
})
