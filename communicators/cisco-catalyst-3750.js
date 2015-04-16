var telnet = require('telnet-client');
var config = require('config');
var q = require('q');

var connectionOptions = {
    host: config.get('host'),
    port: config.get('port'),
    shellPrompt: '/ # ',
    timeout: 1500
};

var ensureConnection = (function() {
    var connection = null;

    return function(options) {
        var deferred = q.defer();

        if (connection == null) {
            connection = new telnet();

            connection.on('ready', function() {
                deferred.resolve(q.nfbind(connection.exec));
            });

            connection.on('timeout', connection.end);

            connection.on('close', function() {
                connectionStatus = 'closed';
                connection = null;
            });

            connection.connect(options);
        } else {
            deferred.resolve(q.nfbind(connection.exec));
        }

        return deferred.promise;
    };
}());

module.exports = {

    setPortVlan: function(port, vlan) {
        return ensureConnection(connectionOptions)
            .then(function(execute) {
                execute('')
                    .then(function(response) {
                            // do something
                        });
            });
    },

    getPortVlan: function(port) {
        return ensureConnection(connectionOptions)
            .then(function(execute) {
                execute('')
                    .then(function(response) {
                            return response.vlan;
                        });
            });
    }

};