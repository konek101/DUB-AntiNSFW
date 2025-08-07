export class MessageSender {
    client;
    botID;
    constructor(client, clientID) {
        this.client = client;
        this.botID = clientID;
    }
    /**
    * Fetches the latest `count` messages from a Discord channel and formats them.
    * @param {number} count - Number of messages to fetch.
    * @param {string} channelId - Discord channel ID.
    * @returns {Promise<messages[]>}
    */
    async fetchMessages(count, channelId) {
        const messages = await this.client.fetch_messages(count, channelId);
        return messages.reverse(); // Reverse to get the oldest messages first
    }

    /**
     * Fetches the latest `count` messages from a Discord channel and formats them.
     * @param {messages[]} messages - Number of messages to fetch.
     * @returns {Promise<Array<{content: string, attachments: Array<string>}>}
     */
    async FormatMessages(messages) {
        // Combine messages fr89om the same user with the same timestamp
        const combinedMessages = [];
        for (const msg of messages) {

            const date = new Date(msg.timestamp);
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const now = new Date();
            const isToday =
                date.getDate() === now.getDate() &&
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear();

            let timestamp;
            if (isToday) {
                timestamp = `${hours}:${minutes}`;
            } else {
                // Check if yesterday
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);
                const isYesterday =
                    date.getDate() === yesterday.getDate() &&
                    date.getMonth() === yesterday.getMonth() &&
                    date.getFullYear() === yesterday.getFullYear();

                if (isYesterday) {
                    timestamp = `Wczoraj o ${hours}:${minutes}`;
                } else {
                    // Polish date: DD.MM.YYYY o HH:MM
                    const day = date.getDate().toString().padStart(2, '0');
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const year = date.getFullYear();
                    timestamp = `${day}.${month}.${year} o ${hours}:${minutes}`;
                }
            }
            const displayName = msg.author?.global_name || 'Unknown';
            if (msg.author?.id === this.botID) {
                // Skip messages from the bot itself
                continue;
            }
            if (
                combinedMessages.length > 0 &&
                combinedMessages[combinedMessages.length - 1].authorId === msg.author.id &&
                Math.abs(date - combinedMessages[combinedMessages.length - 1].date) <= 2 * 60 * 1000 // within 2 minutes
            ) {
                // Combine content
                combinedMessages[combinedMessages.length - 1].content += '\n' + (msg.content || '');
                // Combine attachments
                if (msg.attachments?.length) {
                combinedMessages[combinedMessages.length - 1].attachments.push(...msg.attachments.map(a => a.url));
                }
            } else {
                combinedMessages.push({
                date: date,
                authorId: msg.author.id,
                displayName,
                timestamp,
                content: msg.content || '',
                attachments: msg.attachments?.map(a => a.url) || []
                });
            }
        }
        const formattedMessages = combinedMessages.map(msg => ({
            content: `${msg.displayName}  ${msg.timestamp}:\n${msg.content}`,
            attachments: msg.attachments
        }));
        return formattedMessages;
    }

    /**
     * Combines consecutive messages without attachments, then sends them to a channel.
     * @param {Array<{content: string, attachments: Array<string>}>} messages
     * @param {string} channelId
     */
    async sendCombinedMessages(messages, channelId) {
        const combined = [];
        let buffer = '';
        for (const msg of messages) {
            if (msg.attachments.length === 0) {
                buffer += (buffer ? '\n\n' : '') + msg.content;
            } else {
                if (buffer) {
                    combined.push({ content: buffer, attachments: [] });
                    buffer = '';
                }
                combined.push(msg);
            }
        }
        if (buffer) combined.push({ content: buffer, attachments: [] });
        console.log(combined);
        for (const msg of combined) {
            await this.client.send(channelId, {content: msg.content});
            if (msg.attachments.length > 0) {
                for (const attachment of msg.attachments) {
                    await this.client.send(channelId, {content: attachment});
                }
            }
        }
    }
}










