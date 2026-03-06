const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db;
(async () => {
  db = await open({ filename: path.join(__dirname, 'database.sqlite'), driver: sqlite3.Database });
  await db.exec(`CREATE TABLE IF NOT EXISTS pix (id INTEGER PRIMARY KEY AUTOINCREMENT, valor REAL NOT NULL, chave TEXT DEFAULT 'site', descricao TEXT, data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS acessos (id INTEGER PRIMARY KEY AUTOIN_INCREMENT, contador INTEGER DEFAULT 0); INSERT OR IGNORE INTO acessos (id, contador) VALUES (1, 0);`);
})();

app.post('/api/add-padrao', async (req, res) => {
  const result = await db.run('INSERT INTO pix (valor, chave, descricao) VALUES (564.18, "compra-site", "Compra confirmada")');
  const novoPix = await db.get('SELECT * FROM pix WHERE id = ?', result.lastID);
  io.emit('novo_pix', novoPix);
  res.json({ sucesso: true });
});

app.get('/api/pix', async (req, res) => res.json(await db.all('SELECT * FROM pix ORDER BY data_criacao DESC')));
app.get('/api/acessos', async (req, res) => res.json({ acessos: (await db.get('SELECT contador FROM acessos WHERE id = 1')).contador }));

let onlineUsers = 0;
io.on('connection', (s) => { onlineUsers++; io.emit('online_count', onlineUsers); s.on('disconnect', () => { onlineUsers--; io.emit('online_count', onlineUsers); }); });

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));