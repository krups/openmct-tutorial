var express = require('express');

const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')
//const port = new SerialPort({ path: '/dev/tty.usbmodem21201', baudRate: 115200 }, false)
const port = new SerialPort({ path: '/dev/tty.usbmodem1201', baudRate: 115200 }, false)
//const port = new SerialPort({ path: '/dev/tty.usbmodem65060901', baudRate: 115200 }, false)

port.on('error', function(err) {
    console.log("Error opening serial port: " + err); // THIS SHOULD WORK!
    console.log("Continuing to run in DB history only mode")
});

port.open();

function RealtimeServer(spacecraft,db) {

    var router = express.Router();

    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }))

    parser.on('data', function (data) 
    {
	try {
	    point = JSON.parse(data);
	    point.timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

            spacecraft.state[point.id] = point.value;
	    
            // insert one row into the langs table                                                                                    
            db.run("INSERT INTO history(timestamp,value,id) VALUES(?,?,?)", [point.timestamp, point.value, point.id], function(err) {
		if (err) {
		    return console.log(err.message);
		}
            });
	} catch (e) {
	    console.log("data wasnt json: " + data);
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
                    console.log("\" "+cmdstring+"\"");
                    port.write(cmdstring.trim());
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
