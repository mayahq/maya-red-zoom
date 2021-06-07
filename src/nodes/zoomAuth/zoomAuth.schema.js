const {
    Node,
    Schema,
    fields
} = require('@mayahq/module-sdk')
const FastMQ = require('fastmq');
const nodeSchedule = require("node-schedule");
const crypto = require('crypto');

class ZoomAuth extends Node {
    constructor(node, RED) {
        super(node, RED)
    }

    static schema = new Schema({
        name: 'zoom-auth',
        label: 'zoom-auth',
        category: 'config',
        isConfig: true,
        fields: {
            fastmqChannel: new fields.Typed({type: 'str', defaultVal: 'master'}),
            fastmqTopic: new fields.Typed({type: 'str', defaultVal: 'topic'}),
        },
        redOpts: {
            credentials: {
                access_token: new fields.Credential({type: 'str', password: true}),
                expiry_date: new fields.Credential({type: 'num', hidden: true}),
                referenceId: new fields.Credential({type: 'str', password: true}),
            }
        }

    })

    onInit() {
        function refreshCreds (fastmqChannel, fastmqTopic, referenceId) {
            var requestChannel;
            // create a client with 'requestChannel' channel name and connect to server.
            FastMQ.Client.connect('', fastmqChannel, {reconnect: false}).then((channel) => { // client connected
                requestChannel = channel;
                // send request to 'master' channel  with topic 'test_cmd' and JSON format payload.
                let reqPayload = {
                    data: {
                        referenceId: referenceId,
                        configNodes: ['zoom-auth']
                    }
                };
                return requestChannel.request(fastmqChannel, fastmqTopic, reqPayload, 'json');
            }).then((result) => {
                console.log('Got response from master, data:' + result.payload.data);
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
        
        var localUserCache = {};
        const node = this._node;
        const credentials = this.credentials._self;
        if (credentials.access_token && credentials.expiry_date) {
            this.credHash = crypto.createHash('sha1').update(credentials.access_token).digest('base64');
            localUserCache[this.credHash] = this.name;
            if (localUserCache.hasOwnProperty(this.credHash)) {
                this.localIdentityPromise = Promise.resolve(localUserCache[this.credHash]);
            } else {
                this.warn("Failed to authenticate with Google");
            }
            if(credentials.expiry_date < Date.now()){
                refreshCreds(node.fastmqChannel, node.fastmqTopic, credentials.referenceId)
            }
            nodeSchedule.scheduleJob(new Date(credentials.expiry_date - 5000), function () {
                refreshCreds(node.fastmqChannel, node.fastmqTopic, credentials.referenceId)
            });
        }
    }

    async onMessage(msg, vals) {
        // Handle the message. The returned value will
        // be sent as the message to any further nodes.

    }
}

module.exports = ZoomAuth