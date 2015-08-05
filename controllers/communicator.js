var appRoot = require('app-root-path');
var config = require('config');
var q = require('q');
var SSH = require('ssh2shell');

var connectionOptions = config.get('connectionOptions');
var switchOptions = appRoot.require('/switches/' + config.get('switch') + '.json');

function executeCommands(commands) {
    var deferred = q.defer();

    var options = {
        server: connectionOptions,
        commands: commands
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

    switchPorts: function(ports, vlan) {
        var sequence = switchOptions.commands['switch-ports'];
        var commands = [];

        var commands = commands.concat(sequence.before);

        ports.forEach(function(port) {
            commands = commands.concat(sequence.do.map(function(command) {
                return command.replace('{port}', port).replace('{primary-vlan}', switchOptions.primaryVlan).replace('{sub-vlan}', vlan);
            }));
        });

        commands = commands.concat(sequence.after);
        
        return executeCommands(commands);
    },

    setupPort: function(port, vlan) {
        return executeCommands(switchOptions.commands['setup-port'].map(function(command) {
            return command.replace('{port}', port).replace('{primary-vlan}', switchOptions.primaryVlan).replace('{sub-vlan}', vlan);
        }));
    },

    saveConfig: function() {
        return executeCommands(switchOptions.commands['save-config']);
    },

    cleanPort: function(port) {
        return executeCommands(switchOptions.commands['clean-port'].map(function(command) {
            return command.replace('{port}', port)
        }));
    },

    enablePort: function(port) {
        return executeCommands(switchOptions.commands['enable-port'].map(function(command) {
            return command.replace('{port}', port)
        }));
    },

    disablePort: function(port) {
        return executeCommands(switchOptions.commands['disable-port'].map(function(command) {
            return command.replace('{port}', port)
        }));
    }

};