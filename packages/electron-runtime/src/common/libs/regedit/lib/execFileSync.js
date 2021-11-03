
var childProcess = require('child_process')

module.exports = function(options) {
	options = options || {}

	return function execFileSync() {

		childProcess.execFileSync.apply(childProcess, arguments)
	}
}
