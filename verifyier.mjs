export class MessageVerifier {
    blacklist;
    blacklistedFormats;
    constructor(blacklist, blacklistedFormats) {
        this.blacklist = blacklist;
        this.blacklistedFormats = blacklistedFormats;
    }

    isLinkToImage(url) {
        if (!url.includes('https://') && !url.includes('http://')) {
            return false;
        }
        url = url.toLowerCase();
        return url.includes('.jpg') || url.includes('png') || url.includes('gif') || url.includes('webp') || url.includes('bmp') || url.includes('tiff') || url.includes('svg');
    }
    
    isLinkToVideo(url) {
        if (!url.includes('https://') && !url.includes('http://')) {
            return false;
        }
        url = url.toLowerCase();
        return url.includes('.mp4') || url.includes('webm') || url.includes('mov') || url.includes('avi') || url.includes('wmv') || url.includes('mkv') || url.includes('flv');
    }
    
    isLinkToAudio(url) {
        if (!url.includes('https://') && !url.includes('http://')) {
            return false;
        }
        url = url.toLowerCase();
        return url.includes('.mp3') || url.includes('wav') || url.includes('ogg') || url.includes('flac') || url.includes('m4a');
    }
    
    isLinkToGif(url) {
        if (!url.includes('https://') && !url.includes('http://')) {
            return false;
        }
        url = url.toLowerCase();
        return url.includes('.gif') || url.includes('tenor.com');
    }

    verifyMessage(message) {
        let ret = false;
        // Check if message is sent by a blacklisted user
        if (this.blacklist.includes(BigInt(message.author.id))) {
            // Check if the message includes a this.blacklisted format
            const attachments = message.attachments;
            if (attachments.length > 0) {
                attachments.forEach(attachment => {
                    const attachmentFormat = attachment.content_type;
                    this.blacklistedFormats.forEach(format => {
                        if (attachmentFormat.startsWith(format)) {
                            if (!this.blacklistedFormats.includes('image/gif') && attachmentFormat.startsWith('image/gif')) {
                                
                            }
                            ret = true;
                            
                        }
                    });
                });
            }
            if (message.embeds.length > 0) {
                
                message.embeds.forEach(embed => {
                    const embedFormat = embed.type;
                    this.blacklistedFormats.forEach(format => {
                        if (format === "image/gif" && embedFormat === "gifv") {
                            ret = true;
                        } else if (format === "video/" && embedFormat === "video") {
                            ret = true;
                        } else if (format === "image/" && embedFormat === "image") {
                            ret = true;
                        }

                    });
                });
            }
            // Check if the message includes a link to a this.blacklisted format
            if (message.content.length > 0) {
                const messageContent = message.content.toLowerCase();
                this.blacklistedFormats.forEach(format => {
                    if (format === "image/gif" && this.isLinkToGif(messageContent)) {
                        ret = true;
                        
                    } else if (format === "video/" && this.isLinkToVideo(messageContent)) {
                        ret = true;
                        
                    } else if (format === "image/" && this.isLinkToImage(messageContent)) {
                        ret = true;
                        
                    } else if (format === "audio/" && this.isLinkToAudio(messageContent)) {
                        ret = true;
                        
                    }
                });
            }
            return ret; // Return true if any condition matched
        }
        return false; // If no conditions matched, return false
    }
}