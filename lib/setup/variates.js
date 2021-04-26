const encodingShift = require("../tools/encodingShift");

module.exports = (groupChat, gcLength) => {
    let members = new Set();
    let reactions = new Set();  
    const categories = [
        "Messages",
        "Sends",
        "Characters",
        "Sentiment",
        "Reactions",
        "Mentions",
        "Links",
        "Photos",
        "Videos",
        "VideoDuration",
        "Audios",
        "AudioDuration",
        "Files",
        "Removed Messages"
    ]
    
    for (i = gcLength-1; i >= 0; i--){
        members.add(groupChat[i].sender_name);
        if(groupChat[i].reactions != undefined){
            for(const {reaction, actor} of groupChat[i].reactions ){
                reactions.add(encodingShift(reaction))
                members.add(actor)
            }
        }
    }

    console.log("Reactions: ", reactions)
    console.log("Members: ", members)
    
    return {
        members,
        reactions,
        categories 
    }
}