var appRoot      = require('app-root-path');
var bodyParser = require('body-parser');
var schedule = require('node-schedule');
var express    = require('express');
var expressValidator = require('express-validator');
var app        = express();

var communicator = appRoot.require('/controllers/communicator.js');
var transmitters = appRoot.require('/controllers/transmitters.js');
var receivers = appRoot.require('/controllers/receivers.js');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(expressValidator({
    customValidators: {
        gte: function(param, num) {
            return param >= num;
        },
        lte: function(param, num) {
            return param <= num;
        },
        isArrayOfInts: function(param) {
            if (typeof param !== "string") return false;

            var ints = param.split(",");

            return ints.every(function(value){
                return !isNaN(value);
            });
        }
    }
}));

var port = process.env.PORT || 8080;
var router = express.Router();

router.get('/', function(req, res) {
    res.json({ message: 'Welcome to the JustAddPower API' });
});

router.get('/transmitters', transmitters.getAll);
router.get('/transmitters/:id', transmitters.getOne);
router.get('/transmitters/:id/receivers', receivers.getForTransmitter);
router.post('/transmitters', transmitters.create);
router.put('/transmitters/:id', transmitters.update);
router.delete('/transmitters/:id', transmitters.delete);

router.get('/receivers', receivers.getAll);
router.get('/receivers/:id', receivers.getOne);
router.post('/receivers', receivers.create);
router.put('/receivers/:id', receivers.update);
router.delete('/receivers/:id', receivers.delete);

app.use('', router);
app.listen(port);

// Save switch running-config to startup-config every hour
schedule.scheduleJob('0 * * * *', function() {
    communicator.saveConfig()
        .catch(function(error) {
            console.log('Error saving config.', error);
        });

    // TODO: Update database based off switch
});