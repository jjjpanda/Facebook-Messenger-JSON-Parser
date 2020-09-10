module.exports = (members) => {
    let textDump = {};
    for (const member of members){
        textDump[member] = "";
    }
    textDump['Total'] = ""
    textDump['Formatted'] = ""

    return textDump
}