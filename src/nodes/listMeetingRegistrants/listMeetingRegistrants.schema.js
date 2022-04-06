const { Node, Schema, fields } = require("@mayahq/module-sdk");
const refresh = require("../../util/refresh");
const makeRequestWithRefresh = require('../../util/reqWithRefresh')

class ListMeetingRegistrants extends Node {
	constructor(node, RED, opts) {
		super(node, RED, {
			...opts,
		});
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
		this.setStatus("PROGRESS", "Fetching zoom meeting registrants...");
		try {
			const request = {
				url: `https://api.zoom.us/v2/meetings/${vals.meetingId}/registrants?page_size=${vals.pageSize}`,
				method: "GET",
				headers: {
					Authorization: `Bearer ${this.tokens.vals.access_token}`,
					"Content-Type": "application/json",
				},
			};

			const response = await makeRequestWithRefresh(this, request)
			msg.payload = response.data
			this.setStatus("SUCCESS", "Fetched")
			return msg
		} catch (err) {
			msg["__isError"] = true;
			msg.error = err;
			this.setStatus("ERROR", "error occurred");
			return msg;
		}
	}
}

module.exports = ListMeetingRegistrants;
