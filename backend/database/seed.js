const db = require("./db");
const { User, Poll, PollOption, Ballot } = require("./index");

const seed = async () => {
  try {
    db.logging = false;
    await db.sync({ force: true }); // Drop and recreate tables

    const users = await User.bulkCreate([
      { username: "admin", passwordHash: User.hashPassword("admin123") },
      { username: "user1", passwordHash: User.hashPassword("user111") },
      { username: "user2", passwordHash: User.hashPassword("user222") },
    ]);

    console.log(`👤 Created ${users.length} users`);

    // Create draft poll (only visible to creator)
    const draftPoll = await Poll.create({
      title: "Draft: Favorite Programming Language",
      description: "This is a draft poll that only the creator can see",
      status: "draft",
      creatorId: users[0].id, // admin
    });

    await PollOption.bulkCreate([
      { text: "JavaScript", pollId: draftPoll.id },
      { text: "Python", pollId: draftPoll.id },
      { text: "Java", pollId: draftPoll.id },
    ]);

    console.log(`📝 Created draft poll: "${draftPoll.title}"`);

    // Create active poll (visible to all, can receive ballots)
    const activePoll = await Poll.create({
      title: "Best Pizza Topping",
      description: "What's your favorite pizza topping?",
      status: "draft",
      creatorId: users[1].id, // user1
    });

    const activePollOptions = await PollOption.bulkCreate([
      { text: "Pepperoni", pollId: activePoll.id },
      { text: "Mushrooms", pollId: activePoll.id },
      { text: "Olives", pollId: activePoll.id },
      { text: "Pineapple", pollId: activePoll.id },
    ]);

    // Activate the poll
    activePoll.activate();
    await activePoll.save();

    // Create ballots for the active poll
    await Ballot.bulkCreate([
      {
        userId: users[0].id, // admin
        pollId: activePoll.id,
        rankedChoices: [
          activePollOptions[0].id, // Pepperoni (1st choice)
          activePollOptions[1].id, // Mushrooms (2nd choice)
          activePollOptions[2].id, // Olives (3rd choice)
        ],
      },
      {
        userId: users[2].id, // user2
        pollId: activePoll.id,
        rankedChoices: [
          activePollOptions[1].id, // Mushrooms (1st choice)
          activePollOptions[0].id, // Pepperoni (2nd choice)
          activePollOptions[3].id, // Pineapple (3rd choice)
        ],
      },
    ]);

    console.log(`✅ Created active poll: "${activePoll.title}" with ballots`);

    // Create closed poll (visible to all, no new ballots)
    const closedPoll = await Poll.create({
      title: "Best Movie Genre",
      description: "This poll has been closed",
      status: "draft",
      creatorId: users[0].id, // admin
      endDate: new Date(Date.now() - 86400000), // Yesterday
    });

    const closedPollOptions = await PollOption.bulkCreate([
      { text: "Action", pollId: closedPoll.id },
      { text: "Comedy", pollId: closedPoll.id },
      { text: "Drama", pollId: closedPoll.id },
      { text: "Sci-Fi", pollId: closedPoll.id },
    ]);

    // Activate then close the poll
    closedPoll.activate();
    await closedPoll.save();

    // Create some ballots before closing
    await Ballot.bulkCreate([
      {
        userId: users[1].id, // user1
        pollId: closedPoll.id,
        rankedChoices: [
          closedPollOptions[2].id, // Drama (1st choice)
          closedPollOptions[1].id, // Comedy (2nd choice)
          closedPollOptions[0].id, // Action (3rd choice)
        ],
      },
      {
        userId: users[2].id, // user2
        pollId: closedPoll.id,
        rankedChoices: [
          closedPollOptions[3].id, // Sci-Fi (1st choice)
          closedPollOptions[0].id, // Action (2nd choice)
          closedPollOptions[2].id, // Drama (3rd choice)
        ],
      },
    ]);

    // Close the poll
    closedPoll.close();
    await closedPoll.save();

    console.log(`🔒 Created closed poll: "${closedPoll.title}" with ballots`);

    // Create another active poll with more options
    const activePoll2 = await Poll.create({
      title: "Preferred Work Environment",
      description: "Where do you prefer to work?",
      status: "draft",
      creatorId: users[2].id, // user2
    });

    const activePoll2Options = await PollOption.bulkCreate([
      { text: "Remote", pollId: activePoll2.id },
      { text: "Office", pollId: activePoll2.id },
      { text: "Hybrid", pollId: activePoll2.id },
    ]);

    activePoll2.activate();
    await activePoll2.save();

    await Ballot.create({
      userId: users[0].id, // admin
      pollId: activePoll2.id,
      rankedChoices: [
        activePoll2Options[0].id, // Remote (1st choice)
        activePoll2Options[2].id, // Hybrid (2nd choice)
        activePoll2Options[1].id, // Office (3rd choice)
      ],
    });

    console.log(`✅ Created active poll: "${activePoll2.title}" with ballot`);

    console.log("🌱 Seeded the database");
  } catch (error) {
    console.error("Error seeding database:", error);
    if (error.message.includes("does not exist")) {
      console.log("\n🤔🤔🤔 Have you created your database??? 🤔🤔🤔");
    }
  }
  db.close();
};

seed();
