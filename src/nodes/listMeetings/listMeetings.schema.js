const {
    Node,
    Schema,
    fields
} = require('@mayahq/module-sdk')
const ZoomAuth = require("../zoomAuth/zoomAuth.schema");

class ListMeetings extends Node {
    constructor(node, RED) {
        super(node, RED)
    }

    static schema = new Schema({
        name: 'list-meetings',
        label: 'list-meetings',
        category: 'Maya Red Zoom',
        isConfig: false,
        fields: {
            session: new fields.ConfigNode({type: ZoomAuth}),
            userId: new fields.Typed({type: 'str', defaultVal: 'me', allowedTypes: ['msg', 'flow', 'global']}),
            meetingType: new fields.Select({ options: ['upcoming','scheduled', 'live'], defaultVal: 'upcoming' }),
            pageSize: new fields.Typed({type: 'num', defaultVal: 10, allowedTypes: ['msg', 'flow', 'global']}),
            //nextPageToken: new fields.Typed({type: 'str', defaultVal: '', allowedTypes: ['msg', 'flow', 'global']}),
        },

    })

    onInit() {
        // Do something on initialization of node
    }

    async onMessage(msg, vals) {
        this.setStatus("PROGRESS", "fetching zoom meetings...");
        var fetch = require("node-fetch"); // or fetch() is native in browsers
        try{
            let res = await fetch(`https://api.zoom.us/v2/users/${vals.userId}/meetings?type=${vals.meetingType}&page_size=${vals.pageSize}`, 
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${this.credentials.session.access_token}`,
                    "Content-Type":"application/json"
                }
            });
            let json = await res.json();
            if(json.error){
                msg.error = json.error;
                this.setStatus("ERROR", json.error.message);
                return msg;
            }
            msg.payload = json;
            this.setStatus("SUCCESS", "fetched");
            return msg;
        }
        catch(err){
            msg.error = err;
            this.setStatus("ERROR", "error occurred");
            return msg;
        }
    }
}

module.exports = ListMeetings