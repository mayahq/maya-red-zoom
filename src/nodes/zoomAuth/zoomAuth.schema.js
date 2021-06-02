const {
    Node,
    Schema,
    fields
} = require('@mayahq/module-sdk')

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
            // Whatever custom fields the node needs.
        },
        redOpts: {
            credentials: {
                someSecret: {
                    type: String
                }
            }
        }

    })

    onInit() {
        // Do something on initialization of node
    }

    async onMessage(msg, vals) {
        // Handle the message. The returned value will
        // be sent as the message to any further nodes.

    }
}

module.exports = ZoomAuth