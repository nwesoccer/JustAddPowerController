var config       = require('config');
var q            = require('q');
var appRoot      = require('app-root-path');
var communicator = appRoot.require('/communicators/' + config.get('communicator') + '.js');

var Datastore = require('nedb');

var db = { receivers: new Datastore({
        filename: appRoot.resolve('/database/receivers.table'),
        autoload: true,
        onload: function(error) {
            if (error) {
                console.log('Error', error);
            } else {
                console.log('Receiver database loaded.');
            }
        }
    })
};

db.insertReceiver = q.nbind(db.receivers.insert, db.receivers);
db.findReceiver = q.nbind(db.receivers.findOne, db.receivers);
db.findReceivers = q.nbind(db.receivers.find, db.receivers);

var receivers = {

    getAll: function(req, res) {
        db.findReceivers({})
            .then(function(receivers) {
                res.json(receivers);
            })
            .catch(function(error) {
                res.status(500).send({ error: error });
            });
    },

    getOne: function(req, res) {
        db.findReceiver({ _id: parseInt(req.params.id) })
            .then(function(receiver) {
                res.json(receiver);
            })
            .catch(function(error) {
                res.status(500).send({ error: error });
            });
    },

    getForTransmitter: function(req, res) {
        db.findReceivers({ transmitterId: parseInt(req.params.id) })
            .then(function(receivers) {
                res.json(receivers);
            })
            .catch(function(error) {
                res.status(500).send({ error: error });
            });
    },

    create: function(req, res) {
        db.insertReceiver(req.body)
            .then(function(newReceiver) {
                res.json(newReceiver);
            })
            .catch(function(error) {
                res.status(500).send({ error: error });
            });
    },

    update: function(req, res) {
        // var updateReceiver = req.body;
        // var id = req.params.id;
        // data[id] = updateReceiver // Spoof a DB call
        // res.json(updateReceiver);
    },

    delete: function(req, res) {
        // var id = req.params.id;
        // data.splice(id, 1) // Spoof a DB call
        // res.json(true);
    }
};

module.exports = receivers;