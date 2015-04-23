var appRoot     = require('app-root-path');
var config      = require('config');
var util = require('util');
var q = require('q');

var communicator = appRoot.require('/controllers/communicator.js');
var db = appRoot.require('/database/database.js');

function handleErrors(res, data) {
    var status = (data && data.status) || 500;
    var errors = (data && ((data.errors && Array.isArray(data.errors) && data.errors) || (data.error && [data.error]))) || [data] || ['Unknown Error'];

    res.status(status).json({ errors: errors });
}

var receivers = {

    getAll: function(req, res) {
        db.findReceivers({})
            .then(function(receivers) {
                if (!receivers || receivers.length === 0) {
                    res.json([]);
                } else {
                    res.json(receivers);
                }
            })
            .catch(function(error) {
                res.status(500).json({ error: error });
            });
    },

    getOne: function(req, res) {
        db.findReceiver({ _id: parseInt(req.params.id) })
            .then(function(receiver) {
                if (!receiver) {
                    res.status(404).send({ error: 'Receiver not found.' });
                } else {
                    res.json(receiver);
                }
            })
            .catch(function(error) {
                res.status(500).json({ error: error });
            });
    },

    getForTransmitter: function(req, res) {
        db.findReceivers({ transmitterId: parseInt(req.params.id) })
            .then(function(receivers) {
                if (!receivers || receivers.length === 0) {
                    res.json([]);
                } else {
                    res.json(receivers);
                }
            })
            .catch(function(error) {
                res.status(500).json({ error: error });
            });
    },

    create: function(req, res) {
        var minPort = config.get('receivers.minPort');
        var maxPort = config.get('receivers.maxPort');

        q()
        .then(validateRequest)
        .then(ensurePortNotTaken)
        .then(addToSwitch)
        .then(addToDatabase)
        .then(function(receiver) { res.json(receiver); })
        .catch(function(data) { handleErrors(res, data); });

        function validateRequest() {
            req.checkBody('_id', '_id must be provided.').isInt();
            req.checkBody('port', util.format('Port must be an integer between %d and %d.', minPort, maxPort)).isInt().gte(minPort).lte(maxPort);
            req.checkBody('transmitterId', 'TransmitterId must be provided.').notEmpty();
            req.checkBody('name', 'Name is required.').notEmpty();

            var errors = req.validationErrors(true);
            if (errors) throw { status: 400, errors: errors };
        }

        function ensurePortNotTaken() {
            return db.findReceiver({ port: req.body.port })
                .then(function(receiver) { if (receiver) throw { status: 400, error: 'Port taken.' }; })
                .then(function() { return db.findTransmitter({ port: req.body.port }); })
                .then(function(transmitter) { if (transmitter) throw { status: 400, error: 'Port taken.' }; })
                .then(function() { /* Ensure not taken by something else on the switch */ });
        }

        function addToSwitch() {
            return db.findTransmitter({ _id: req.body.transmitterId })
                .then(function(transmitter) {
                    if (!transmitter) throw { status: 404, error: 'Transmitter not found.' };

                    return communicator.setupPort(req.body.port, transmitter.vlan);
                });
        }

        function addToDatabase() {
            return db.insertReceiver({
                _id: req.body._id,
                name: req.body.name,
                port: req.body.port,
                transmitterId: req.body.transmitterId
            });
        }
    },

    update: function(req, res) {
        communicator.switchPort(req.body.port, req.body.vlan)
            .then(function() {
                //TODO: update database
                res.send('Port switched to requested vlan.');
            })
            .catch(function(error){
                res.status(500).json({ error: error });
            });
    },

    delete: function(req, res) {
        // var id = req.params.id;
        // data.splice(id, 1) // Spoof a DB call
        // res.json(true);
    }
};

module.exports = receivers;