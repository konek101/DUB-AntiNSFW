require('dotenv').config();
const fs = require('fs');
const Discord = require('discord-user-bots');
const client = new Discord.Client();

let blacklistedFormats = [];
let blacklist = [];
let admins = [506277152753319956n];
let currentChannel = 0n;

let blacklistedResponse = "This message contains a blacklisted format.";
// Custom replacer for JSON.stringify to handle BigInt
function jsonReplacer(key, value) {
    return typeof value === 'bigint' ? value.toString() : value;
}

// Custom reviver for JSON.parse to handle BigInt
function jsonReviver(key, value) {
    if (typeof value === 'string' && /^\d+n?$/.test(value)) {
        return BigInt(value.replace('n', ''));
    }
    return value;
}

function isLinkToImage(url) {
    url = url.toLowerCase();
    return url.contains('jpg') || url.contains('png') || url.contains('gif') || url.contains('webp') || url.contains('bmp') || url.contains('tiff') || url.contains('svg');
}

function isLinkToVideo(url) {
    url = url.toLowerCase();
    return url.contains('mp4') || url.contains('webm') || url.contains('mov') || url.contains('avi') || url.contains('wmv') || url.contains('mkv') || url.contains('flv');
}

function isLinkToAudio(url) {
    url = url.toLowerCase();
    return url.contains('mp3') || url.contains('wav') || url.contains('ogg') || url.contains('flac') || url.contains('m4a');
}

function isLinkToGif(url) {
    url = url.toLowerCase();
    return url.contains('gif');
}

// Load data from db.json on startup
const dbFilePath = './db.json';
if (fs.existsSync(dbFilePath)) {
    try {
        const dbData = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'), jsonReviver);
        if (dbData.currentChannel) {
            currentChannel = dbData.currentChannel;
        }
        if (dbData.admins) {
            admins = dbData.admins;
        }
        if (dbData.blacklist) {
            blacklist = dbData.blacklist;
        }
        if (dbData.blacklistedFormats) {
            blacklistedFormats = dbData.blacklistedFormats;
        }
        if (dbData.blacklistedResponse) {
            blacklistedResponse = dbData.blacklistedResponse;
        }
    } catch (error) {
        console.error('Error reading db.json:', error);
    }
}

// Event: Bot is ready
client.on('ready', () => {
    console.log('Bot is ready!');
    client.change_status("online").then((response) => {
    });    
});

setInterval(() => {
    client.change_status("online").then((response) => {
    });
}, 550000);

function blacklistedMessageSent(message) {
    client.send(message.channel_id, { content: 'This message contains a blacklisted format.', reply: message.id });
}

// Message event for main functionality
client.on('message', (message) => {
    // Check if message is sent in the current channel
    if (message.channel_id !== currentChannel) {
        return;
    }
    // Check if message is sent by a blacklisted user
    if (blacklist.includes(BigInt(message.author.id))) {
        // Check if the message contains a blacklisted format
        const attachments = message.attachments;
        if (attachments.length > 0) {
            attachments.forEach(attachment => {
                const attachmentFormat = attachment.content_type;
                blacklistedFormats.forEach(format => {
                    if (attachmentFormat.startsWith(format)) {
                        if (!blacklistedFormats.includes('image/gif') && attachmentFormat.startsWith('image/gif')) {
                            return;
                        }
                        blacklistedMessageSent(message);
                        return;
                    }
                });
            });
        }
        if (message.embeds.length > 0) {
            message.embeds.forEach(embed => {
                const embedFormat = embed.type;
                blacklistedFormats.forEach(format => {
                    if (format === "image/gif" && embedFormat === "gifv") {

                    } else if (format === "video/" && embedFormat === "video") {

                    } else if (format === "image/" && embedFormat === "image") {

                    } else {
                        return;
                    }
                    blacklistedMessageSent(message);
                    return;
                });
            });
        }
        // Check if the message contains a link to a blacklisted format
        if (message.content.length > 0) {
            const messageContent = message.content.toLowerCase();
            blacklistedFormats.forEach(format => {
                if (format === "image/gif" && isLinkToGif(messageContent)) {
                    blacklistedMessageSent(message);
                    return;
                } else if (format === "video/" && isLinkToVideo(messageContent)) {
                    blacklistedMessageSent(message);
                    return;
                } else if (format === "image/" && isLinkToImage(messageContent)) {
                    blacklistedMessageSent(message);
                    return;
                } else if (format === "audio/" && isLinkToAudio(messageContent)) {
                    blacklistedMessageSent(message);
                    return;
                }
            });
        }
    }
});

