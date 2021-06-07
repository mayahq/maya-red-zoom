const {
    Node,
    Schema,
    fields
} = require('@mayahq/module-sdk')
const ZoomAuth = require("../zoomAuth/zoomAuth.schema");

class CreateMeeting extends Node {
    constructor(node, RED) {
        super(node, RED)
    }

    static schema = new Schema({
        name: 'create-meeting',
        label: 'create-meeting',
        category: 'Maya Red Zoom',
        isConfig: false,
        fields: {
            session: new fields.ConfigNode({type: ZoomAuth}),
            userId: new fields.Typed({type: 'str', defaultVal: 'me', allowedTypes: ['msg', 'flow', 'global']}),
            // 1 - Instant meeting, 2 - Scheduled, 3 - Recurring with no fixed time, 8 - Recurring with fixed time
            meetingType: new fields.Select({ options: ['Instant', 'Scheduled', 'Recurring with no fixed time', 'Recurring with fixed time'], defaultVal: 'Instant' }),
            topic: new fields.Typed({type: 'str', defaultVal: 'New zoom meeting', allowedTypes: ['msg', 'flow', 'global']}),
        },

    })

    onInit() {
        // Do something on initialization of node
    }

    async onMessage(msg, vals) {
        this.setStatus("PROGRESS", "creating zoom meeting...");
        var fetch = require("node-fetch"); // or fetch() is native in browsers
        try{
            let type = 1;
            switch(meetingType){
                case 'Instant':
                    type = 1;
                case 'Scheduled':
                    type = 2;
                case 'Recurring with no fixed time':
                    type = 3;
                case 'Recurring with fixed time':
                    type = 8;
            }
            let res = await fetch(`https://api.zoom.us/v2/users/${vals.userId}/meetings`, 
            {
                method: "POST",
                body:JSON.stringify({
                    topic: vals.topic,
                    //agenda,
                    type: type,
                    //password,
                    // ** scheduled fields
                    // start_time,
                    // duration,
                    // timezone,
                    // ** recurring fields

                }),
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
            this.setStatus("SUCCESS", "zoom meeting created");
            return msg;
        }
        catch(err){
            msg.error = err;
            this.setStatus("ERROR", "error occurred");
            return msg;
        }

    }
}

module.exports = CreateMeeting