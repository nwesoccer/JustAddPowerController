var appRoot = require('app-root-path');
var config = require('config');
var q = require('q');
var SSH = require('ssh2shell');

var connectionOptions = config.get('connectionOptions');
var switchOptions = appRoot.require('/switches/' + config.get('switch') + '.json');

function executeCommandSequence(sequence, fieldMerger) {
    fieldMerger = fieldMerger || function(command) { return command; }

    var deferred = q.defer();

    var options = {
        server: connectionOptions,
        commands: switchOptions.commands[sequence].map(fieldMerger)
    };

    var ssh = new SSH(options);

    ssh.standardPromt = new RegExp('#$', 'i');

    ssh.on('error', function onError(error, type, close, callback) {
        deferred.reject(error);
    });

    ssh.on('end', function() {
        deferred.resolve();
    });

    ssh.connect();

    return deferred.promise;
}

module.exports = {

    switchPort: function(port, vlan) {
        return executeCommandSequence('switch-port', function(command) {
            return command.replace('{port}', port).replace('{vlan}', vlan);
        });
    },

    setupPort: function(port, vlan) {
        return executeCommandSequence('setup-port', function(command) {
            return command.replace('{port}', port).replace('{vlan}', vlan);
        });
    },

    saveConfig: function() {
        return executeCommandSequence('save-config');
    },

    cleanPort: function(port) {
        return executeCommandSequence('clean-port', function(command) {
            return command.replace('{port}', port);
        });
    },

    testSSH: function() {
        return executeCommandSequence('test-ssh');
    }

};