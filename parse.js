const fs = require('fs');
const path = require('path');
const cliProgress = require('cli-progress');

const mergeFiles = require("./lib/setup/mergeFiles.js")
const pullMerge = require('./lib/setup/pullMerge.js')

const setUpTextDump = require('./lib/setup/textDump.js');
const setUpUserID = require('./lib/setup/userID.js');
const setUpReactionMatrix = require('./lib/setup/reactionMatrix.js');
const setUpChatInfoObj = require('./lib/setup/chatInfoObj.js');
const variates = require('./lib/setup/variates.js');
const { 
    setUpInterval 
} = require('./lib/tools/roundTimestamp.js');

const backwardsAnalysis = require('./lib/backwardsAnalysis.js');
const forwardsAnalysis = require('./lib/forwardsAnalysis.js');
const createTextFiles = require('./lib/postAnalysis/createTextFiles.js');
const createReactions = require('./lib/postAnalysis/createReactions.js');
const createInfoCSV = require('./lib/postAnalysis/createInfoCSV.js');
const createRallyCSV = require('./lib/postAnalysis/createRallyCSV.js');

const dirPath = path.resolve(__dirname, process.argv[2] || "./")
const minutesInterval = parseInt(process.argv[3]) || 60

setUpInterval(minutesInterval)

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
} = setUpChatInfoObj(groupChat, gcLength, members, categories, minutesInterval)

const bar = new cliProgress.SingleBar({
    format: 'Processing [{bar}] {percentage}% | Time Elapsed: {duration}s 😎'
}, cliProgress.Presets.shades_classic)
bar.start(100, 0)

backwardsAnalysis(groupChat, gcLength, chatInfoObj, bar, currentUsers, indexOfChatInfoObj)
forwardsAnalysis(groupChat, gcLength, chatInfoObj, bar, usersNumberIdObject, messageRally, textDump, reactionMatrix)

bar.stop()

createTextFiles(textDump, dirPath)
createReactions(reactionMatrix, dirPath)
createInfoCSV(chatInfoObj, dirPath)
createRallyCSV(messageRally, dirPath)