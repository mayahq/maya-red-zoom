const { Node, Schema, fields } = require("@mayahq/module-sdk");
const refresh = require("../../util/refresh");

class CreateMeeting extends Node {
	constructor(node, RED, opts) {
		super(node, RED, {
			...opts,
		});
	}

	static schema = new Schema({
		name: "create-meeting",
		label: "create-meeting",
		category: "Maya Red Zoom",
		isConfig: false,
		icon: "zoom.png",
		fields: {
			userId: new fields.Typed({
				type: "str",
				defaultVal: "me",
				allowedTypes: ["msg", "flow", "global"],
			}),
			// 1 - Instant meeting, 2 - Scheduled, 3 - Recurring with no fixed time, 8 - Recurring with fixed time
			meetingType: new fields.Select({
				options: [
					"Instant",
					"Scheduled",
					"Recurring with no fixed time",
					"Recurring with fixed time",
				],
				defaultVal: "Instant",
			}),
			topic: new fields.Typed({
				type: "str",
				defaultVal: "New zoom meeting",
				allowedTypes: ["msg", "flow", "global"],
			}),
			startTime: new fields.Typed({
				type: "str",
				defaultVal: new Date().toISOString(),
				allowedTypes: ["msg", "flow", "global"],
			}),
			timeZone: new fields.Typed({
				type: "str",
				defaultVal: "Asia/Kolkata",
				allowedTypes: ["msg", "flow", "global"],
			}),
			duration: new fields.Typed({
				type: "num",
				defaultVal: 40,
				allowedTypes: ["msg", "flow", "global"],
			}),
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
		this.setStatus("PROGRESS", "creating zoom meeting...");
		var fetch = require("node-fetch"); // or fetch() is native in browsers
		try {
			let type = 1;
			switch (vals.meetingType) {
				case "Instant":
					type = 1;
					break;
				case "Scheduled":
					type = 2;
					break;
				case "Recurring with no fixed time":
					type = 3;
					break;
				case "Recurring with fixed time":
					type = 8;
					break;
			}
			const fetchConfig = {
				url: `https://api.zoom.us/v2/users/${vals.userId}/meetings`,
				method: "POST",
				body: JSON.stringify({
					topic: vals.topic,
					//agenda,
					type: type,
					//password,
					// ** scheduled fields
					start_time: vals.startTime,
					duration: vals.duration,
					timezone: vals.timeZone,
					// ** recurring fields
				}),
				headers: {
					Authorization: `Bearer ${this.tokens.vals.access_token}`,
					"Content-Type": "application/json",
				},
			};
			let res = await fetch(fetchConfig.url, {
				method: fetchConfig.method,
				body: fetchConfig.body,
				headers: fetchConfig.headers,
			});
			let responseStatus = await res.status;
			let json = await res.json();
			if (responseStatus >= 300) {
				if (responseStatus === 401) {
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
						body: fetchConfig.body,
						headers: fetchConfig.headers,
					});
					responseStatus = await res.status;
					json = await res.json();
					if (responseStatus >= 300) {
						msg["__isError"] = true;
						msg.error = json.message;
						this.setStatus("ERROR", json.message);
						return msg;
					} else {
						msg.payload = json;
						this.setStatus("SUCCESS", "Zoom meeting created");
						return msg;
					}
				} else {
					msg["__isError"] = true;
					msg.error = json.error;
					this.setStatus("ERROR", json.message);
					return msg;
				}
			} else {
				msg.payload = json;
				this.setStatus("SUCCESS", "Zoom meeting created");
				return msg;
			}
		} catch (err) {
			msg["__isError"] = true;
			msg.error = err;
			this.setStatus("ERROR", "error occurred");
			return msg;
		}
	}
}

module.exports = CreateMeeting;
