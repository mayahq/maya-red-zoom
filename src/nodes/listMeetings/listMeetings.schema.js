const {
    Node,
    Schema,
    fields
} = require('@mayahq/module-sdk')

class ListMeetings extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts
        })
    }

    static schema = new Schema({
        name: 'list-meetings',
        label: 'list-meetings',
        category: 'Maya Red Zoom',
        icon: 'zoom.png',
        isConfig: false,
        fields: {
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
        try {
			const fetchConfig = {
				url: `https://api.zoom.us/v2/users/${vals.userId}/meetings?type=${vals.meetingType}&page_size=${vals.pageSize}`,
				method: "GET",
				headers: {
					Authorization: `Bearer ${this.tokens.vals.access_token}`,
					"Content-Type": "application/json",
				},
			};
			let res = await fetch(fetchConfig.url, {
				method: fetchConfig.method,
				headers: fetchConfig.headers,
			});
			let json = await res.json();
			if (json.error) {
				if (json.error.code === 401) {
					const { access_token } = await this.refreshTokens();
					if (!access_token) {
						this.setStatus("ERROR", "Failed to refresh access token");
						msg["__isError"] = true;
						msg.error = {
							reason: "TOKEN_REFRESH_FAILED",
						};
						return msg;
					}
					fetchConfig.headers.Authorization = `Bearer ${access_token}`;
					res = await fetch(fetchConfig.url, {
						method: fetchConfig.method,
						headers: fetchConfig.headers,
					});
					json = await res.json();
					if (json.error) {
						msg["__isError"] = true;
						msg.error = json.error;
						this.setStatus("ERROR", json.error.message);
						return msg;
					} else {
						msg.payload = json;
						this.setStatus("SUCCESS", "Fetched Meetings");
						return msg;
					}
				} else {
					msg["__isError"] = true;
					msg.error = json.error;
					this.setStatus("ERROR", json.error.message);
					return msg;
				}
			} else {
                msg.payload = json;
                this.setStatus("SUCCESS", "Fetched Meetings");
                return msg;
            }
		} catch (err) {
			msg.error = err;
			this.setStatus("ERROR", "error occurred");
			return msg;
		}
    }
}

module.exports = ListMeetings