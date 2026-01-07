const { DataTypes } = require("sequelize");
const db = require("./db");

const Ballot = db.define(
  "ballot",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: true,
      },
    },
    pollId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: true,
      },
    },
    rankedChoices: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "rankedChoices must not be empty",
        },
        isArray(value) {
          if (!Array.isArray(value)) {
            throw new Error("rankedChoices must be an array");
          }
        },
      },
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["userId", "pollId"],
        name: "unique_user_poll",
      },
    ],
  }
);

module.exports = Ballot;
