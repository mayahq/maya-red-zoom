const { Node, Schema, fields } = require("@mayahq/module-sdk");
const refresh = require("../../util/refresh");
const timezoneFix = require("moment-timezone");
const makeRequestWithRefresh = require('../../util/reqWithRefresh')

class ListMeetings extends Node {
	constructor(node, RED, opts) {
		super(node, RED, {
			...opts,
		});
	}

	static schema = new Schema({
		name: "list-meetings",
		label: "list-meetings",
		category: "Maya Red Zoom",
		icon: "zoom.png",
		isConfig: false,
		fields: {
			userId: new fields.Typed({
				type: "str",
				defaultVal: "me",
				allowedTypes: ["msg", "flow", "global"],
			}),
			meetingType: new fields.Select({
				options: ["upcoming", "scheduled", "live"],
				defaultVal: "upcoming",
			}),
			pageSize: new fields.Typed({
				type: "num",
				defaultVal: 10,
				allowedTypes: ["msg", "flow", "global"],
			}),
			//nextPageToken: new fields.Typed({type: 'str', defaultVal: '', allowedTypes: ['msg', 'flow', 'global']}),
		},
	});
	async refreshTokens() {
		const newTokens = await refresh(this);
		await this.tokens.set(newTokens);
		return newTokens;
	}
	onInit() {
		// Do something on initialization of node
	}

	async onMessage(msg, vals) {
		this.setStatus("PROGRESS", "fetching zoom meetings...");
		try {
			const request = {
				url: `https://api.zoom.us/v2/users/${vals.userId}/meetings?type=${vals.meetingType}&page_size=${vals.pageSize}`,
				method: "GET",
				headers: {
					Authorization: `Bearer ${this.tokens.vals.access_token}`,
					"Content-Type": "application/json",
				},
			};
			const response = await makeRequestWithRefresh(this, request)
			const data = response.data
			await data.meetings.map((meet) => {
				let newStartTime = timezoneFix(meet.start_time)
					.tz(meet.timezone)
					.format();
				meet.start_time = newStartTime;
				return meet;
			});


			msg.payload = data
			this.setStatus("SUCCESS", "Fetched meetings")
			return msg
		} catch (err) {
			msg["__isError"] = true;
			msg.error = err;
			this.setStatus("ERROR", "error occurred");
			return msg;
		}
	}
}

module.exports = ListMeetings;
