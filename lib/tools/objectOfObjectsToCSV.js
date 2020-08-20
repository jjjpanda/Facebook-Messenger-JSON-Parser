module.exports = (obj) => {
    let str = ","
    columns = new Set()
    for( const columnName of Object.keys(obj[Object.keys(obj)[0]])){
        str += columnName+","
        columns.add(columnName)
    }

    str+="\r\n"
    
    for(const rowName of Object.keys(obj)){
        str += rowName+","
        for( const columnName of columns){
            str+= obj[rowName][columnName]+','
        }
        str+="\r\n"
    }
    return str
}