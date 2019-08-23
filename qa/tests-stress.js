var loadtest = require('loadtest');
var expect = require('chai').expect;

suite('Stress tests', function () {
    test('Homepage should handle 200 requests per second', function (done) {
        var options = {
            url: 'http://localhost:3000',
            concurrency: 4, // 创建的并行客户端的个数
            maxRequests: 200
        };
        loadtest.loadTest(options, function (err, result) {
            expect(!err);
            expect(result.totalTimeSeconds < 1);
            done();
        });
    });
});