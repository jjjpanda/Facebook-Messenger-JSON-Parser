module.exports = (str) => {
    return new Buffer(str.toString('latin1'), 'latin1').toString('utf8')
}