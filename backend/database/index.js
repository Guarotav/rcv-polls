const db = require("./db");
const User = require("./user");
const Poll = require("./poll");
const PollOption = require("./pollOption");
const Ballot = require("./ballot");

// Define relationships
// User hasMany Poll (as creator, required)
User.hasMany(Poll, { foreignKey: "creatorId", as: "polls" });
Poll.belongsTo(User, { foreignKey: "creatorId", as: "creator" });

// User hasMany Ballot
User.hasMany(Ballot, { foreignKey: "userId", as: "ballots" });

// Poll hasMany PollOption
Poll.hasMany(PollOption, { foreignKey: "pollId", as: "options" });
PollOption.belongsTo(Poll, { foreignKey: "pollId", as: "poll" });

// Poll hasMany Ballot
Poll.hasMany(Ballot, { foreignKey: "pollId", as: "ballots" });

// Ballot belongsTo User (required)
Ballot.belongsTo(User, { foreignKey: "userId", as: "user" });

// Ballot belongsTo Poll
Ballot.belongsTo(Poll, { foreignKey: "pollId", as: "poll" });

module.exports = {
  db,
  User,
  Poll,
  PollOption,
  Ballot,
};
