var express = require('express');

const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')

const port = new SerialPort({ path: process.env.SERIALPORT , baudRate: 115200 }, false)

port.on('error', function(err) {
    console.log("Error opening serial port: " + err); // THIS SHOULD WORK!
    console.log("Continuing to run in DB history only mode")
});

port.open();

function RealtimeServer(spacecraft,db) {

    var router = express.Router();

    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }))

    parser.on('data', function (data) {
        try {
            point = JSON.parse(data);
            point.timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

            if( point.id == "spec" ){
                //console.log(point);
                //spacecraft.state['spec'] = point;
                spacecraft.state['spec'].itime = point.itime;
                spacecraft.state['spec'].bin1 = point.bin1;
                spacecraft.state['spec'].bin2 = point.bin2;
                spacecraft.state['spec'].bin3 = point.bin3;
                spacecraft.state['spec'].bin4 = point.bin4;
                spacecraft.state['spec'].bin5 = point.bin5;
                spacecraft.state['spec'].bin6 = point.bin6;
            }
            else if( point.id == "gga" ){
                spacecraft.state['gps'].time = point.time;
                spacecraft.state['gps'].lat = point.lat;
                spacecraft.state['gps'].lon = point.lon;
                spacecraft.state['gps'].alt = point.alt;
                spacecraft.state['gps'].gps_utc = point.gps_utc;
            }
            else if ( point.id == "rmc" ){
                spacecraft.state['gps'].time = point.time;
                spacecraft.state['gps'].lat = point.lat;
                spacecraft.state['gps'].lon = point.lon;
                spacecraft.state['gps'].vel = point.vel;
                spacecraft.state['gps'].gps_utc = point.gps_utc;
            }
            else {
                spacecraft.state[point.id] = point.value;
                // only insert if its in the one value format
                // TODO: make this work for spec and gps                                                                           
                db.run("INSERT INTO history(timestamp,value,id) VALUES(?,?,?)", [point.timestamp, point.value, point.id], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }
                });
            }
        } catch (e) {
            console.log(data);
        }
    });
        
    router.ws('/', function (ws) {
        var unlisten = spacecraft.listen(notifySubscribers);
        var subscribed = {}; // Active subscriptions for this connection
        var handlers = { // Handlers for specific requests
                subscribe: function (id) {
                    console.log("got subscriber");
                    subscribed[id] = true;
                },
                unsubscribe: function (id) {
                    console.log("unsub");
                    delete subscribed[id];
                },
                gs: function(cmdstring) {
                    console.log("sending command to serial port...");
                    console.log("\" "+cmdstring.trim().split('_').join(' ')+"\"");
                    port.write(cmdstring.trim().split('_').join(' '));
                    port.write("\r\n");
                }
                
            };

        function notifySubscribers(point) {
            if (subscribed[point.id]) {
                ws.send(JSON.stringify(point));
            }
        }

        // Listen for requests
        ws.on('message', function (message) {
            var parts = message.split(' '),
                handler = handlers[parts[0]];
            if (handler) {
                handler.apply(handlers, parts.slice(1));
            }
        });

        // Stop sending telemetry updates for this connection when closed
        ws.on('close', unlisten);
    });

    return router;
};

module.exports = RealtimeServer;
