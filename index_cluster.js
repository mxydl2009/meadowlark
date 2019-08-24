var cluster = require('cluster'); // 引入cluster模块：

function startWorker () {
    var worker = cluster.fork();
    console.log('CLUSTER: Worker %d started', worker.process.pid);
}

if (cluster.isMaster) {
    console.log(`主进程${process.pid}正在运行`);
    // require('os').cpus().forEach(function () {
    //     startWorker();
    // });
    for (var i = 0; i < 8; i ++) {
        startWorker();
    }
    cluster.on('disconnect', function (worker) {
        console.log('CLUSTER: Worker %d disconnected from the cluster.', worker.process.pid);
    })
    cluster.on('exit', function (worker, code, signal) {
        console.log('CLUSTER: Worker %d died with exit code %d (%s)', worker.pid, code, signal);
        startWorker();
    });
} else {
    require('./index.js')();
}