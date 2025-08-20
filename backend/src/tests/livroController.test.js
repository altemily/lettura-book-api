const Livro = require('../modules/livro/models/livro.model');
const { sequelize } = require('../config/configDB');
const app = require('../../index');
const req = require('supertest');

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterAll(async () => {
    await sequelize.close();
});

describe('Livro API', () => {
    let livroId;

    describe('Cadastro', () => {
        test('✅ Deve criar um livro com sucesso', async () => {
            const response = await req(app).post('/livros').send({
                titulo: 'O Senhor dos Anéis',
                autor: 'J.R.R. Tolkien',
                ano_publicacao: 1954,
                genero: 'Fantasia',
                preco: 59.9
            });

            expect(response.statusCode).toBe(201);
            expect(response.body.livro).toHaveProperty('id');
            expect(response.body.livro.titulo).toBe('O Senhor dos Anéis');
            expect(response.body).toHaveProperty('msg', 'Livro criado com sucesso');
            livroId = response.body.livro.id;
        });
    });

    describe('Validação de campos', () => {
        test('❌ Não deve criar livro com campos vazios', async () => {
            const response = await req(app).post('/livros').send({
                titulo: '',
                autor: '',
                ano_publicacao: '',
                genero: '',
                preco: ''
            });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('msg', 'Todos os campos são obrigatórios');
        });

        test('❌ Não deve criar livro com ano inválido', async () => {
            const response = await req(app).post('/livros').send({
                titulo: 'Livro Teste',
                autor: 'Autor Teste',
                ano_publicacao: 'ano',
                genero: 'Teste',
                preco: 29.9
            });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('msg', 'Ano de publicação deve ser um número');
        });

        test('❌ Não deve criar livro com preço negativo', async () => {
            const response = await req(app).post('/livros').send({
                titulo: 'Livro Preço Negativo',
                autor: 'Autor',
                ano_publicacao: 2020,
                genero: 'Drama',
                preco: -10
            });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('msg', 'Preço deve ser maior que zero');
        });

        test('❌ Não deve criar livro com título muito curto', async () => {
            const response = await req(app).post('/livros').send({
                titulo: 'A',
                autor: 'Autor',
                ano_publicacao: 2020,
                genero: 'Drama',
                preco: 10
            });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('msg', 'Título deve ter pelo menos 2 caracteres');
        });

        test('❌ Não deve criar livro com gênero inválido', async () => {
            const response = await req(app).post('/livros').send({
                titulo: 'Livro Gênero Inválido',
                autor: 'Autor',
                ano_publicacao: 2020,
                genero: 'Desconhecido',
                preco: 10
            });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('msg', 'Gênero inválido');
        });

        test('❌ Não deve criar livro com preço não numérico', async () => {
            const response = await req(app).post('/livros').send({
                titulo: 'Livro Preço String',
                autor: 'Autor',
                ano_publicacao: 2020,
                genero: 'Drama',
                preco: 'caro'
            });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('msg', 'Preço deve ser um número');
        });
    });

    describe('Validação contra SQL Injection', () => {
        test('❌ Não deve aceitar SQL injection no título', async () => {
            const response = await req(app).post('/livros').send({
                titulo: "Robert'); DROP TABLE livros;--",
                autor: 'Autor',
                ano_publicacao: 2020,
                genero: 'Drama',
                preco: 10
            });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('msg', 'Título inválido');
        });

        test('❌ Não deve aceitar SQL injection no autor', async () => {
            const response = await req(app).post('/livros').send({
                titulo: "Livro Normal",
                autor: "'); DELETE FROM livros WHERE 1=1;--",
                ano_publicacao: 2020,
                genero: 'Drama',
                preco: 10
            });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('msg', 'Autor inválido');
        });

        test('❌ Não deve aceitar SQL injection no gênero', async () => {
            const response = await req(app).post('/livros').send({
                titulo: "Livro Normal",
                autor: "Autor",
                ano_publicacao: 2020,
                genero: "Drama'); DROP TABLE livros;--",
                preco: 10
            });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('msg', 'Gênero inválido');
        });

        test('❌ Não deve aceitar SQL injection no ano_publicacao', async () => {
            const response = await req(app).post('/livros').send({
                titulo: "Livro Normal",
                autor: "Autor",
                ano_publicacao: "2020; DROP TABLE livros;",
                genero: "Drama",
                preco: 10
            });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('msg', 'Ano de publicação deve ser um número');
        });

        test('❌ Não deve aceitar SQL injection no preço', async () => {
            const response = await req(app).post('/livros').send({
                titulo: "Livro Normal",
                autor: "Autor",
                ano_publicacao: 2020,
                genero: "Drama",
                preco: "10; DROP TABLE livros;"
            });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('msg', 'Preço deve ser um número');
        });
    });

    describe('Listagem e Busca', () => {
        test('✅ Deve listar todos os livros', async () => {
            const response = await req(app).get('/livros');
            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });

        test('✅ Deve buscar livro por nome', async () => {
            const response = await req(app).get('/livros/busca?titulo=Senhor');
            expect(response.statusCode).toBe(200);
            expect(response.body.livro.titulo).toMatch(/Senhor/);
            expect(response.body).toHaveProperty('msg', 'Livro encontrado');
        });

        test('❌ Deve retornar 404 se livro não encontrado na busca por nome', async () => {
            const response = await req(app).get('/livros/busca?titulo=Inexistente');
            expect(response.statusCode).toBe(404);
            expect(response.body).toHaveProperty('msg', 'Livro não encontrado');
        });

        test('✅ Deve buscar livro por ID', async () => {
            const response = await req(app).get(`/livros/${livroId}`);
            expect(response.statusCode).toBe(200);
            expect(response.body.livro.id).toBe(livroId);
            expect(response.body).toHaveProperty('msg', 'Livro encontrado');
        });

        test('❌ Deve retornar 404 se ID inexistente', async () => {
            const response = await req(app).get('/livros/9999');
            expect(response.statusCode).toBe(404);
            expect(response.body).toHaveProperty('msg', 'Livro não encontrado');
        });
    });

    describe('Atualização', () => {
        test('✅ Deve atualizar livro por ID', async () => {
            const response = await req(app).put(`/livros/${livroId}`).send({
                titulo: 'O Hobbit',
                autor: 'J.R.R. Tolkien',
                ano_publicacao: 1937,
                genero: 'Fantasia',
                preco: 39.9
            });

            expect(response.statusCode).toBe(200);
            expect(response.body.livro.titulo).toBe('O Hobbit');
            expect(response.body).toHaveProperty('msg', 'Livro atualizado com sucesso');
        });

        test('❌ Não deve atualizar livro com dados inválidos', async () => {
            const response = await req(app).put(`/livros/${livroId}`).send({
                titulo: '',
                autor: '',
                ano_publicacao: 'ano',
                genero: '',
                preco: 'caro'
            });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('msg', 'Dados inválidos para atualização');
        });

        test('❌ Deve retornar 404 ao tentar atualizar livro inexistente', async () => {
            const response = await req(app).put('/livros/9999').send({
                titulo: 'Teste',
                autor: 'Autor',
                ano_publicacao: 2000,
                genero: 'Drama',
                preco: 20.0
            });

            expect(response.statusCode).toBe(404);
            expect(response.body).toHaveProperty('msg', 'Livro não encontrado');
        });
    });

    describe('Exclusão', () => {
        test('✅ Deve deletar livro por ID', async () => {
            const response = await req(app).delete(`/livros/${livroId}`);
            expect(response.statusCode).toBe(204);
            expect(response.body).toHaveProperty('msg', 'Livro deletado com sucesso');
        });

        test('❌ Deve retornar 404 ao tentar deletar livro inexistente', async () => {
            const response = await req(app).delete('/livros/9999');
            expect(response.statusCode).toBe(404);
            expect(response.body).toHaveProperty('msg', 'Livro não encontrado');
        });
    });
});