const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const Livro = sequelize.define(
  "Livro",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 100],
        notEmpty: true,
      },
    },
    autor: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [3, 100],
        notEmpty: true,
      },
    },
    ano_publicacao: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        isInt: true,
      },
    },
    genero: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    preco: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0.01,
        isFloat: true,
      },
    },
  },
  {
    tableName: "livros",
    createdAt: "criado_em",
    updatedAt: "atualizado_em",
  }
);

module.exports = Livro;
