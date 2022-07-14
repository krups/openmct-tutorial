/**
 * Basic implementation of a history and realtime server.
 */

var Spacecraft = require('./spacecraft');
var RealtimeServer = require('./realtime-server');
var HistoryServer = require('./history-server');
var StaticServer = require('./static-server');

var expressWs = require('express-ws');
var app = require('express')();
expressWs(app);

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('telem.db');

var spacecraft = new Spacecraft();
var realtimeServer = new RealtimeServer(spacecraft,db);
var historyServer = new HistoryServer(spacecraft,db);
var staticServer = new StaticServer();

app.use('/realtime', realtimeServer);
app.use('/history', historyServer);
app.use('/', staticServer);

var port = process.env.PORT || 8080

app.listen(port, function () {
    console.log('Open MCT hosted at http://localhost:' + port);
    console.log('History hosted at http://localhost:' + port + '/history');
    console.log('Realtime hosted at ws://localhost:' + port + '/realtime');
});
