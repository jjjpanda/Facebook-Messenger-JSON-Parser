const cliProgress = require('cli-progress');
const {
    roundTimestamp
} = require("./tools/roundTimestamp");
const encodingShift = require("./tools/encodingShift");
const Sentiment = require('sentiment');
const ffprobe = require('ffprobe')
const ffprobeStatic = require('ffprobe-static');
const path = require('path')
const sen = new Sentiment()

const callbackClosure = (i, t, callback) => {
    return (err, info) => {
        return callback(err, info, i, t)
    }
}

module.exports = (groupChat, gcLength, chatInfoObj, usersIDObj, messageRally, textDump, reactionMatrix, callback) => {
    const bar = new cliProgress.SingleBar({
        format: 'Forwards Analysis [{bar}] {percentage}% | Time Elapsed: {duration}s 😎'
    }, cliProgress.Presets.shades_classic)
    bar.start(100, 0)

    var durationsCompleted = 0
    var durationsTotal = 0
    
    //Going forwards in time
    for (i = gcLength-1; i >= 0; i--){
        bar.update(((gcLength-i+1)*100/gcLength))
        
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

            if(numberOfMessages == 1){
                if (chatInfoObj[timestamp]["Average Response Time"] == ""){
                    chatInfoObj[timestamp]["Average Response Time"] = 0
                }
                chatInfoObj[timestamp]["Average Response Time"] *= chatInfoObj[timestamp]["Total Messages"]
                chatInfoObj[timestamp]["Average Response Time"] += groupChat[i].timestamp_ms - groupChat[i+1].timestamp_ms
                
            }
            
            chatInfoObj[timestamp][groupChat[i].sender_name+" Messages"]+=numberOfMessages;
            chatInfoObj[timestamp]["Total Messages"]+=numberOfMessages;

            if(numberOfMessages == 1){
                chatInfoObj[timestamp]["Average Response Time"] /= chatInfoObj[timestamp]["Total Messages"]
            }

            chatInfoObj[timestamp][groupChat[i].sender_name+" Sends"]++;
            chatInfoObj[timestamp]["Total Sends"]++;

            let messageValue = false

            if(groupChat[i].content != undefined){
                strToBeAdded = encodingShift(groupChat[i].content)
                textDump[groupChat[i].sender_name] += strToBeAdded + "  ";
                textDump["Total"] += strToBeAdded + "  ";
                textDump["Formatted"] += `${groupChat[i].sender_name} >\t-> ${strToBeAdded}\n`

                chatInfoObj[timestamp][groupChat[i].sender_name+" Characters"]+=groupChat[i].content.replace(/\W/g, '').length;
                chatInfoObj[timestamp]["Total Characters"]+=groupChat[i].content.replace(/\W/g, '').length;

                chatInfoObj[timestamp][groupChat[i].sender_name+" Sentiment"]+=sen.analyze(groupChat[i].content).comparative;
                chatInfoObj[timestamp]["Total Sentiment"]+=sen.analyze(groupChat[i].content).comparative;
                
                const mentions = groupChat[i].content.match(/@[A-Za-z]/g)
                chatInfoObj[timestamp][groupChat[i].sender_name+" Mentions"]+=(mentions != null ? mentions.length : 0)
                chatInfoObj[timestamp]["Total Mentions"]+=(mentions != null ? mentions.length : 0)

                if(groupChat[i].type == "Share" || groupChat[i].content.includes('https://')){
                    chatInfoObj[timestamp][groupChat[i].sender_name+" Links"]++;
                    chatInfoObj[timestamp]["Total Links"]++;
                }

                messageValue = true
            }

            if(groupChat[i].photos != undefined){
                chatInfoObj[timestamp][groupChat[i].sender_name+" Photos"]+=groupChat[i].photos.length;
                chatInfoObj[timestamp]["Total Photos"]+=groupChat[i].photos.length;
                messageValue = true
            }

            if(groupChat[i].videos != undefined){
                chatInfoObj[timestamp][groupChat[i].sender_name+" Videos"]+=groupChat[i].videos.length;
                chatInfoObj[timestamp]["Total Videos"]+=groupChat[i].videos.length;
                for(video of groupChat[i].videos){
                    durationsTotal++
                    ffprobe( path.resolve(__dirname, process.argv[2] || "./", `videos/${video.uri.split('videos/')[1]}`).replace(/\\/g, '/'), {path: ffprobeStatic.path}, callbackClosure(i, timestamp, (err, info, i, timestamp) => {
                        let d = 0
                        if (!err) {
                            d = parseFloat(info.streams[0].duration)
                        }
                        chatInfoObj[timestamp][groupChat[i].sender_name+" VideoDuration"] += d
                        durationsCompleted++

                        if(durationsCompleted == durationsTotal){
                            callback(textDump, chatInfoObj, messageRally, reactionMatrix)
                        }
                    }))
                }
                messageValue = true
            }

            if(groupChat[i].audio_files != undefined){
                chatInfoObj[timestamp][groupChat[i].sender_name+" Audios"]+=groupChat[i].audio_files.length;
                chatInfoObj[timestamp]["Total Audios"]+=groupChat[i].audio_files.length;
                for(audioFile of groupChat[i].audio_files){
                    //console.log(durationsCompleted, durationsTotal, path.resolve(__dirname, process.argv[2] || "./", `audio/${audioFile.uri.split('audio/')[1]}`).replace(/\\/g, '/'))
                    durationsTotal++
                    ffprobe( path.resolve(__dirname, process.argv[2] || "./", `audio/${audioFile.uri.split('audio/')[1]}`).replace(/\\/g, '/'), {path: ffprobeStatic.path}, callbackClosure(i, timestamp, (err, info, i, timestamp) => {
                        let d = 0
                        if (!err) {
                            d = parseFloat(info.streams[0].duration)
                        }
                        //console.log(timestamp, i, groupChat[i].sender_name, d)
                        chatInfoObj[timestamp][groupChat[i].sender_name+" AudioDuration"] += d
                        durationsCompleted++
                        
                        if(durationsCompleted == durationsTotal){
                            callback(textDump, chatInfoObj, messageRally, reactionMatrix)
                        }
                    }))
                }
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

                    reactionMatrix[actor][groupChat[i].sender_name+" "+reaction]++
                }
            }

            if(!messageValue){
                //Removed message
                chatInfoObj[timestamp][groupChat[i].sender_name+" Removed Messages"]++;
                chatInfoObj[timestamp]["Total Removed Messages"]++;
            }
        
        }
    }

    bar.stop()
    //check ffprobe callbacks
}