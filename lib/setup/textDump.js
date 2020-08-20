module.exports = (members) => {
    let textDump = {};
    for (const member of members){
        textDump[member] = "";
    }
    textDump['total'] = ""

    return textDump
}