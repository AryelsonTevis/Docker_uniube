const express = require("express");
const mysql = require("mysql2/promise");
const jtw = require("jsonwebtoken");

const app = express();
const PORT = 3001;

const JWT_SECERT = "3ba6d3a2cb6fe353048166563ee34b54";
const API_KEY = "1ba47064494cc437b385dec68747a9487cbcfecd";
app.use(express.json());
// Configuração do MySQL (igual ao docker-compose)
const dbConfig = {
  host: "mysql", // nome do serviço no docker-compose
  user: "appuser",
  password: "apppass",
  database: "appdb",
};
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1]; // formato: "Bearer <token>"

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido ou expirado" });
    }
    req.user = user; // payload do JWT
    next();
  });
}

app.get("/", (req, res) => {
  res.json({ message: "Node.js está rodando no Docker!" });
});
app.post("/auth", (req, res) => {
  const apikey = req.body.API_KEY;
  if (apikey !== API_KEY) {
    return res.status(403).jason({ erroo: "API key invalida" });
  }
  const payload = { role: "adimin", name: "API User" };
  const token = jwt.sing(payload, JWT_SECERT, { expiresIn: "1h" });
  res.json({ token });
});
app.get("/api/v1/clientes/:id", async (req, res) => {
  try {
    const cliente = req.params.id;
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT * FROM clientes where id = ?",
      [cliente]
    );
    await connection.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/v1/clientes", async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute("SELECT * FROM clientes");
    await connection.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/v1/cliente", async (req, res) => {
  try {
    const { nome, email, telefone } = req.body;

    if (!nome || !email || !telefone) {
      return res
        .status(400)
        .json({ error: "Campos obrigatórios: nome, email, telefone" });
    }

    const connection = await mysql.createConnection(dbConfig);

    const [result] = await connection.execute(
      "INSERT INTO clientes (nome, email, telefone) VALUES (?, ?, ?)",
      [nome, email, telefone]
    );

    await connection.end();

    res.status(201).json({
      message: "Cliente criado com sucesso!",
      clienteId: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/v1/cliente/:id", async (req, res) => {
  try {
    const cliente = req.params.id;

    const connection = await mysql.createConnection(dbConfig);
    await connection.execute("delete from vendas where cliente_id = ?", [
      cliente,
    ]);

    const [rows] = await connection.execute(
      "delete from clientes where id = ?",
      [cliente]
    );

    await connection.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.patch("/api/v1/clientes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, telefone } = req.body;
    const connection = await mysql.createConnection(dbConfig);

    await connection.execute(
      "update clientes set nome = ?, email = ?, telefone = ? where id = ?",
      [nome, email, telefone, id]
    );

    await connection.end();

    res.send("Cliente alterado com sucesso!");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.listen(PORT, () => {
  console.log("servidor na porta $(PORT)");
});
