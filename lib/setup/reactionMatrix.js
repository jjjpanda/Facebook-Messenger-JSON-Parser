module.exports = (members, reactions) => {
    //Reactor -> Reactee Matrix
    let reactionMatrix = {}

    for (const member of members){
        for( const reaction of reactions){
            reactionMatrix[member+" "+reaction] = {}
            for( const reactee of members ){
                reactionMatrix[member+" "+reaction][reactee] = 0
            }
        }
    }

    return reactionMatrix
}
