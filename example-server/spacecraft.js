/*
 Spacecraft.js simulates a small spacecraft generating telemetry.
*/

function Spacecraft() {
    this.state = {
        "bat": 4.2,
        "irsig": 0,
        "internal_temperature": 0.0,
        "prs1": 0.0,
        "prs2": 0.0,
        "prs3": 0.0,
        "prs4": 0.0,
        "prs5": 0.0,
        "tc1": 0.0,
        "tc2": 0.0,
        "tc3": 0.0,
        "tc4": 0.0,
        "tc5": 0.0,
        "tc6": 0.0,
        "ax": 0.0,
        "ay": 0.0,
        "az": 0.0,
        "gx": 0.0,
        "gy": 0.0,
        "gz": 0.0,
        "hax": 0.0,
        "hay": 0.0,
        "haz": 0.0,
        "quat_w": 0.0,
        "quat_x": 0.0,
        "quat_y": 0.0,
        "quat_z": 1.0
    };
    this.history = {};
    this.listeners = [];
    Object.keys(this.state).forEach(function (k) {
        this.history[k] = [];
    }, this);

    setInterval(function () {
        //this.updateState();
        this.generateTelemetry();
    }.bind(this), 1000);

    // console.log("Example spacecraft launched!");
    // console.log("Press Enter to toggle thruster state.");

    // process.stdin.on('data', function () {
    //     this.state['prop.thrusters'] =
    //         (this.state['prop.thrusters'] === "OFF") ? "ON" : "OFF";
    //     this.state['comms.recd'] += 32;
    //     console.log("Thrusters " + this.state["prop.thrusters"]);
    //     this.generateTelemetry();
    // }.bind(this));
};

/**
 * Takes a measurement of spacecraft state, stores in history, and notifies 
 * listeners.
 */
Spacecraft.prototype.generateTelemetry = function () {
    var timestamp = Date.now(), sent = 0;
    Object.keys(this.state).forEach(function (id) {
        var state = { timestamp: timestamp, value: this.state[id], id: id};
        this.notify(state);
        //console.log("ID is: " + id + ", state is: " + state);
        this.history[id].push(state);
    }, this);
};

Spacecraft.prototype.notify = function (point) {
    this.listeners.forEach(function (l) {
        l(point);
    });
};

Spacecraft.prototype.listen = function (listener) {
    this.listeners.push(listener);
    return function () {
        this.listeners = this.listeners.filter(function (l) {
            return l !== listener;
        });
    }.bind(this);
};

module.exports = function () {
    return new Spacecraft()
};
