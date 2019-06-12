var fs = require('fs');

function arrayToCSV(objArray) {
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = `${Object.keys(array[0]).map(value => `"${value}"`).join(",")}` + '\r\n';
    return array.reduce((str, next) => {
        str += `${Object.values(next).map(value => `"${value}"`).join(",")}` + '\r\n';
        return str;
       }, str);
}

function roundToHour(timestamp){
    return new Date(timestamp.getYear()+1900, timestamp.getMonth(), timestamp.getDate(), timestamp.getHours(), 0, 0, 0);    
}

var groupChat = JSON.parse(fs.readFileSync('message.json','utf8'));
currentUsers = groupChat.participants.length;
groupChat = groupChat.messages;
gcLength = groupChat.length;

actors = new Set();
for (i = gcLength-1; i >= 0; i--){
    actors.add(groupChat[i].sender_name);
}
messageRally = [];
textDump = {};
usersBlankObject = {};
usersMessageFreqBlankObject = {};
counter = 0;
for (const key of actors){
    textDump[key] = "";
    usersMessageFreqBlankObject[key+" Number Of Messages"] = 0;
    usersBlankObject[key] = counter;
    counter++;
}
usersMessageFreqBlankObject["Total Number Of Messages"] = 0;
textDump["total"] = "";
for (const key of actors){
    usersMessageFreqBlankObject[key+" Number Of Characters"] = 0;
}
usersMessageFreqBlankObject["Total Number Of Characters"] = 0;


//Set up hour long blocks 
chatInfoObj = {};
timestamp = roundToHour(new Date(groupChat[gcLength-1].timestamp_ms));
counter = 0;
indexOfChatInfoObj = {};
while (timestamp <= roundToHour(new Date(groupChat[0].timestamp_ms))) {
    chatInfoObj[timestamp] = {...{'time':(timestamp.getMonth()+1)+"/"+timestamp.getDate()+"/"+timestamp.getFullYear(), 'hour':timestamp.getHours()+":00"}, 
                                ...usersMessageFreqBlankObject,
                                ...{"People Talking":0, "People In Chat":0, "Additions": "", "Removals": "", "People Added": "", "People Removed": "" }};  
    indexOfChatInfoObj[timestamp] = counter;
    counter++; 
    timestamp.setHours(timestamp.getHours()+1);
}

//Going backwards in time
timestamp = roundToHour(new Date(groupChat[0].timestamp_ms));
chatInfoObj[timestamp]['People In Chat'] = currentUsers;
for (i = 0; i < gcLength; i++){
    console.log(((i/ gcLength)*50).toFixed(2)+ "%")

    timestamp = roundToHour(new Date(groupChat[i].timestamp_ms));
    if(i != 0 && (timestamp != roundToHour(new Date(groupChat[i-1].timestamp_ms)))){
        for(j = 0; j < (roundToHour(new Date(groupChat[i-1].timestamp_ms))-roundToHour(new Date(groupChat[i].timestamp_ms)))/36e5; j++){
            timestamp = Object.keys(chatInfoObj)[indexOfChatInfoObj[roundToHour(new Date(groupChat[i].timestamp_ms)).toString()]+j]
            chatInfoObj[timestamp]['People In Chat'] = chatInfoObj[roundToHour(new Date(groupChat[i-1].timestamp_ms))]['People In Chat'];
        }
    }
    
    if(groupChat[i].type === "Subscribe"){
        for(user of groupChat[i].users){
            chatInfoObj[timestamp]['People Added'] += user["name"]+";";
            chatInfoObj[timestamp]['Additions']++;
            chatInfoObj[timestamp]['People In Chat']--;
        }
    }
    else if(groupChat[i].type === "Unsubscribe"){
        for(user of groupChat[i].users){
            chatInfoObj[timestamp]['People Removed'] += user["name"]+";";
            chatInfoObj[timestamp]['Removals']++;
            chatInfoObj[timestamp]['People In Chat']++;
        }
    }
}

//Going forwards in time
for (i = gcLength-1; i >= 0; i--){
    console.log((50+(gcLength-i+1)*50/gcLength).toFixed(2)+ "%")

    messageRally.push({...usersBlankObject});
    if(i < gcLength-1 && messageRally[messageRally.length-2][groupChat[i].sender_name] == messageRally[messageRally.length-1][groupChat[i].sender_name])
        messageRally[messageRally.length-1][groupChat[i].sender_name]++;

    timestamp = roundToHour(new Date(groupChat[i].timestamp_ms));
    if(groupChat[i].content != undefined){
        strToBeAdded = new Buffer(groupChat[i].content.toString('latin1'), 'latin1').toString('utf8')
        textDump[groupChat[i].sender_name] += strToBeAdded + "  ";
        textDump["total"] += strToBeAdded + "  ";
        if(chatInfoObj[timestamp][groupChat[i].sender_name+" Number Of Messages"] === 0){
            chatInfoObj[timestamp]["People Talking"]++;
        }
        chatInfoObj[timestamp][groupChat[i].sender_name+" Number Of Messages"]++;
        chatInfoObj[timestamp]["Total Number Of Messages"]++;
        chatInfoObj[timestamp][groupChat[i].sender_name+" Number Of Characters"]+=groupChat[i].content.replace(/\W/g, '').length;
        chatInfoObj[timestamp]["Total Number Of Characters"]+=groupChat[i].content.replace(/\W/g, '').length;
    }
}

//create text files containing all message contents per user
dir = "./cloud"
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}
for(const key of Object.keys(textDump)){
    fs.writeFile("./cloud/"+key+".txt", textDump[key], function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The " +key+ " text file was saved!");
    }); 
}

fs.writeFile("info.csv", arrayToCSV(Object.values(chatInfoObj)), function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The analysis file was saved!");
}); 

fs.writeFile("rally.csv", arrayToCSV(messageRally), function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The rally file was saved!");
}); 

