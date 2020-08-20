module.exports = (members) => {
    let usersNumberIdObject = {};

    counter = 0;
    for (const member of members){
        usersNumberIdObject[member] = counter;
        counter++;
    }

    return usersNumberIdObject
}