module.exports = (members, categories) => {
    //Create object such that { member1_category1: 0, member2_category1: 0 ... memberN_categoryN: 0}
    let usersMessageFreqBlankObject = {};
    
    for(const category of categories){
        for (const member of members){
            usersMessageFreqBlankObject[`${member} ${category}`] = 0;
        }
    }
    for(const category of categories){
        usersMessageFreqBlankObject[`Total ${category}`] = 0;
    }

    return usersMessageFreqBlankObject
}