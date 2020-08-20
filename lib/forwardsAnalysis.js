const {
    roundTimestamp
} = require("./tools/roundTimestamp");
const Sentiment = require('sentiment');
const encodingShift = require("./tools/encodingShift");
const sen = new Sentiment()

module.exports = (groupChat, gcLength, chatInfoObj, bar, usersIDObj, messageRally, textDump, reactionMatrix) => {
    //Going forwards in time
    for (i = gcLength-1; i >= 0; i--){
        bar.update((50+(gcLength-i+1)*50/gcLength))
        
        messageRally.push({...usersIDObj, "time til next": ''});
        if(i < gcLength-1){    
            messageRally[messageRally.length-1][groupChat[i].sender_name]++;
            messageRally[messageRally.length-1]["time til next"] = (groupChat[i-1] != undefined ? (groupChat[i].sender_name != groupChat[i-1].sender_name ? groupChat[i-1].timestamp_ms - groupChat[i].timestamp_ms : "") : "")
        }

        timestamp = roundTimestamp((groupChat[i].timestamp_ms));
        if(groupChat[i] != undefined){
            if(chatInfoObj[timestamp][groupChat[i].sender_name+" Sends"] === 0){
                chatInfoObj[timestamp]["People Talking"]++;
            }
            
            //Make number of messages always 1 to remove consideration of people sending consecutive messages.
            let numberOfMessages = groupChat[i+1] == undefined || groupChat[i+1].sender_name == groupChat[i].sender_name ? 0 : 1
            
            chatInfoObj[timestamp][groupChat[i].sender_name+" Messages"]+=numberOfMessages;
            chatInfoObj[timestamp]["Total Messages"]+=numberOfMessages;

            chatInfoObj[timestamp][groupChat[i].sender_name+" Sends"]++;
            chatInfoObj[timestamp]["Total Sends"]++;

            let messageValue = false

            if(groupChat[i].content != undefined){
                strToBeAdded = encodingShift(groupChat[i].content)
                textDump[groupChat[i].sender_name] += strToBeAdded + "  ";
                textDump["total"] += strToBeAdded + "  ";

                chatInfoObj[timestamp][groupChat[i].sender_name+" Characters"]+=groupChat[i].content.replace(/\W/g, '').length;
                chatInfoObj[timestamp]["Total Characters"]+=groupChat[i].content.replace(/\W/g, '').length;

                chatInfoObj[timestamp][groupChat[i].sender_name+" Sentiment"]+=sen.analyze(groupChat[i].content).comparative;
                chatInfoObj[timestamp]["Total Sentiment"]+=sen.analyze(groupChat[i].content).comparative;
                
                const mentions = groupChat[i].content.match(/@[A-Za-z]/g)
                chatInfoObj[timestamp][groupChat[i].sender_name+" Mentions"]+=(mentions != null ? mentions.length : 0)
                chatInfoObj[timestamp]["Total Mentions"]+=(mentions != null ? mentions.length : 0)

                messageValue = true
            }
            
            if(groupChat[i].photos != undefined){
                chatInfoObj[timestamp][groupChat[i].sender_name+" Photos"]+=groupChat[i].photos.length;
                chatInfoObj[timestamp]["Total Photos"]+=groupChat[i].photos.length;
                messageValue = true
            }

            if(groupChat[i].audio_files != undefined){
                chatInfoObj[timestamp][groupChat[i].sender_name+" Audios"]+=groupChat[i].audio_files.length;
                chatInfoObj[timestamp]["Total Audios"]+=groupChat[i].audio_files.length;
                messageValue = true
            }

            if(groupChat[i].files != undefined){
                chatInfoObj[timestamp][groupChat[i].sender_name+" Files"]+=groupChat[i].files.length;
                chatInfoObj[timestamp]["Total Files"]+=groupChat[i].files.length;
                messageValue = true
            }
            
            if(groupChat[i].reactions != undefined){
                for( const {reaction, actor} of groupChat[i].reactions){
                    chatInfoObj[timestamp][actor+" Reactions"]++
                    chatInfoObj[timestamp]["Total Reactions"]++

                    reactionMatrix[actor][groupChat[i].sender_name+" "+encodingShift(reaction)]++
                }
            }

            if(!messageValue){
                //Removed message
                chatInfoObj[timestamp][groupChat[i].sender_name+" Removed Messages"]++;
                chatInfoObj[timestamp]["Total Removed Messages"]++;
            }
        
        }
    }
}