const { Node, Schema, fields } = require("@mayahq/module-sdk");
const ZoomAuth = require("../zoomAuth/zoomAuth.schema");

class ListMeetingRegistrants extends Node {
	constructor(node, RED, opts) {
        super(node, RED, {
            ...opts
        })
    }

	static schema = new Schema({
		name: "list-meeting-registrants",
		label: "list-meeting-registrants",
		category: "Maya Red Zoom",
		icon: "zoom.png",
		isConfig: false,
		fields: {
			// convert long to string before storing
			meetingId: new fields.Typed({
				type: "str",
				defaultVal: "",
				allowedTypes: ["msg", "flow", "global"],
			}),
			pageSize: new fields.Typed({
				type: "num",
				defaultVal: 10,
				allowedTypes: ["msg", "flow", "global"],
			}),
			//nextPageToken: new fields.Typed({type: 'str', defaultVal: '', allowedTypes: ['msg', 'flow', 'global']}),
		},
	});

	onInit() {
		// Do something on initialization of node
	}

	async onMessage(msg, vals) {
		this.setStatus("PROGRESS", "fetching zoom meeting registrants...");
		var fetch = require("node-fetch"); // or fetch() is native in browsers
		try {
			const fetchConfig = {
				url: `https://api.zoom.us/v2/meetings/${vals.meetingId}/registrants?page_size=${vals.pageSize}`,
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
						msg.isError = true;
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
						msg.error = json.error;
						this.setStatus("ERROR", json.error.message);
						return msg;
					} else {
						msg.payload = json;
						this.setStatus("SUCCESS", "Fetched Meeting registrants");
						return msg;
					}
				} else {
					msg.error = json.error;
					this.setStatus("ERROR", json.error.message);
					return msg;
				}
			} else {
                msg.payload = json;
                this.setStatus("SUCCESS", "Fetched Meeting registrants");
                return msg;
            }
		} catch (err) {
			msg.error = err;
			this.setStatus("ERROR", "error occurred");
			return msg;
		}
	}
}

module.exports = ListMeetingRegistrants;
