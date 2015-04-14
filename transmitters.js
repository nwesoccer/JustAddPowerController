var transmitters = {

    getAll: function(req, res) {
        var allTransmitters = data; // Spoof a DB call
        res.json(allTransmitters);
    },

    getOne: function(req, res) {
        var id = req.params.id;
        var transmitter = data[0]; // Spoof a DB call
        res.json(transmitter);
    },

    create: function(req, res) {
        var newTransmitter = req.body;
        data.push(newTransmitter); // Spoof a DB call
        res.json(newTransmitter);
    },

    update: function(req, res) {
        var updateTransmitter = req.body;
        var id = req.params.id;
        data[id] = updateTransmitter // Spoof a DB call
        res.json(updateTransmitter);
    },

    delete: function(req, res) {
        var id = req.params.id;
        data.splice(id, 1) // Spoof a DB call
        res.json(true);
    }
};

var data = [{
    name: 'Transmitter 1',
    id: '1'
}, {
    name: 'Transmitter 2',
    id: '2'
}, {
    name: 'Transmitter 3',
    id: '3'
}];

module.exports = transmitters;