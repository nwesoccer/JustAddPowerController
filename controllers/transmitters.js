var appRoot     = require('app-root-path');
var config      = require('config');

var communicator = appRoot.require('/controllers/communicator.js');
var db = appRoot.require('/database/database.js');

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
            .catch(function(error) {
                res.status(500).json({ error: error });
            });
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
            .catch(function(error) {
                res.status(500).json({ error: error });
            });
    },

    create: function(req, res) {
        db.insertTransmitter(req.body)
            .then(function(newTransmitter) {
                res.json(newTransmitter);
            })
            .catch(function(error) {
                res.status(500).json({ error: error });
            });
    },

    update: function(req, res) {
        // var updateTransmitter = req.body;
        // var id = req.params.id;
        // data[id] = updateTransmitter // Spoof a DB call
        // res.json(updateTransmitter);
    },

    delete: function(req, res) {
        // var id = req.params.id;
        // data.splice(id, 1) // Spoof a DB call
        // res.json(true);
    }
};

module.exports = transmitters;