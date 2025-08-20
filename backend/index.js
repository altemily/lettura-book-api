const express = require('express');
const dotenv = require('dotenv');
const { sequelize } = require('./src/config/configDB');
const livroRoutes = require('./src/modules/livro/routes/livro.routes');

dotenv.config();
const app = express();

app.use(express.json());
app.use('/livros', livroRoutes);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    try {
      await sequelize.authenticate();
      console.log('Conexão com o banco de dados estabelecida com sucesso.');
    } catch (error) {
      console.error('Erro ao conectar ou sincronizar o banco de dados:', error);
    }
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

module.exports = app;