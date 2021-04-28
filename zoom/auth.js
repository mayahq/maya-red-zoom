const { isNullOrUndefined } = require('util');

module.exports = function (RED) {
    'use strict'
    function ZoomAuth(config) { 
        console.log("Zoom Module Loaded")
        // the config information needs a runtime API to be set as creds
        const FastMQ = require('fastmq');
        const nodeSchedule = require("node-schedule");
        var crypto = require('crypto');
        var localUserCache = {};
        RED.nodes.createNode(this, config);

        this.name = config.name === "" || isNullOrUndefined(config.name)? "zoom-auth" : config.name;
        this.fastmqChannel = config.fastmqChannel === "" || isNullOrUndefined(config.fastmqChannel) ? "master" : config.fastmqChannel;
        this.fastmqTopic = config.fastmqTopic === "" || isNullOrUndefined(config.fastmqTopic) ? "refresh" : config.fastmqTopic;
        const node = this;
        if (this.credentials.accessToken && this.credentials.expiryDate) {
            this.oauth = {
                accessToken: this.credentials.accessToken
            }
            this.credHash = crypto.createHash('sha1').update(this.credentials.accessToken).digest('base64');
            var self = this;
            localUserCache[self.credHash] = config.name;
            if (localUserCache.hasOwnProperty(self.credHash)) {
                this.localIdentityPromise = Promise.resolve(localUserCache[self.credHash]);
            } else {
                self.warn("Failed to authenticate with Zoom");
            }
            if(node.credentials.expiryDate < Date.now()){
                refreshCreds(node.fastmqChannel, node.fastmqTopic, node.credentials.referenceId);
            }

            function refreshCreds (fastmqChannel, fastmqTopic, referenceId) {
                var requestChannel;
                // create a client with 'requestChannel' channel name and connect to server.
                FastMQ.Client.connect('', fastmqChannel, {reconnect: false}).then((channel) => { // client connected
                    requestChannel = channel;
                    // send request to 'master' channel  with topic 'test_cmd' and JSON format payload.
                    let reqPayload = {
                        data: {
                            referenceId: referenceId,
                            configNodes: ["zoom-auth"]
                        }
                    };
                    return requestChannel.request(fastmqChannel, fastmqTopic, reqPayload, 'json');
                }).then((result) => {
                    console.log('Got response from master, data:', result.payload.data);
                    // client channel disconnect
                    requestChannel.disconnect();
                }).catch((err) => {
                    console.log('Got error:', err.stack);
                }).finally(() => {
                    if(requestChannel){
                        if(!requestChannel._socket.destroyed){
                            console.log("destroying client socket");
                            requestChannel.disconnect();
                        }
                    }
                });
            }
            nodeSchedule.scheduleJob(new Date(node.credentials.expiryDate - 5000), function () {refreshCreds(node.fastmqChannel, node.fastmqTopic, node.credentials.referenceId)})
        }
        // making refresh cred function accessible to all nodes for zoom
        node.refreshCreds = (fastmqChannel, fastmqTopic, referenceId) => {
            var requestChannel;
                // create a client with 'requestChannel' channel name and connect to server.
                FastMQ.Client.connect('', fastmqChannel, {reconnect: false}).then((channel) => { // client connected
                    requestChannel = channel;
                    // send request to 'master' channel  with topic 'test_cmd' and JSON format payload.
                    let reqPayload = {
                        data: {
                            referenceId: referenceId,
                            configNodes: ["zoom-auth"]
                        }
                    };
                    return requestChannel.request(fastmqChannel, fastmqTopic, reqPayload, 'json');
                }).then((result) => {
                    console.log('Got response from master, data:', result.payload.data);
                    // client channel disconnect
                    requestChannel.disconnect();
                }).catch((err) => {
                    console.log('Got error:', err.stack);
                }).finally(() => {
                    if(requestChannel){
                        if(!requestChannel._socket.destroyed){
                            console.log("destroying client socket");
                            requestChannel.disconnect();
                        }
                    }
                });
        }
    }

    RED.nodes.registerType('zoom-auth', ZoomAuth, {
        credentials: {
            accessToken: {
                type: String
            },
            expiryDate: {
                type: Number
            },
            referenceId: {
                type: String
            }
        }
    });


}