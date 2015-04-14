var receivers = {

    getAll: function(req, res) {
        var allReceivers = data; // Spoof a DB call
        res.json(allReceivers);
    },

    getOne: function(req, res) {
        var id = req.params.id;
        var receiver = data[0]; // Spoof a DB call
        res.json(receiver);
    },

    create: function(req, res) {
        var newReceiver = req.body;
        data.push(newReceiver); // Spoof a DB call
        res.json(newReceiver);
    },

    update: function(req, res) {
        var updateReceiver = req.body;
        var id = req.params.id;
        data[id] = updateReceiver // Spoof a DB call
        res.json(updateReceiver);
    },

    delete: function(req, res) {
        var id = req.params.id;
        data.splice(id, 1) // Spoof a DB call
        res.json(true);
    }
};

var data = [{
    name: 'Receiver 1',
    id: '1'
}, {
    name: 'Receiver 2',
    id: '2'
}, {
    name: 'Receiver 3',
    id: '3'
}];

module.exports = receivers;