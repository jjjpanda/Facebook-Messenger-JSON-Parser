module.exports = (members, reactions) => {
    //Reactor -> Reactee Matrix
    let reactionMatrix = {}

    for (const member of members){
        reactionMatrix[member] = {}
        for( const reaction of reactions){
            for( const reactee of members ){
                reactionMatrix[member][reactee+" "+reaction] = 0
            }
        }
    }

    return reactionMatrix
}
