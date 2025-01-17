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


app.get("/api/users", async (req, res) => {
  const usuarios = await obtenerTodosUsuarios();
  res.send(usuarios);
});


app.post("/api/users/:_id/exercises", async (req, res) => {
  const { _id } = req.params;
  let { description, duration, date } = req.body;

  if (!_id || !description || !duration) {
    res.json({ error: "Required data" });
    return;
  };

  if (/\d{4}-\d{2}-\d{2}/.test(date)) {
    const fecha = new Date(date);
    date = fecha.toDateString();
  } else {
    const fecha = new Date();
    date = fecha.toDateString();
  };

  duration = Number(duration);

  const ejercicio = await agregarEjercicio(_id, description, duration, date);
  res.json(ejercicio);
});


app.get("/api/users/:_id/logs", async (req, res) => {
  const { from, to, limit } = req.query;
  const { _id } = req.params;

  if (from && to) {
    const resultados = await buscarLogRango(_id, from, to, limit);
    res.json(resultados);
    return;
  };

  if (limit) {
    const resultado = await buscarLogLimite(_id, limit);
    res.json(resultado);
    return;
  };

  const usuario = await buscarUsuario(_id);
  res.json(usuario);
});


async function agregarUsuario(user) {
  const documento = new ModeloDatos(user);
  return await documento.save();
};


async function obtenerTodosUsuarios() {
  return await ModeloDatos.find()
    .select({
      username: 1,
      _id: 1,
      __v: 1
    })
    .exec();
};


async function agregarEjercicio(_id, description, duration, date) {
  const usuario = await buscarUsuario(_id);
  usuario.log.push({ description, duration, date });
  usuario.count = usuario.log.length;

  const user = await agregarUsuario(usuario);
  return { username: user.username, description, duration, date, _id };
};


async function buscarUsuario(_id) {
  return await ModeloDatos.findById(_id)
    .select({ __v: 0, log: { _id: 0 } })
    .exec();
};


async function buscarLogRango(_id, from, to, limit) {
  const user = await buscarUsuario(_id);
  const desde = new Date(from).getTime();
  const hasta = new Date(to).getTime();

  const logs = user.log.filter(ejercicio => {
    const date = new Date(ejercicio.date).getTime();

    if (date >= desde && date <= hasta) {
      return true;
    };
  });

  if (limit) {
    logs.splice(limit, logs.length);
  };

  user.log = logs;
  return user;
};


async function buscarLogLimite(_id, limit) {
  const user = await buscarUsuario(_id);
  user.log.splice(limit, user.log.length);
  return user;
};