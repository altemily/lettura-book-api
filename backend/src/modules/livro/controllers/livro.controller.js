const Livro = require('../models/livro.model');
const { Op } = require('sequelize');

const GENEROS_VALIDOS = [
  'Fantasia', 'Drama', 'Romance', 'Aventura', 'Terror',
  'Suspense', 'Ficção', 'Infantil', 'Policial'
];

function contemSqlInjection(str) {
  if (typeof str !== 'string') return false;
  return /('|;|--|\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b)/i.test(str);
}

function validarLivro(body, isUpdate = false) {
  const { titulo, autor, ano_publicacao, genero, preco } = body;
  if (
    !titulo || !autor || !ano_publicacao ||
    !genero || preco === undefined || preco === ''
  ) {
    return { valido: false, msg: isUpdate ? 'Dados inválidos para atualização' : 'Todos os campos são obrigatórios' };
  }
  if (typeof titulo !== 'string' || titulo.trim().length < 2) {
    return { valido: false, msg: isUpdate ? 'Dados inválidos para atualização' : 'Título deve ter pelo menos 2 caracteres' };
  }
  if (contemSqlInjection(titulo)) {
    return { valido: false, msg: isUpdate ? 'Dados inválidos para atualização' : 'Título inválido' };
  }
  if (typeof autor !== 'string' || autor.trim().length < 3) {
    return { valido: false, msg: isUpdate ? 'Dados inválidos para atualização' : 'Autor inválido' };
  }
  if (contemSqlInjection(autor)) {
    return { valido: false, msg: isUpdate ? 'Dados inválidos para atualização' : 'Autor inválido' };
  }
  if (typeof ano_publicacao === 'string' && !/^\d+$/.test(ano_publicacao)) {
    return { valido: false, msg: isUpdate ? 'Dados inválidos para atualização' : 'Ano de publicação deve ser um número' };
  }
  const ano = Number(ano_publicacao);
  if (!Number.isInteger(ano) || ano < 1) {
    return { valido: false, msg: isUpdate ? 'Dados inválidos para atualização' : 'Ano de publicação deve ser um número' };
  }
  if (contemSqlInjection(ano_publicacao)) {
    return { valido: false, msg: isUpdate ? 'Dados inválidos para atualização' : 'Ano de publicação deve ser um número' };
  }
  if (
    typeof genero !== 'string' ||
    !GENEROS_VALIDOS.includes(genero) ||
    contemSqlInjection(genero)
  ) {
    return { valido: false, msg: isUpdate ? 'Dados inválidos para atualização' : 'Gênero inválido' };
  }
  if (typeof preco === 'string' && !/^\d+(\.\d+)?$/.test(preco)) {
    return { valido: false, msg: isUpdate ? 'Dados inválidos para atualização' : 'Preço deve ser um número' };
  }
  const precoNum = Number(preco);
  if (isNaN(precoNum)) {
    return { valido: false, msg: isUpdate ? 'Dados inválidos para atualização' : 'Preço deve ser um número' };
  }
  if (precoNum <= 0) {
    return { valido: false, msg: isUpdate ? 'Dados inválidos para atualização' : 'Preço deve ser maior que zero' };
  }
  if (contemSqlInjection(preco)) {
    return { valido: false, msg: isUpdate ? 'Dados inválidos para atualização' : 'Preço deve ser um número' };
  }
  return { valido: true };
}

const livroController = {
  async cadastrar(req, res) {
    try {
      const valid = validarLivro(req.body);
      if (!valid.valido) {
        return res.status(400).json({ msg: valid.msg });
      }
      const { titulo, autor, ano_publicacao, genero, preco } = req.body;
      const novoLivro = await Livro.create({
        titulo: titulo.trim(),
        autor: autor.trim(),
        ano_publicacao: Number(ano_publicacao),
        genero,
        preco: Number(preco),
      });
      return res.status(201).json({
        livro: {
          id: novoLivro.id,
          titulo: novoLivro.titulo,
          autor: novoLivro.autor,
          ano_publicacao: novoLivro.ano_publicacao,
          genero: novoLivro.genero,
          preco: novoLivro.preco,
        },
        msg: 'Livro criado com sucesso'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: 'Erro interno' });
    }
  },

  async listar(req, res) {
    try {
      const livros = await Livro.findAll();
      return res.status(200).json(livros);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: 'Erro interno' });
    }
  },

  async buscarPorTitulo(req, res) {
    try {
      const { titulo } = req.query;
      if (!titulo) return res.status(400).json({ msg: 'Título é obrigatório' });
      const livro = await Livro.findOne({
        where: {
          titulo: { [Op.iLike]: `%${titulo}%` }
        }
      });
      if (!livro) return res.status(404).json({ msg: 'Livro não encontrado' });
      return res.status(200).json({
        livro: {
          id: livro.id,
          titulo: livro.titulo,
          autor: livro.autor,
          ano_publicacao: livro.ano_publicacao,
          genero: livro.genero,
          preco: livro.preco
        },
        msg: 'Livro encontrado'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: 'Erro interno' });
    }
  },

  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const livro = await Livro.findByPk(id);
      if (!livro) return res.status(404).json({ msg: 'Livro não encontrado' });
      return res.status(200).json({
        livro: {
          id: livro.id,
          titulo: livro.titulo,
          autor: livro.autor,
          ano_publicacao: livro.ano_publicacao,
          genero: livro.genero,
          preco: livro.preco
        },
        msg: 'Livro encontrado'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: 'Erro interno' });
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const livro = await Livro.findByPk(id);
      if (!livro) return res.status(404).json({ msg: 'Livro não encontrado' });
      const valid = validarLivro(req.body, true);
      if (!valid.valido) {
        return res.status(400).json({ msg: valid.msg });
      }
      const { titulo, autor, ano_publicacao, genero, preco } = req.body;
      await livro.update({
        titulo: titulo.trim(),
        autor: autor.trim(),
        ano_publicacao: Number(ano_publicacao),
        genero,
        preco: Number(preco),
      });
      return res.status(200).json({
        livro: {
          id: livro.id,
          titulo: livro.titulo,
          autor: livro.autor,
          ano_publicacao: livro.ano_publicacao,
          genero: livro.genero,
          preco: livro.preco,
        },
        msg: 'Livro atualizado com sucesso'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: 'Erro interno' });
    }
  },

  async deletar(req, res) {
    try {
      const { id } = req.params;
      const livro = await Livro.findByPk(id);
      if (!livro) {
        return res.status(404).json({ msg: 'Livro não encontrado' });
      }
      await livro.destroy();
      // Teste espera status 204 e body com msg.
      res.status(204).json({ msg: 'Livro deletado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar livro:', error);
      return res.status(500).json({ msg: 'Erro interno'});
    }
  }
};

module.exports = livroController;