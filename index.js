const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
let bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});

const mySecret = process.env['URI_BD'];
mongoose.connect(mySecret, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const EsquemaLog = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: String
});

const EsquemaDatos = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  count: {
    type: Number
  },
  log: [EsquemaLog]
});

const ModeloDatos = mongoose.model('Datos', EsquemaDatos);

app.post("/api/users", async (req, res) => {
  const user = req.body;

  if (!user.username) {
    res.json({ error: "Invalid username" });
    return;
  };

  const userRegistrado = await agregarUsuario(user);
  const { username, _id } = userRegistrado;
  res.json({ username, _id });
});


async function agregarUsuario(user) {
  const documento = new ModeloDatos(user);
  return await documento.save();
}