function isAdmin(userId) {
    return admins.includes(BigInt(userId));
}

// Event: Message received for commands
client.on('message', (message) => {
    // DM commands
    message.content = message.content.toLowerCase();
    message.content = message.content.trim();
    if (message.channel_type === 1) {
        // Check if the message starts with /setchannel
        if (message.content.startsWith('/setchannel ')) {
            if (!isAdmin(message.author.id)) {
                client.send(message.channel_id, { content: 'You do not have permission to use this command.', reply: message.id });
                return;
            }
            const args = message.content.split(' ');
            if (args.length === 2) {
                const newChannelId = args[1];
                // Validate the channel ID (basic validation for numeric ID)
                if (!isNaN(newChannelId)) {
                    // Save the new channel ID to db.json
                    currentChannel = BigInt(newChannelId);
                    const dbData = {
                        currentChannel: newChannelId,
                        admins: admins,
                        blacklist: blacklist,
                        blacklistedFormats: blacklistedFormats,
                        blacklistedResponse: blacklistedResponse
                    };
                    try {
                        fs.writeFileSync(dbFilePath, JSON.stringify(dbData, jsonReplacer, 4));
                        client.send(message.channel_id, { content: `Channel ID set to ${newChannelId}`, reply: message.id });
                    } catch (error) {
                        console.error('Error writing to db.json:', error);
                        client.send(message.channel_id, { content: 'Error saving the channel ID.', reply: message.id });
                    }
                } else {
                    client.send(message.channel_id, { content: 'Invalid channel ID. Please provide a numeric ID.', reply: message.id });
                }
            } else {
                client.send(message.channel_id, { content: 'Usage: /setchannel <channel_id>', reply: message.id });
            }
        }
    }
    if (message.content.startsWith('/getchannel ')) {
        // Send the current channel ID back to the user
        client.send(message.channel_id, { content: `Current channel ID is ${currentChannel}`, reply: message.id });
    }
    if (message.content.startsWith('/addadmin ')) {
        if (!isAdmin(message.author.id)) {
            client.send(message.channel_id, { content: 'You do not have permission to use this command.', reply: message.id });
            return;
        }
        const args = message.content.split(' ');
        if (args.length === 2) {
            const newAdminId = args[1];
            // Validate the admin ID (basic validation for numeric ID)
            if (!isNaN(newAdminId)) {
                // Add the new admin ID to the admins array
                admins.push(BigInt(newAdminId));
                const dbData = {
                    currentChannel: currentChannel,
                    admins: admins,
                    blacklist: blacklist,
                    blacklistedFormats: blacklistedFormats,
                    blacklistedResponse: blacklistedResponse
                };
                try {
                    fs.writeFileSync(dbFilePath, JSON.stringify(dbData, jsonReplacer, 4));
                    client.send(message.channel_id, { content: `Admin ID added: ${newAdminId}`, reply: message.id });
                } catch (error) {
                    console.error('Error writing to db.json:', error);
                    client.send(message.channel_id, { content: 'Error adding the admin ID.', reply: message.id });
                }
            } else {
                client.send(message.channel_id, { content: 'Invalid admin ID. Please provide a numeric ID.', reply: message.id });
            }
        } else {
            client.send(message.channel_id, { content: 'Usage: /addadmin <admin_id>', reply: message.id });
        }
    }
    if (message.content.startsWith('/removeadmin ')) {
        if (!isAdmin(message.author.id)) {
            client.send(message.channel_id, { content: 'You do not have permission to use this command.', reply: message.id });
            return;
        }
        const args = message.content.split(' ');
        if (args.length === 2) {
            const newAdminId = args[1];
            // Validate the admin ID (basic validation for numeric ID)
            if (!isNaN(newAdminId)) {
                if (!admins.includes(BigInt(newAdminId))) {
                    client.send(message.channel_id, { content: 'This ID is not an admin.', reply: message.id });
                    return;
                }
                // Remove the admin ID from the admins array
                admins = admins.filter(admin => admin !== BigInt(newAdminId));
                const dbData = {
                    currentChannel: currentChannel,
                    admins: admins,
                    blacklist: blacklist,
                    blacklistedFormats: blacklistedFormats,
                    blacklistedResponse: blacklistedResponse
                };
                try {
                    fs.writeFileSync(dbFilePath, JSON.stringify(dbData, jsonReplacer, 4));
                    client.send(message.channel_id, { content: `Admin ID removed: ${newAdminId}`, reply: message.id });
                } catch (error) {
                    console.error('Error writing to db.json:', error);
                    client.send(message.channel_id, { content: 'Error removing the admin ID.', reply: message.id });
                }
            } else {
                client.send(message.channel_id, { content: 'Invalid admin ID. Please provide a numeric ID.', reply: message.id });
            }
        } else {
            client.send(message.channel_id, { content: 'Usage: /removeadmin <admin_id>', reply: message.id });
        }
    }
    if (message.content.startsWith('/getadmins ')) {
        // Send the current admin IDs back to the user
        const adminList = admins.map(admin => admin.toString()).join(', ');
        client.send(message.channel_id, { content: `Current admin IDs are: ${adminList}`, reply: message.id });
    }
    if (message.content.startsWith('/addblacklist ')) {
        if (!isAdmin(message.author.id)) {
            client.send(message.channel_id, { content: 'You do not have permission to use this command.', reply: message.id });
            return;
        }
        const args = message.content.split(' ');
        if (args.length === 2) {
            const newBlacklistId = args[1];
            // Validate the blacklist ID (basic validation for numeric ID)
            if (!isNaN(newBlacklistId)) {
                // Add the new blacklist ID to the blacklist array
                blacklist.push(BigInt(newBlacklistId));
                const dbData = {
                    currentChannel: currentChannel,
                    admins: admins,
                    blacklist: blacklist,
                    blacklistedFormats: blacklistedFormats,
                    blacklistedResponse: blacklistedResponse
                };
                try {
                    fs.writeFileSync(dbFilePath, JSON.stringify(dbData, jsonReplacer, 4));
                    client.send(message.channel_id, { content: `Blacklist ID added: ${newBlacklistId}`, reply: message.id });
                } catch (error) {
                    console.error('Error writing to db.json:', error);
                    client.send(message.channel_id, { content: 'Error adding the blacklist ID.', reply: message.id });
                }
            } else {
                client.send(message.channel_id, { content: 'Invalid blacklist ID. Please provide a numeric ID.', reply: message.id });
            }
        } else {
            client.send(message.channel_id, { content: 'Usage: /addblacklist <blacklist_id>', reply: message.id });
        }
    }
    if (message.content.startsWith('/removeblacklist')) {
        if (!isAdmin(message.author.id)) {
            client.send(message.channel_id, { content: 'You do not have permission to use this command.', reply: message.id });
            return;
        }
    }
    if (message.content.startsWith('/removeblacklist ')) {
        if (!isAdmin(message.author.id)) {
            client.send(message.channel_id, { content: 'You do not have permission to use this command.', reply: message.id });
            return;
        }
        const args = message.content.split(' ');
        if (args.length === 2) {
            const newBlacklistId = args[1];
            // Validate the blacklist ID (basic validation for numeric ID)
            if (!isNaN(newBlacklistId)) {
                if (!blacklist.includes(BigInt(newBlacklistId))) {
                    client.send(message.channel_id, { content: 'This ID is not a blacklist.', reply: message.id });
                    return;
                }
                // Remove the blacklist ID from the blacklist array
                blacklist = blacklist.filter(blacklist => blacklist !== BigInt(newBlacklistId));
                const dbData = {
                    currentChannel: currentChannel,
                    admins: admins,
                    blacklist: blacklist,
                    blacklistedFormats: blacklistedFormats,
                    blacklistedResponse: blacklistedResponse
                };
                try {
                    fs.writeFileSync(dbFilePath, JSON.stringify(dbData, jsonReplacer, 4));
                    client.send(message.channel_id, { content: `Blacklist ID removed: ${newBlacklistId}`, reply: message.id });
                } catch (error) {
                    console.error('Error writing to db.json:', error);
                    client.send(message.channel_id, { content: 'Error removing the blacklist ID.', reply: message.id });
                }
            } else {
                client.send(message.channel_id, { content: 'Invalid blacklist ID. Please provide a numeric ID.', reply: message.id });
            }
        } else {
            client.send(message.channel_id, { content: 'Usage: /removeblacklist <blacklist_id>', reply: message.id });
        }
    }
    if (message.content.startsWith('/getblacklist ')) {
        // Send the current blacklist IDs back to the user
        const blacklistList = blacklist.map(blacklist => blacklist.toString()).join(', ');
        client.send(message.channel_id, { content: `Current blacklist IDs are: ${blacklistList}`, reply: message.id });
    }
    if (message.content.startsWith('/addblacklistedformats ')) {
        if (!isAdmin(message.author.id)) {
            client.send(message.channel_id, { content: 'You do not have permission to use this command.', reply: message.id });
            return;
        }
        const args = message.content.split(' ');
        if (args.length === 2) {
            const newFormat = args[1];

            if (newFormat.startsWith('image')) {
                // Add the new format to the blacklistedFormats array
                blacklistedFormats.push('image/');
                const dbData = {
                    currentChannel: currentChannel,
                    admins: admins,
                    blacklist: blacklist,
                    blacklistedFormats: blacklistedFormats,
                    blacklistedResponse: blacklistedResponse
                };
                try {
                    fs.writeFileSync(dbFilePath, JSON.stringify(dbData, jsonReplacer, 4));
                    client.send(message.channel_id, { content: `Blacklisted format added: ${newFormat}`, reply: message.id });
                } catch (error) {
                    console.error('Error writing to db.json:', error);
                    client.send(message.channel_id, { content: 'Error adding the blacklisted format.', reply: message.id });
                }
            } else if (newFormat.startsWith('gif')) {
                // Add the new format to the blacklistedFormats array
                blacklistedFormats.push('image/gif');
                const dbData = {
                    currentChannel: currentChannel,
                    admins: admins,
                    blacklist: blacklist,
                    blacklistedFormats: blacklistedFormats,
                    blacklistedResponse: blacklistedResponse
                };
                try {
                    fs.writeFileSync(dbFilePath, JSON.stringify(dbData, jsonReplacer, 4));
                    client.send(message.channel_id, { content: `Blacklisted format added: ${newFormat}`, reply: message.id });
                } catch (error) {
                    console.error('Error writing to db.json:', error);
                    client.send(message.channel_id, { content: 'Error adding the blacklisted format.', reply: message.id });
                }
            } else if (newFormat.startsWith('video')) {
                // Add the new format to the blacklistedFormats array
                blacklistedFormats.push('video/');
                const dbData = {
                    currentChannel: currentChannel,
                    admins: admins,
                    blacklist: blacklist,
                    blacklistedFormats: blacklistedFormats,
                    blacklistedResponse: blacklistedResponse
                };
                try {
                    fs.writeFileSync(dbFilePath, JSON.stringify(dbData, jsonReplacer, 4));
                    client.send(message.channel_id, { content: `Blacklisted format added: ${newFormat}`, reply: message.id });
                } catch (error) {
                    console.error('Error writing to db.json:', error);
                    client.send(message.channel_id, { content: 'Error adding the blacklisted format.', reply: message.id });
                }
            } else if (newFormat.startsWith('audio')) {
                // Add the new format to the blacklistedFormats array
                blacklistedFormats.push('audio/');
                const dbData = {
                    currentChannel: currentChannel,
                    admins: admins,
                    blacklist: blacklist,
                    blacklistedFormats: blacklistedFormats,
                    blacklistedResponse: blacklistedResponse
                };
                try {
                    fs.writeFileSync(dbFilePath, JSON.stringify(dbData, jsonReplacer, 4));
                    client.send(message.channel_id, { content: `Blacklisted format added: ${newFormat}`, reply: message.id });
                } catch (error) {
                    console.error('Error writing to db.json:', error);
                    client.send(message.channel_id, { content: 'Error adding the blacklisted format.', reply: message.id });
                }
            } else {
                client.send(message.channel_id, { content: 'Invalid format. Please provide a valid format.', reply: message.id });
            }
        }
    }
    if (message.content.startsWith('/getblacklistedformats ')) {
        // Send the current blacklist IDs back to the user
        const blacklistedFormatsList = blacklistedFormats.join(', ');
        client.send(message.channel_id, { content: `Current blacklisted formats are: ${blacklistedFormatsList}`, reply: message.id });
    }
    if (message.content.startsWith('/removeblacklistedformat ')) {
        if (!isAdmin(message.author.id)) {
            client.send(message.channel_id, { content: 'You do not have permission to use this command.', reply: message.id });
            return;
        }
        const args = message.content.split(' ');
        if (args.length === 2) {
            const newFormat = args[1];

            if (newFormat.startsWith('image')) {
                // Check if the format is in the blacklistedFormats array
                if (!blacklistedFormats.includes('image/')) {
                    client.send(message.channel_id, { content: 'This format is not blacklisted.', reply: message.id });
                    return;
                }
                // Remove the format from the blacklistedFormats array
                blacklistedFormats = blacklistedFormats.filter(format => format !== 'image/');
                const dbData = {
                    currentChannel: currentChannel,
                    admins: admins,
                    blacklist: blacklist,
                    blacklistedFormats: blacklistedFormats,
                    blacklistedResponse: blacklistedResponse
                };
                try {
                    fs.writeFileSync(dbFilePath, JSON.stringify(dbData, jsonReplacer, 4));
                    client.send(message.channel_id, { content: `Blacklisted format removed: ${newFormat}`, reply: message.id });
                } catch (error) {
                    console.error('Error writing to db.json:', error);
                    client.send(message.channel_id, { content: 'Error removing the blacklisted format.', reply: message.id });
                }
            } else if (newFormat.startsWith('gif')) {
                // Check if the format is in the blacklistedFormats array
                if (!blacklistedFormats.includes('image/gif')) {
                    client.send(message.channel_id, { content: 'This format is not blacklisted.', reply: message.id });
                    return;
                }
                // Remove the format from the blacklistedFormats array
                blacklistedFormats = blacklistedFormats.filter(format => format !== 'image/gif');
                const dbData = {
                    currentChannel: currentChannel,
                    admins: admins,
                    blacklist: blacklist,
                    blacklistedFormats: blacklistedFormats,
                    blacklistedResponse: blacklistedResponse
                };
                try {
                    fs.writeFileSync(dbFilePath, JSON.stringify(dbData, jsonReplacer, 4));
                    client.send(message.channel_id, { content: `Blacklisted format removed: ${newFormat}`, reply: message.id });
                } catch (error) {
                    console.error('Error writing to db.json:', error);
                    client.send(message.channel_id, { content: 'Error removing the blacklisted format.', reply: message.id });
                }
            } else if (newFormat.startsWith('video')) { // Video format
                if (blacklistedFormats.includes('video/')) {
                    client.send(message.channel_id, { content: 'This format is already blacklisted.', reply: message.id });
                    return;
                }
                // Add the format to the blacklistedFormats array
                blacklistedFormats.push('video/');
                const dbData = {
                    currentChannel: currentChannel,
                    admins: admins,
                    blacklist: blacklist,
                    blacklistedFormats: blacklistedFormats,
                    blacklistedResponse: blacklistedResponse
                };
                try {
                    fs.writeFileSync(dbFilePath, JSON.stringify(dbData, jsonReplacer, 4));
                    client.send(message.channel_id, { content: `Blacklisted format added: ${newFormat}`, reply: message.id });
                } catch (error) {
                    console.error('Error writing to db.json:', error);
                    client.send(message.channel_id, { content: 'Error adding the blacklisted format.', reply: message.id });
                }
            } else if (newFormat.startsWith('audio')) { // Audio format
                if (blacklistedFormats.includes('audio/')) {
                    client.send(message.channel_id, { content: 'This format is already blacklisted.', reply: message.id });
                    return;
                }
                // Add the format to the blacklistedFormats array
                blacklistedFormats.push('audio/');
                const dbData = {
                    currentChannel: currentChannel,
                    admins: admins,
                    blacklist: blacklist,
                    blacklistedFormats: blacklistedFormats,
                    blacklistedResponse: blacklistedResponse
                };
                try {
                    fs.writeFileSync(dbFilePath, JSON.stringify(dbData, jsonReplacer, 4));
                    client.send(message.channel_id, { content: `Blacklisted format added: ${newFormat}`, reply: message.id });
                } catch (error) {
                    console.error('Error writing to db.json:', error);
                    client.send(message.channel_id, { content: 'Error adding the blacklisted format.', reply: message.id });
                }
            } else {
                client.send(message.channel_id, { content: 'Invalid format. Please provide a valid format.', reply: message.id });
            }
        } else {
            client.send(message.channel_id, { content: 'Usage: /removeblacklistedformat <format>', reply: message.id });
        }
    }
    if (message.content.startsWith('/blacklistedresponse ')) {
        if (!isAdmin(message.author.id)) {
            client.send(message.channel_id, { content: 'You do not have permission to use this command.', reply: message.id });
            return;
        }
        message.content = message.content.replace('/blacklistedresponse ', '');
        message.content = message.content.trim();
        blacklistedResponse = message.content;
        const dbData = {
            currentChannel: currentChannel,
            admins: admins,
            blacklist: blacklist,
            blacklistedFormats: blacklistedFormats,
            blacklistedResponse: blacklistedResponse
        };
        try {
            fs.writeFileSync(dbFilePath, JSON.stringify(dbData, jsonReplacer, 4));
            client.send(message.channel_id, { content: `Blacklisted response set to: ${blacklistedResponse}`, reply: message.id });
        } catch (error) {
            console.error('Error writing to db.json:', error);
            client.send(message.channel_id, { content: 'Error setting the blacklisted response.', reply: message.id });
        }
    }
    if (message.content.startsWith('/getblacklistedresponse ')) {
        // Send the current blacklisted response back to the user
        client.send(message.channel_id, { content: `Current blacklisted response is: ${blacklistedResponse}`, reply: message.id });
    }
    if (message.content.startsWith('/help')) {
        client.send(message.channel_id, { content: 'Commands: /friendme, /setchannel <channel_id>, /getchannel, /addadmin <admin_id>, /removeadmin <admin_id>, /getadmins, /addblacklist <blacklist_id>, /removeblacklist <blacklist_id>, /getblacklist, /addblacklistedformats <format>, /removeblacklistedformat <format>, /getblacklistedformats, /blacklistedresponse <response>, /getblacklistedresponse', reply: message.id });
    }
    if (message.content.startsWith('/friendme')) {
        client.send_friend_request(message.author.username, message.author.discriminator);
        client.send(message.channel_id, { content: 'Sent friend request.', reply: message.id });
    }
});

process.on('SIGINT', function() {
    client.change_status("invisible").then((response) => {
    });  
    process.exit();
});

// Log in the bot
client.login(process.env.TOKEN);