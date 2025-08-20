const express = require('express');
const controller = require('../controllers/livro.controller');
const router = express.Router();

router.post('/', controller.cadastrar);
router.get('/', controller.listar);
router.get('/busca', controller.buscarPorTitulo);
router.get('/:id', controller.buscarPorId);
router.put('/:id', controller.atualizar);
router.delete('/:id', controller.deletar);

module.exports = router;