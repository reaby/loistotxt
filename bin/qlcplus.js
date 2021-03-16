const EventEmitter = require("events");
const config = require('../config.json');
const eventToPromise = require('event-to-promise');
const WebSocket = require('ws');

class QLCplus extends EventEmitter {

    constructor() {
        super();
        this.websocket = null;
        this.isConnected = false;
    }

    async query(command, ...params) {
        if (this.isConnected === false) {
            console.log("tried to query command to QLC+, but api is disconnected!");
            return;
        }
        try {
            this.websocket.send("QLC+API|" + command + "|" + params.join("|"));
            return await eventToPromise(this, `api:${command}`);
        } catch (e) {
            console.log(e);
        }

    }

    send(command, ...params) {
        if (this.isConnected === false) {
            console.log("tried to send command to QLC+, but api is disconnected!");
            return;
        }
        try {
            this.websocket.send("QLC+API|" + command + "|" + params.join("|"));            
        } catch (e) {
            console.log(e);
        }
    }

    async connect() {
        if (this.isConnected) return;
        this.websocket = new WebSocket(`ws://${config.qlc.websocket.address}/qlcplusWS`);
        this.setupListeners();
        return await eventToPromise(this, "connect");
    }

    setupListeners() {
        this.websocket.on("open", () => {
            console.log("QLC+ connection successful!");
            this.isConnected = true;
            this.emit("connect", true)
        });

        this.websocket.on("close", (code) => {
            this.isConnected = false;
            this.websocket = null;
            this.emit("connect", false);            
        });

        this.websocket.on("error", (err) => {
            console.log("QLC+ connection error!");            
        });

        this.websocket.on("message", (msg) => {
            let parts = msg.split('|');
            parts.shift(); // remove API
            let command = parts.shift();

            switch (command) {
                case "getFunctionsList": {
                    let out = [];
                    for (let i in parts) {
                        if (i % 2 == 1) {
                            out.push(parts[i]);
                        }
                    }
                    this.emit(`api:${command}`, out);
                    break;                    
                }
                case "getFunctionStatus": {
                    this.emit(`api:${command}`, parts[0]);
                    break;
                }

                default: {                    
                    this.emit(`api:${command}`, parts);
                    break;
                }
            }

        });
    }
}

module.exports = QLCplus;
