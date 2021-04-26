const fs = require('fs');
const path = require('path');

const mergeFiles = require("./lib/setup/mergeFiles.js")
const pullMerge = require('./lib/setup/pullMerge.js')

const setUpTextDump = require('./lib/setup/textDump.js');
const setUpUserID = require('./lib/setup/userID.js');
const setUpReactionMatrix = require('./lib/setup/reactionMatrix.js');
const setUpChatInfoObj = require('./lib/setup/chatInfoObj.js');
const variates = require('./lib/setup/variates.js');

const backwardsAnalysis = require('./lib/backwardsAnalysis.js');
const forwardsAnalysis = require('./lib/forwardsAnalysis.js');
const createTextFiles = require('./lib/postAnalysis/createTextFiles.js');
const createReactions = require('./lib/postAnalysis/createReactions.js');
const createInfoCSV = require('./lib/postAnalysis/createInfoCSV.js');
const createRallyCSV = require('./lib/postAnalysis/createRallyCSV.js');

const dirPath = path.resolve(__dirname, process.argv[2] || "./")
console.log(`📁 Using ${dirPath} as the directory.\n`)

const minutesInterval = parseInt(process.argv[3]) || 60
console.log(`⌚ Using ${minutesInterval} minutes as the time interval.\n`)

const {
    currentUsers, 
    groupChat,
    gcLength
} = pullMerge(mergeFiles(dirPath))

const {
    members,
    reactions,
    categories 
} = variates(groupChat, gcLength)

let textDump = setUpTextDump(members)
let usersNumberIdObject = setUpUserID(members)
let reactionMatrix = setUpReactionMatrix(members, reactions)

let messageRally = [];

let {
    chatInfoObj,
    indexOfChatInfoObj
} = setUpChatInfoObj(groupChat, gcLength, members, categories)

backwardsAnalysis(groupChat, gcLength, chatInfoObj, currentUsers, indexOfChatInfoObj)
forwardsAnalysis(groupChat, gcLength, chatInfoObj, usersNumberIdObject, messageRally, textDump, reactionMatrix, (t, c, m, r) => {
    createTextFiles(t, dirPath)
    createInfoCSV(c, dirPath)
    createRallyCSV(m, dirPath)
    createReactions(r, dirPath)
})

