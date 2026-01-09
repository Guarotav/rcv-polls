const db = require("./db");
const { User, Poll, PollOption, Ballot } = require("./index");

const seed = async () => {
  try {
    db.logging = false;
    await db.sync({ force: true }); // Drop and recreate tables

    const users = await User.bulkCreate([
      { username: "admin", passwordHash: User.hashPassword("admin123") },
      { username: "alice", passwordHash: User.hashPassword("alice123") },
      { username: "bob", passwordHash: User.hashPassword("bob123") },
      { username: "charlie", passwordHash: User.hashPassword("charlie123") },
      { username: "diana", passwordHash: User.hashPassword("diana123") },
      { username: "eve", passwordHash: User.hashPassword("eve123") },
      { username: "frank", passwordHash: User.hashPassword("frank123") },
      { username: "grace", passwordHash: User.hashPassword("grace123") },
      { username: "henry", passwordHash: User.hashPassword("henry123") },
      { username: "ivy", passwordHash: User.hashPassword("ivy123") },
      { username: "jack", passwordHash: User.hashPassword("jack123") },
      { username: "kate", passwordHash: User.hashPassword("kate123") },
      { username: "leo", passwordHash: User.hashPassword("leo123") },
      { username: "mia", passwordHash: User.hashPassword("mia123") },
      { username: "nick", passwordHash: User.hashPassword("nick123") },
      { username: "olivia", passwordHash: User.hashPassword("olivia123") },
      { username: "peter", passwordHash: User.hashPassword("peter123") },
      { username: "quinn", passwordHash: User.hashPassword("quinn123") },
      { username: "rachel", passwordHash: User.hashPassword("rachel123") },
      { username: "sam", passwordHash: User.hashPassword("sam123") },
    ]);

    console.log(`👤 Created ${users.length} users`);

    // Draft poll #1 (only visible to creator - alice)
    const draftPoll1 = await Poll.create({
      title: "Draft: Best Programming Language",
      description:
        "Choosing the best language for web development. Still deciding on options.",
      status: "draft",
      creatorId: users[1].id, // alice
    });

    await PollOption.bulkCreate([
      { text: "JavaScript", pollId: draftPoll1.id },
      { text: "Python", pollId: draftPoll1.id },
      { text: "Go", pollId: draftPoll1.id },
    ]);

    console.log(`📝 Created draft poll: "${draftPoll1.title}"`);

    // Draft poll #2 (only visible to creator - admin)
    const draftPoll2 = await Poll.create({
      title: "Draft: Team Lunch Preferences",
      description: "Where should we eat for team lunch next week?",
      status: "draft",
      creatorId: users[0].id, // admin
    });

    await PollOption.bulkCreate([
      { text: "Italian Restaurant", pollId: draftPoll2.id },
      { text: "Sushi Bar", pollId: draftPoll2.id },
      { text: "Burgers & Fries", pollId: draftPoll2.id },
      { text: "Vegan Café", pollId: draftPoll2.id },
    ]);

    console.log(`📝 Created draft poll: "${draftPoll2.title}"`);

    // Active poll #1 - Pizza Toppings
    const activePoll1 = await Poll.create({
      title: "Favorite Pizza Topping",
      description: "What's your favorite pizza topping? Vote now!",
      status: "active",
      creatorId: users[1].id, // alice
      activatedAt: new Date(Date.now() - 3600000), // 1 hour ago
      endDate: new Date(Date.now() + 86400000), // 24 hours from now
      slug: "favorite-pizza-topping",
    });

    const activePoll1Options = await PollOption.bulkCreate([
      { text: "Pepperoni", pollId: activePoll1.id },
      { text: "Mushrooms", pollId: activePoll1.id },
      { text: "Olives", pollId: activePoll1.id },
      { text: "Pineapple", pollId: activePoll1.id },
      { text: "Sausage", pollId: activePoll1.id },
    ]);

    // Create ballots for active poll #1
    await Ballot.bulkCreate([
      {
        userId: users[0].id, // admin
        pollId: activePoll1.id,
        rankedChoices: [
          activePoll1Options[0].id, // Pepperoni (1st)
          activePoll1Options[1].id, // Mushrooms (2nd)
          activePoll1Options[4].id, // Sausage (3rd)
        ],
      },
      {
        userId: users[2].id, // bob
        pollId: activePoll1.id,
        rankedChoices: [
          activePoll1Options[1].id, // Mushrooms (1st)
          activePoll1Options[0].id, // Pepperoni (2nd)
          activePoll1Options[3].id, // Pineapple (3rd)
        ],
      },
      {
        userId: users[3].id, // charlie
        pollId: activePoll1.id,
        rankedChoices: [
          activePoll1Options[4].id, // Sausage (1st)
          activePoll1Options[0].id, // Pepperoni (2nd)
          activePoll1Options[1].id, // Mushrooms (3rd)
        ],
      },
      {
        userId: users[4].id, // diana
        pollId: activePoll1.id,
        rankedChoices: [
          activePoll1Options[3].id, // Pineapple (1st)
          activePoll1Options[2].id, // Olives (2nd)
          activePoll1Options[1].id, // Mushrooms (3rd)
        ],
      },
    ]);

    console.log(
      `✅ Created active poll: "${activePoll1.title}" with 4 ballots`
    );

    // Closed poll - Movie Genre (completed poll with votes)
    const closedPoll = await Poll.create({
      title: "Best Movie Genre",
      description: "This poll has been closed. Results are in!",
      status: "closed",
      creatorId: users[0].id, // admin
      activatedAt: new Date(Date.now() - 86400000), // 1 day ago
      endDate: new Date(Date.now() - 43200000), // 12 hours ago
      slug: "best-movie-genre",
    });

    const closedPollOptions = await PollOption.bulkCreate([
      { text: "Action", pollId: closedPoll.id },
      { text: "Comedy", pollId: closedPoll.id },
      { text: "Drama", pollId: closedPoll.id },
      { text: "Sci-Fi", pollId: closedPoll.id },
      { text: "Thriller", pollId: closedPoll.id },
    ]);

    // Create ballots for closed poll - distributed to create multiple IRV rounds
    // Options: Action(0), Comedy(1), Drama(2), Sci-Fi(3), Thriller(4)
    // Distribution designed so no one has majority, requiring elimination rounds
    await Ballot.bulkCreate([
      // Thriller supporters (will be eliminated first - 3 votes)
      {
        userId: users[1].id, // alice
        pollId: closedPoll.id,
        rankedChoices: [
          closedPollOptions[4].id, // Thriller (1st)
          closedPollOptions[2].id, // Drama (2nd)
          closedPollOptions[1].id, // Comedy (3rd)
          closedPollOptions[0].id, // Action (4th)
          closedPollOptions[3].id, // Sci-Fi (5th)
        ],
      },
      {
        userId: users[6].id, // frank
        pollId: closedPoll.id,
        rankedChoices: [
          closedPollOptions[4].id, // Thriller (1st)
          closedPollOptions[0].id, // Action (2nd)
          closedPollOptions[3].id, // Sci-Fi (3rd)
        ],
      },
      {
        userId: users[7].id, // grace
        pollId: closedPoll.id,
        rankedChoices: [
          closedPollOptions[4].id, // Thriller (1st)
          closedPollOptions[1].id, // Comedy (2nd)
          closedPollOptions[2].id, // Drama (3rd)
        ],
      },
      // Comedy supporters (will be eliminated second - 4 votes)
      {
        userId: users[2].id, // bob
        pollId: closedPoll.id,
        rankedChoices: [
          closedPollOptions[1].id, // Comedy (1st)
          closedPollOptions[2].id, // Drama (2nd)
          closedPollOptions[0].id, // Action (3rd)
        ],
      },
      {
        userId: users[8].id, // henry
        pollId: closedPoll.id,
        rankedChoices: [
          closedPollOptions[1].id, // Comedy (1st)
          closedPollOptions[3].id, // Sci-Fi (2nd)
          closedPollOptions[2].id, // Drama (3rd)
        ],
      },
      {
        userId: users[9].id, // ivy
        pollId: closedPoll.id,
        rankedChoices: [
          closedPollOptions[1].id, // Comedy (1st)
          closedPollOptions[0].id, // Action (2nd)
          closedPollOptions[4].id, // Thriller (3rd)
        ],
      },
      {
        userId: users[10].id, // jack
        pollId: closedPoll.id,
        rankedChoices: [
          closedPollOptions[1].id, // Comedy (1st)
          closedPollOptions[2].id, // Drama (2nd)
          closedPollOptions[3].id, // Sci-Fi (3rd)
        ],
      },
      // Action supporters (will be eliminated third - 5 votes)
      {
        userId: users[3].id, // charlie
        pollId: closedPoll.id,
        rankedChoices: [
          closedPollOptions[0].id, // Action (1st)
          closedPollOptions[3].id, // Sci-Fi (2nd)
          closedPollOptions[2].id, // Drama (3rd)
        ],
      },
      {
        userId: users[11].id, // kate
        pollId: closedPoll.id,
        rankedChoices: [
          closedPollOptions[0].id, // Action (1st)
          closedPollOptions[4].id, // Thriller (2nd)
          closedPollOptions[1].id, // Comedy (3rd)
        ],
      },
      {
        userId: users[12].id, // leo
        pollId: closedPoll.id,
        rankedChoices: [
          closedPollOptions[0].id, // Action (1st)
          closedPollOptions[2].id, // Drama (2nd)
          closedPollOptions[3].id, // Sci-Fi (3rd)
        ],
      },
      {
        userId: users[13].id, // mia
        pollId: closedPoll.id,
        rankedChoices: [
          closedPollOptions[0].id, // Action (1st)
          closedPollOptions[3].id, // Sci-Fi (2nd)
          closedPollOptions[1].id, // Comedy (3rd)
        ],
      },
      {
        userId: users[14].id, // nick
        pollId: closedPoll.id,
        rankedChoices: [
          closedPollOptions[0].id, // Action (1st)
          closedPollOptions[2].id, // Drama (2nd)
          closedPollOptions[4].id, // Thriller (3rd)
        ],
      },
      // Drama supporters - 6 votes (will compete in final round)
      {
        userId: users[4].id, // diana
        pollId: closedPoll.id,
        rankedChoices: [
          closedPollOptions[2].id, // Drama (1st)
          closedPollOptions[1].id, // Comedy (2nd)
          closedPollOptions[0].id, // Action (3rd)
        ],
      },
      {
        userId: users[15].id, // olivia
        pollId: closedPoll.id,
        rankedChoices: [
          closedPollOptions[2].id, // Drama (1st)
          closedPollOptions[3].id, // Sci-Fi (2nd)
          closedPollOptions[0].id, // Action (3rd)
        ],
      },
      {
        userId: users[16].id, // peter
        pollId: closedPoll.id,
        rankedChoices: [
          closedPollOptions[2].id, // Drama (1st)
          closedPollOptions[0].id, // Action (2nd)
          closedPollOptions[1].id, // Comedy (3rd)
        ],
      },
      {
        userId: users[17].id, // quinn
        pollId: closedPoll.id,
        rankedChoices: [
          closedPollOptions[2].id, // Drama (1st)
          closedPollOptions[4].id, // Thriller (2nd)
          closedPollOptions[3].id, // Sci-Fi (3rd)
        ],
      },
      {
        userId: users[18].id, // rachel
        pollId: closedPoll.id,
        rankedChoices: [
          closedPollOptions[2].id, // Drama (1st)
          closedPollOptions[1].id, // Comedy (2nd)
          closedPollOptions[3].id, // Sci-Fi (3rd)
        ],
      },
      {
        userId: users[19].id, // sam
        pollId: closedPoll.id,
        rankedChoices: [
          closedPollOptions[2].id, // Drama (1st)
          closedPollOptions[3].id, // Sci-Fi (2nd)
          closedPollOptions[0].id, // Action (3rd)
        ],
      },
      // Sci-Fi supporters - 6 votes (will compete in final round)
      {
        userId: users[5].id, // eve
        pollId: closedPoll.id,
        rankedChoices: [
          closedPollOptions[3].id, // Sci-Fi (1st)
          closedPollOptions[2].id, // Drama (2nd)
          closedPollOptions[0].id, // Action (3rd)
        ],
      },
      {
        userId: users[0].id, // admin
        pollId: closedPoll.id,
        rankedChoices: [
          closedPollOptions[3].id, // Sci-Fi (1st)
          closedPollOptions[0].id, // Action (2nd)
          closedPollOptions[2].id, // Drama (3rd)
        ],
      },
    ]);

    console.log(
      `🔒 Created closed poll: "${closedPoll.title}" with 20 ballots (multi-round IRV)`
    );

    // Active poll #3 - Work Environment
    const activePoll3 = await Poll.create({
      title: "Preferred Work Environment",
      description: "Where do you prefer to work? Remote, office, or hybrid?",
      status: "active",
      creatorId: users[3].id, // charlie
      activatedAt: new Date(Date.now() - 1800000), // 30 minutes ago
      endDate: new Date(Date.now() + 172800000), // 48 hours from now
      slug: "preferred-work-environment",
    });

    const activePoll3Options = await PollOption.bulkCreate([
      { text: "Remote", pollId: activePoll3.id },
      { text: "Office", pollId: activePoll3.id },
      { text: "Hybrid", pollId: activePoll3.id },
    ]);

    await Ballot.bulkCreate([
      {
        userId: users[0].id, // admin
        pollId: activePoll3.id,
        rankedChoices: [
          activePoll3Options[0].id, // Remote (1st)
          activePoll3Options[2].id, // Hybrid (2nd)
          activePoll3Options[1].id, // Office (3rd)
        ],
      },
      {
        userId: users[1].id, // alice
        pollId: activePoll3.id,
        rankedChoices: [
          activePoll3Options[2].id, // Hybrid (1st)
          activePoll3Options[0].id, // Remote (2nd)
          activePoll3Options[1].id, // Office (3rd)
        ],
      },
    ]);

    console.log(
      `✅ Created active poll: "${activePoll3.title}" with 2 ballots`
    );

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
