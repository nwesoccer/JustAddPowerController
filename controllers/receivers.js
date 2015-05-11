var appRoot = require('app-root-path');
var config = require('config');
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
            .catch(function(data) { handleErrors(res, data); });
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
            .catch(function(data) { handleErrors(res, data); });
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
            .catch(function(data) { handleErrors(res, data); });
    },

    create: function(req, res) {
        q()
        .then(validateRequest)
        .then(addToSwitch)
        .then(addToDatabase)
        .then(function(receiver) { res.json(receiver); })
        .catch(function(data) { handleErrors(res, data); });

        function validateRequest() {
            var minPort = config.get('receivers.minPort');
            var maxPort = config.get('receivers.maxPort');

            req.checkBody('_id', '_id must be provided.').isInt();
            req.checkBody('port', util.format('Port must be an integer between %d and %d.', minPort, maxPort)).isInt().gte(minPort).lte(maxPort);
            req.checkBody('transmitterId', 'TransmitterId must be provided.').notEmpty();
            req.checkBody('name', 'Name cannot be empty.').notEmpty();
            req.checkBody('ip', 'Must specify valid IP.').optional().isIP();
            req.checkBody('type', 'Must specify valid type.').optional().notEmpty();
            req.checkBody('room', 'Must specify valid room.').optional().notEmpty();
            req.checkBody('location', 'Must specify valid location.').optional().notEmpty();
            req.checkBody('connectedDevice', 'Must specify valid connectedDevice.').optional().notEmpty();

            var errors = req.validationErrors(true);
            if (errors) throw { status: 400, errors: errors };

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
                port: req.body.port,
                transmitterId: req.body.transmitterId,
                name: req.body.name,
                ip: req.body.ip,
                type: req.body.type,
                room: req.body.room,
                location: req.body.location,
                connectedDevice: req.body.connectedDevice
            });
        }
    },

    update: function(req, res) {
        q()
        .then(validateRequest)
        .then(getCurrentReceiver)
        .then(updateSwitch)
        .then(updateDatabase)
        .then(function(receiver) { res.json(receiver); })
        .catch(function(data) { handleErrors(res, data); });

        function validateRequest() {
            req.checkParams('id', 'id must be provided.').isInt();
            req.checkBody('transmitterId', 'TransmitterId cannot be empty.').optional().notEmpty();
            req.checkBody('name', 'Name cannot be empty.').optional().notEmpty();
            req.checkBody('ip', 'Must specify valid IP.').optional().isIP();
            req.checkBody('type', 'Must specify valid type.').optional().notEmpty();
            req.checkBody('room', 'Must specify valid room.').optional().notEmpty();
            req.checkBody('location', 'Must specify valid location.').optional().notEmpty();
            req.checkBody('connectedDevice', 'Must specify valid connectedDevice.').optional().notEmpty();

            var errors = req.validationErrors(true);
            if (errors) throw { status: 400, errors: errors };
        }

        function getCurrentReceiver() {
            return db.findReceiver({ _id: parseInt(req.params.id) })
                .then(function(receiver) {
                    if (!receiver) throw { status: 404, error: 'Receiver not found.' };
                    return receiver;
                });
        }

        function updateSwitch(receiver) {
            if (receiver.transmitterId === req.body.transmitterId) { return receiver; }

            return db.findTransmitter({ _id: req.body.transmitterId })
                .then(function(transmitter) {
                    if (!transmitter) throw { status: 404, error: 'Transmitter not found.' };
                    return communicator.switchPort(receiver.port, transmitter.vlan);
                })
                .then(function() { return receiver; });
        }

        function updateDatabase(receiver) {
            if (req.body.transmitterId) { receiver.transmitterId = req.body.transmitterId; }
            if (req.body.name) { receiver.name = req.body.name; }
            if (req.body.ip) { receiver.ip = req.body.ip; }
            if (req.body.type) { receiver.type = req.body.type; }
            if (req.body.room) { receiver.room = req.body.room; }
            if (req.body.location) { receiver.location = req.body.location; }
            if (req.body.connectedDevice) { receiver.connectedDevice = req.body.connectedDevice; }

            return db.updateReceiver({ _id: receiver._id }, receiver)
                .then(function() { return receiver; });
        }
    },

    delete: function(req, res) {
        db.findReceiver({ _id: parseInt(req.params.id) })
            .then(function(receiver) {
                if (!receiver) throw { status: 404, error: 'Receiver not found.' };
                return receiver;
            })
            .then(function(receiver) {
                return communicator.cleanPort(receiver.port)
                    .then(function() { return receiver; });
            })
            .then(function(receiver) {
                return db.deleteReceiver({ _id: receiver._id }, { });
            })
            .then(function() { res.status(204).end(); })
            .catch(function(data) { handleErrors(res, data); });
    }
};

module.exports = receivers;