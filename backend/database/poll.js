const { DataTypes } = require("sequelize");
const db = require("./db");
const { randomBytes } = require("crypto");

const Poll = db.define("poll", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM("draft", "active", "closed"),
    defaultValue: "draft",
    allowNull: false,
    validate: {
      isIn: [["draft", "active", "closed"]],
    },
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  creatorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: true,
    },
  },
  activatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  shareableId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
});

// Instance method to activate poll
Poll.prototype.activate = function () {
  this.status = "active";
  this.activatedAt = new Date();

  // Generate a unique shareableId if not already set
  if (!this.shareableId) {
    // Generate a short, URL-friendly ID (8 characters, base64url encoded)
    const buffer = randomBytes(6);
    this.shareableId = buffer.toString("base64url").substring(0, 8);
  }

  return this;
};

// Instance method to close poll
Poll.prototype.close = function () {
  this.status = "closed";
  return this;
};

// Instance method to check if poll can be edited
Poll.prototype.canEdit = function () {
  return this.status === "draft";
};

// Instance method to check if poll is visible to a user
Poll.prototype.isVisibleTo = function (userId) {
  // Draft polls are only visible to the creator
  if (this.status === "draft") {
    return this.creatorId === userId;
  }
  // Active and closed polls are visible to all authenticated users
  return true;
};

module.exports = Poll;
