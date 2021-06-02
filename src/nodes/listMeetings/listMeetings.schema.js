const {
    Node,
    Schema
} = require('@mayahq/module-sdk')

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
            // Whatever custom fields the node needs.
        },

    })

    onInit() {
        // Do something on initialization of node
    }

    async onMessage(msg, vals) {
        // Handle the message. The returned value will
        // be sent as the message to any further nodes.

    }
}

module.exports = ListMeetings