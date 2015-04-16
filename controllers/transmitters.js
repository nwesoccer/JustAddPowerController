var config       = require('config');
var q            = require('q');
var appRoot      = require('app-root-path');
var communicator = appRoot.require('/communicators/' + config.get('communicator') + '.js');

var Datastore = require('nedb');

var db = { transmitters: new Datastore({
        filename: appRoot.resolve('/database/transmitters.table'),
        autoload: true,
        onload: function(error) {
            if (error) {
                console.log('Error', error);
            } else {
                console.log('Transmitter database loaded.');
            }
        }
    })
};

db.insertTransmitter = q.nbind(db.transmitters.insert, db.transmitters);
db.findTransmitter = q.nbind(db.transmitters.findOne, db.transmitters);
db.findTransmitters = q.nbind(db.transmitters.find, db.transmitters);

var transmitters = {

    getAll: function(req, res) {
        db.findTransmitters({})
            .then(function(transmitters) {
                res.json(transmitters);
            })
            .catch(function(error) {
                res.status(500).send({ error: error });
            });
    },

    getOne: function(req, res) {
        db.findTransmitter({ _id: parseInt(req.params.id) })
            .then(function(transmitter) {
                res.json(transmitter);
            })
            .catch(function(error) {
                res.status(500).send({ error: error });
            });
    },

    create: function(req, res) {
        db.insertTransmitter(req.body)
            .then(function(newTransmitter) {
                res.json(newTransmitter);
            })
            .catch(function(error) {
                res.status(500).send({ error: error });
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