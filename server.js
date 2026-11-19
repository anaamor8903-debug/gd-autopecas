const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Configurações para ler JSON e formulários enviados pelo site
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir os arquivos estáticos (HTML, CSS e imagens)
app.use(express.static(path.join(__dirname)));

// Conectar/Criar o Banco de Dados SQLite local
const db = new sqlite3.Database('./gd_autopecas.db', (err) => {
    if (err) {
        console.error('Erro ao abrir o banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite com sucesso!');
    }
});

// Criar as tabelas iniciais e inserir os produtos do catálogo automaticamente
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        codigo TEXT UNIQUE NOT NULL,
        categoria TEXT NOT NULL,
        preco REAL NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome_cliente TEXT NOT NULL,
        email TEXT NOT NULL,
        endereco TEXT NOT NULL,
        valor_total REAL NOT NULL,
        status TEXT DEFAULT 'Em preparação'
    )`);

    // Inserir os 3 kits de freio do protótipo (caso a tabela esteja vazia)
    db.get("SELECT COUNT(*) AS total FROM produtos", (err, row) => {
        if (row && row.total === 0) {
            const stmt = db.prepare("INSERT INTO produtos (nome, codigo, categoria, preco) VALUES (?, ?, ?, ?)");
            stmt.run("Kit freio dianteiro G&D Essencial", "GD-FR001", "Sistema de freios", 349.90);
            stmt.run("Kit freio dianteiro G&D Pro", "GD-FR002", "Sistema de freios", 399.90);
            stmt.run("Kit freio dianteiro G&D Performance", "GD-FR003", "Sistema de freios", 449.90);
            stmt.finalize();
            console.log("Produtos iniciais cadastrados no banco de dados!");
        }
    });
});

// Rota API para consultar os produtos cadastrados no banco
app.get('/api/produtos', (req, res) => {
    db.all("SELECT * FROM produtos", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ erro: err.message });
        }
        res.json({ produtos: rows });
    });
});

// Rota API para salvar um novo pedido vindo da tela de checkout
app.post('/api/pedidos', (req, res) => {
    const { nome_cliente, email, endereco, valor_total } = req.body;
    const sql = `INSERT INTO pedidos (nome_cliente, email, endereco, valor_total) VALUES (?, ?, ?, ?)`;
    
    db.run(sql, [nome_cliente, email, endereco, valor_total], function(err) {
        if (err) {
            return res.status(500).json({ erro: err.message });
        }
        res.json({ mensagem: 'Pedido salvo com sucesso!', pedido_id: this.lastID });
    });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em: http://localhost:${PORT}`);
});