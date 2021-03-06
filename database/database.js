var appRoot     = require('app-root-path');
var q           = require('q');

var Datastore = require('nedb');

var database = {

    transmitters: new Datastore({
        filename: appRoot.resolve('/database/transmitters.table'),
        autoload: true,
        onload: function(error) {
            if (error) { console.log('Error', error); }
            else { console.log('Transmitter database loaded.'); }
        }
    }),

    receivers: new Datastore({
        filename: appRoot.resolve('/database/receivers.table'),
        autoload: true,
        onload: function(error) {
            if (error) { console.log('Error', error); }
            else { console.log('Receiver database loaded.'); }
        }
    })

};

database.transmitters.ensureIndex({ fieldName: 'port', unique: true }, function (error) {
    if (error) { console.log('Error', error); }
});

database.receivers.ensureIndex({ fieldName: 'port', unique: true }, function (error) {
    if (error) { console.log('Error', error); }
});

database.insertTransmitter = q.nbind(database.transmitters.insert, database.transmitters);
database.findTransmitter = q.nbind(database.transmitters.findOne, database.transmitters);
database.findTransmitters = q.nbind(database.transmitters.find, database.transmitters);
database.updateTransmitter = q.nbind(database.transmitters.update, database.transmitters);
database.deleteTransmitter = q.nbind(database.transmitters.remove, database.transmitters);

database.insertReceiver = q.nbind(database.receivers.insert, database.receivers);
database.findReceiver = q.nbind(database.receivers.findOne, database.receivers);
database.findReceivers = q.nbind(database.receivers.find, database.receivers);
database.updateReceiver = q.nbind(database.receivers.update, database.receivers);
database.deleteReceiver = q.nbind(database.receivers.remove, database.receivers);

module.exports = database;