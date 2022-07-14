/**
 * Basic Realtime telemetry plugin using websockets.
 */

function RealtimeTelemetryPlugin() {
    return function (openmct) {
        //var socket = new WebSocket(location.origin.replace(/^http/, 'ws').replace(/:[\d]+/,':5678'));
        var socket = new WebSocket(location.origin.replace(/^http/, 'ws') + '/realtime/');
        var listener = {};

        socket.onmessage = function (event) {
            //console.log(event.data);
            point = JSON.parse(event.data);
            point.timestamp = Date.now();

            if (listener[point.id]) {
                listener[point.id](point);
            }
        };

        var provider = {
            supportsSubscribe: function (domainObject) {
                return domainObject.type === 'example.telemetry';
            },
            subscribe: function (domainObject, callback) {
                listener[domainObject.identifier.key] = callback;
                socket.send('subscribe ' + domainObject.identifier.key);
                return function unsubscribe() {
                    delete listener[domainObject.identifier.key];
                    socket.send('unsubscribe ' + domainObject.identifier.key);
                };
            }
        };

        openmct.telemetry.addProvider(provider);
    }
}
