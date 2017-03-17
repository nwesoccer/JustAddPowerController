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

var transmitters = {

    getAll: function(req, res) {
        db.findTransmitters({})
            .then(function(transmitters) {
                if (!transmitters || transmitters.length === 0) {
                    res.json([]);
                } else {
                    res.json(transmitters);
                }
            })
            .catch(function(data) { handleErrors(res, data); });
    },

    getOne: function(req, res) {
        db.findTransmitter({ _id: parseInt(req.params.id) })
            .then(function(transmitter) {
                if (!transmitter) {
                    res.status(404).send({ error: 'Transmitter not found.' });
                } else {
                    res.json(transmitter);
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
            var minPort = config.get('transmitters.minPort');
            var maxPort = config.get('transmitters.maxPort');
            var minVlan = config.get('transmitters.minVlan');
            var maxVlan = config.get('transmitters.maxVlan');

            req.checkBody('_id', '_id must be provided.').isInt();
            req.checkBody('port', util.format('Port must be an integer between %d and %d.', minPort, maxPort)).isInt().gte(minPort).lte(maxPort);
            req.checkBody('vlan', 'Vlan must be an integer between %d and %d.', minVlan, maxVlan).isInt().gte(minVlan).lte(maxVlan);
            req.checkBody('name', 'Name cannot be empty.').notEmpty();
            req.checkBody('ip', 'Must specify valid IP.').optional().isIP();
            req.checkBody('type', 'Must specify valid type.').optional().notEmpty();
            req.checkBody('room', 'Must specify valid room.').optional().notEmpty();
            req.checkBody('location', 'Must specify valid location.').optional().notEmpty();
            req.checkBody('connectedDevice', 'Must specify valid connectedDevice.').optional().notEmpty();
            req.checkBody('purpose', 'Must specify valid purpose.').optional().notEmpty();

            var errors = req.validationErrors(true);
            if (errors) throw { status: 400, errors: errors };

            return db.findReceiver({ port: req.body.port })
                .then(function(receiver) { if (receiver) throw { status: 400, error: 'Port taken.' }; })
                .then(function() { return db.findTransmitter({ port: req.body.port }); })
                .then(function(transmitter) { if (transmitter) throw { status: 400, error: 'Port taken.' }; })
                .then(function() { /* Ensure not taken by something else on the switch */ });
        }

        function addToSwitch() {
            return communicator.setupPort(req.body.port, req.body.vlan);
        }

        function addToDatabase() {
            return db.insertTransmitter({
                _id: req.body._id,
                port: req.body.port,
                vlan: req.body.vlan,
                name: req.body.name,
                ip: req.body.ip,
                type: req.body.type,
                room: req.body.room,
                location: req.body.location,
                connectedDevice: req.body.connectedDevice,
                purpose: req.body.purpose
            });
        }
    },

    update: function(req, res) {
        q()
        .then(validateRequest)
        .then(getCurrentTransmitter)
        .then(updateDatabase)
        .then(function(transmitter) { res.json(transmitter); })
        .catch(function(data) { handleErrors(res, data); });

        function validateRequest() {
            req.checkParams('id', 'id must be provided.').isInt();
            req.checkBody('name', 'Name cannot be empty.').optional().notEmpty();
            req.checkBody('ip', 'Must specify valid IP.').optional().isIP();
            req.checkBody('type', 'Must specify valid type.').optional().notEmpty();
            req.checkBody('room', 'Must specify valid room.').optional().notEmpty();
            req.checkBody('location', 'Must specify valid location.').optional().notEmpty();
            req.checkBody('connectedDevice', 'Must specify valid connectedDevice.').optional().notEmpty();
            req.checkBody('purpose', 'Must specify valid purpose.').optional().notEmpty();

            var errors = req.validationErrors(true);
            if (errors) throw { status: 400, errors: errors };
        }

        function getCurrentTransmitter() {
            return db.findTransmitter({ _id: parseInt(req.params.id) })
                .then(function(transmitter) {
                    if (!transmitter) throw { status: 404, error: 'Transmitter not found.' };
                    return transmitter;
                });
        }

        function updateDatabase(transmitter) {
            if (req.body.name) { transmitter.name = req.body.name; }
            if (req.body.ip) { transmitter.ip = req.body.ip; }
            if (req.body.type) { transmitter.type = req.body.type; }
            if (req.body.room) { transmitter.room = req.body.room; }
            if (req.body.location) { transmitter.location = req.body.location; }
            if (req.body.connectedDevice) { transmitter.connectedDevice = req.body.connectedDevice; }
            if (req.body.purpose) { transmitter.purpose = req.body.purpose; }

            return db.updateTransmitter({ _id: transmitter._id }, transmitter)
                .then(function(){ return transmitter; });
        }
    },

    delete: function(req, res) {
        db.findTransmitter({ _id: parseInt(req.params.id) })
            .then(function(transmitter) {
                if (!transmitter) throw { status: 404, error: 'Transmitter not found.' };
                return transmitter;
            })
            .then(function(transmitter) {
                return communicator.cleanPort(transmitter.port)
                    .then(function() { return transmitter; });
            })
            .then(function(transmitter) {
                return db.deleteTransmitter({ _id: transmitter._id }, { });
            })
            .then(function() { res.status(204).end(); })
            .catch(function(data) { handleErrors(res, data); });
    }
};

module.exports = transmitters;