var appRoot     = require('app-root-path');
var config      = require('config');

var communicator = appRoot.require('/controllers/communicator.js');
var db = appRoot.require('/database/database.js');

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
        db.insertReceiver(req.body)
            .then(function(newReceiver) {
                res.json(newReceiver);
            })
            .catch(function(error) {
                res.status(500).json({ error: error });
            });
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