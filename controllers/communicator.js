var appRoot = require('app-root-path');
var config = require('config');
var q = require('q');
var SSH = require('ssh2').Client;

var connectionOptions = config.get('connectionOptions');
var switchOptions = appRoot.require('/switches/' + config.get('switch') + '.json');

function executeCommandSequence(sequence, fieldMerger) {
    fieldMerger = fieldMerger || function(command) { return command; }

    var deferred = q.defer();

    var ssh = new SSH();

    ssh.on('ready', function() {
        console.log('ready');

        var commandFunctions = [];

        switchOptions.commands[sequence].forEach(function(command) {
            commandFunctions.push(function() {
                var deferred = q.defer();

                ssh.exec(fieldMerger(command), function(error, stream) {
                    if (error) {
                        console.log('rejected');
                        deferred.reject(error);
                        return;
                    } else {
                        console.log('resolved');
                        deferred.resolve();
                    }

                    stream.on('data', function(data) {
                        console.log('DATA: ' + data);
                    }).stderr.on('data', function(data) {
                        console.log('ERROR: ' + data);
                    });
                });

                return deferred.promise;
            });
        });

        commandFunctions.reduce(q.when, q())
            .then(function() {
                console.log('resolved');
                deferred.resolve();
            })
            .catch(function(error) {
                console.log('rejected:' + error);
                deferred.reject(error);
            })
            .finally(function() {
                console.log('finally');
                ssh.end();
            });

    }).connect(connectionOptions);

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