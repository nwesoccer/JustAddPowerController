var appRoot = require('app-root-path');
var config = require('config');
var q = require('q');
var telnet = require('telnet-client');

var connectionOptions = config.get('connectionOptions');
var switchOptions = appRoot.require('/switches/' + config.get('switch') + '.json');

var ensureConnection = (function() {
    var connection = null;

    return function() {
        var deferred = q.defer();

        if (connection == null) {
            connection = new telnet();

            connection.on('ready', function() {
                deferred.resolve(connection);
            });

            connection.on('timeout', function() {
                connection.end();
            });

            connection.on('end', function() {
                connection = null;
            });

            connection.connect(connectionOptions);
        } else {
            deferred.resolve(connection);
        }

        return deferred.promise;
    };
})();

function executeCommandSequence(sequence, fieldMerger) {
    fieldMerger = fieldMerger || function() { }

    return ensureConnection()
            .then(function(connection) {
                var result = q();

                switchOptions.commands[sequence].forEach(function(command) {
                    result = result.then(function() {
                        return executeCommand(connection, fieldMerger(command));
                    });
                });

                return result;
            });
}

function executeCommand(connection, command) {
    var deferred = q.defer();

    connection.exec(command, connectionOptions, function(result) {
        deferred.resolve(result);
    });

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
    }

};