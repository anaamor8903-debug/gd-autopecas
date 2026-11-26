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

const produtosIniciais = [
    // Linha Carro - Freios
    ["Kit Freio Dianteiro - Fiat Argo Cronos Pulse - modelo 2022 a 2026", "GD-FR101", "carro", "freios", 83.55, "assets/img/freio-carro1.PNG"],
    ["Kit Freio Dianteiro - Vw T-cross Nivus Virtus Polo Tsi- modelo 2020 a 2025", "GD-FR102", "carro", "freios", 179.90, "assets/img/freio-carro2.png"],
    ["Kit Freio Dianteiro Traseiro Cruze 1.8 - modelo 2012 a 2016", "GD-FR103", "carro", "freios", 182.90, "assets/img/freio-carro3.png"],

    // Linha Carro - Filtros
    ["Filtro de óleo Mann Vw Polo Nivus Virtus Up Taos Tcross Tera", "GD-FL101", "carro", "filtros", 29.99, "assets/img/filtro-carro1.png"],
    ["Filtro de óleo Prisma Celta Montana Onix Astra Meriva Vectra", "GD-FL102", "carro", "filtros", 25.99, "assets/img/filtro-carro2.png"],
    ["Filtro de óleo Argo Cronos Mobi Nova Strada Fiat 7094709", "GD-FL103", "carro", "filtros", 70.90, "assets/img/filtro-carro3.png"],

    // Linha Carro - Suspensão
    ["Kit amortecedor - Dianteiro e Traseiro - marca Nakata - Fiat Uno", "GD-SP101", "carro", "suspensao", 995.99, "assets/img/suspensao-carro1.png"],
    ["Kit amortecedor - Dianteiro e Traseiro - marca Nakata - Onix Prisma Cobalt", "GD-SP102", "carro", "suspensao", 1188.99, "assets/img/suspensao-carro2.png"],
    ["Kit amortecedor - Dianteiro e Traseiro - marca Nakata - Gol Voyage G5 G6 G7 + Kit Compressão", "GD-SP103", "carro", "suspensao", 794.99, "assets/img/suspensao-carro3.png"],

    // Linha Moto - Freios
    ["Kit Pastilha de Freio Dianteira + Lona / Patins de Freio Traseira - Fan/Titan 160 - ano 2018", "GD-FR201", "moto", "freios", 53.00, "assets/img/disco-freio2.png"],
    ["Pastilha Freio Dianteira - HONDA CB 650R / CBR 650 2020 - 2022", "GD-FR202", "moto", "freios", 145.86, "assets/img/disco-moto2.png"],
    ["Lona Pastilha Freio - Biz 125 Ex 2025 2026 - Dianteiro e Traseiro", "GD-FR203", "moto", "freios", 66.91, "assets/img/disco-moto3.jpeg"],

    // Linha Moto - Filtros
    ["Filtro de Óleo Motor Suzuki com Anel Original", "GD-FL201", "moto", "filtros", 19.50, "assets/img/filtro-moto1.png"],
    ["Filtro de Óleo do Motor Dominar 200 / 250 / 400 / NS400Z / Pulsar N150", "GD-FL202", "moto", "filtros", 61.89, "assets/img/filtro-moto2.png"],
    ["Filtro De Óleo Motor Yamaha Xj6 NF 600, Xj6n, Xj6f- 2010-2019", "GD-FL203", "moto", "filtros", 37.00, "assets/img/filtro-moto3.png"],

    // Linha Moto - Suspensão
    ["Par Amortecedor Suspensão Traseira Cg 150/160 e Cg 160 Titan", "GD-SP201", "moto", "suspensao", 179.50, "assets/img/suspensao-moto1.png"],
    ["Par Amortecedor Traseiro Biz 125 - 2011 a 2022", "GD-SP202", "moto", "suspensao", 119.99, "assets/img/suspensao-moto2.png"],
    ["Amortecedor Traseiro Lander 250 - 2007 a 2022", "GD-SP203", "moto", "suspensao", 239.90, "assets/img/suspensao-moto3.png"]
];

// Criar as tabelas iniciais e inserir os produtos do catálogo automaticamente
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        codigo TEXT UNIQUE NOT NULL,
        linha TEXT NOT NULL,
        categoria TEXT NOT NULL,
        preco REAL NOT NULL,
        imagem TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome_cliente TEXT NOT NULL,
        email TEXT NOT NULL,
        endereco TEXT NOT NULL,
        valor_total REAL NOT NULL,
        status TEXT DEFAULT 'Em preparação'
    )`);

    
    db.get("SELECT COUNT(*) AS total FROM produtos", (err, row) => {
        if (err) {
            console.error("Erro ao contar produtos:", err.message);
            return;
        }

        if (row && row.total === 0) {
            // 🔴 [MUDAR AQUI] Corrigido: adicionada a coluna 'linha' e o 6º '?' para bater com os 6 valores de cada produto
            const stmt = db.prepare(
                "INSERT INTO produtos (nome, codigo, linha, categoria, preco, imagem) VALUES (?, ?, ?, ?, ?, ?)"
            );

            for (const produto of produtosIniciais) {
                stmt.run(...produto);
            }

            stmt.finalize((finalizeErr) => {
                if (finalizeErr) {
                    console.error("Erro ao finalizar inserção:", finalizeErr.message);
                } else {
                    console.log(`${produtosIniciais.length} produtos iniciais cadastrados no banco de dados!`);
                }
            });
        }
    });
});

//  Rota API para consultar os produtos cadastrados no banco
app.get('/api/produtos', (req, res) => {
    db.all("SELECT * FROM produtos ORDER BY id ASC", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ erro: err.message });
        }
        res.json({ produtos: rows });
    });
});

//  Rota API para salvar um novo pedido vindo da tela de checkout
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