var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');
var appRoot      = require('app-root-path');

var transmitters = appRoot.require('/controllers/transmitters.js');
var receivers = appRoot.require('/controllers/receivers.js');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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
console.log('API on port ' + port);