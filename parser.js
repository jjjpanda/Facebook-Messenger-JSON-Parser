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

textDump = {};
usersBlankObject = {};
for (const key of actors){
    textDump[key] = "";
    usersBlankObject[key+" numberOfMessages"] = 0;
}
textDump["total"] = "";
for (const key of actors){
    usersBlankObject[key+" numberOfCharacters"] = 0;
}


//Set up hour long blocks 
chatInfoObj = {};
timestamp = roundToHour(new Date(groupChat[gcLength-1].timestamp_ms));
counter = 0;
indexOfChatInfoObj = {};
while (timestamp <= roundToHour(new Date(groupChat[0].timestamp_ms))) {
    chatInfoObj[timestamp] = {...{'time':(timestamp.getMonth()+1)+"/"+timestamp.getDate()+"/"+timestamp.getFullYear(), 'hour':timestamp.getHours()+":00"}, 
                                ...usersBlankObject,
                                ...{"numberOfPeopleTalking":0, "peopleInChat":0, "numOfpeopleAdded": "", "numOfpeopleRemoved": "", "peopleAdded": "", "peopleRemoved": "" }};  
    indexOfChatInfoObj[timestamp] = counter;
    counter++; 
    timestamp.setHours(timestamp.getHours()+1);
}

//Going backwards in time
timestamp = roundToHour(new Date(groupChat[0].timestamp_ms));
chatInfoObj[timestamp]['peopleInChat'] = currentUsers;
for (i = 0; i < gcLength; i++){
    console.log(((i/ gcLength)*50).toFixed(2)+ "%")

    timestamp = roundToHour(new Date(groupChat[i].timestamp_ms));
    if(i != 0 && (timestamp != roundToHour(new Date(groupChat[i-1].timestamp_ms)))){
        for(j = 0; j < (roundToHour(new Date(groupChat[i-1].timestamp_ms))-roundToHour(new Date(groupChat[i].timestamp_ms)))/36e5; j++){
            timestamp = Object.keys(chatInfoObj)[indexOfChatInfoObj[roundToHour(new Date(groupChat[i].timestamp_ms)).toString()]+j]
            chatInfoObj[timestamp]['peopleInChat'] = chatInfoObj[roundToHour(new Date(groupChat[i-1].timestamp_ms))]['peopleInChat'];
        }
    }
    
    if(groupChat[i].type === "Subscribe"){
        for(user of groupChat[i].users){
            chatInfoObj[timestamp]['peopleAdded'] += user["name"]+";";
            chatInfoObj[timestamp]['numOfpeopleAdded']++;
            chatInfoObj[timestamp]['peopleInChat']--;
        }
    }
    else if(groupChat[i].type === "Unsubscribe"){
        for(user of groupChat[i].users){
            chatInfoObj[timestamp]['peopleRemoved'] += user["name"]+";";
            chatInfoObj[timestamp]['numOfpeopleRemoved']++;
            chatInfoObj[timestamp]['peopleInChat']++;
        }
    }
}

//Going forwards in time
for (i = gcLength-1; i >= 0; i--){
    console.log((50+(gcLength-i+1)*50/gcLength).toFixed(2)+ "%")

    timestamp = roundToHour(new Date(groupChat[i].timestamp_ms));
    if(groupChat[i].content != undefined){
        textDump[groupChat[i].sender_name] += groupChat[i].content.replace(/\W/g, '') + "  ";
        textDump["total"] += groupChat[i].content.replace(/\W/g, '') + "  ";
        if(chatInfoObj[timestamp][groupChat[i].sender_name+" numberOfMessages"] === 0){
            chatInfoObj[timestamp]["numberOfPeopleTalking"]++;
        }
        chatInfoObj[timestamp][groupChat[i].sender_name+" numberOfMessages"]++;
        chatInfoObj[timestamp][groupChat[i].sender_name+" numberOfCharacters"]+=groupChat[i].content.replace(/\W/g, '').length;
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
