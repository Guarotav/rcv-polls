const express = require("express");
const jwt = require("jsonwebtoken");
const { Poll, Ballot } = require("../database");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to authenticate JWT tokens
const authenticateJWT = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).send({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).send({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// POST /ballots - Submit a vote (instant runoff ballot)
router.post("/", authenticateJWT, async (req, res) => {
  try {
    const { pollId, rankedChoices } = req.body;
    const userId = req.user.id;

    // Validate input
    if (
      !pollId ||
      !Array.isArray(rankedChoices) ||
      rankedChoices.length === 0
    ) {
      return res
        .status(400)
        .send({ error: "Poll ID and ranked choices are required" });
    }

    // Check if poll exists and is active
    const poll = await Poll.findByPk(pollId);
    if (!poll) {
      return res.status(404).send({ error: "Poll not found" });
    }

    if (poll.status !== "active") {
      return res.status(400).send({ error: "Poll is not active" });
    }

    // Check if user has already voted
    const existingBallot = await Ballot.findOne({
      where: { userId, pollId },
    });
    if (existingBallot) {
      return res
        .status(400)
        .send({ error: "You have already voted on this poll" });
    }

    // Create ballot with ranked choices
    const ballot = await Ballot.create({
      userId,
      pollId,
      rankedChoices,
    });

    res.status(201).send({
      id: ballot.id,
      pollId: ballot.pollId,
      userId: ballot.userId,
      rankedChoices: ballot.rankedChoices,
      createdAt: ballot.createdAt,
    });
  } catch (error) {
    console.error("Error creating ballot:", error);
    res.status(500).send({ error: "Failed to submit vote" });
  }
});

// GET /ballots/:pollId - Get user's ballot for a specific poll
router.get("/:pollId", authenticateJWT, async (req, res) => {
  try {
    const { pollId } = req.params;
    const userId = req.user.id;

    // Check if poll exists
    const poll = await Poll.findByPk(pollId);
    if (!poll) {
      return res.status(404).send({ error: "Poll not found" });
    }

    // Get user's ballot for this poll
    const ballot = await Ballot.findOne({
      where: { userId, pollId },
    });

    if (!ballot) {
      return res.status(404).send({ error: "No ballot found for this poll" });
    }

    res.send({
      id: ballot.id,
      pollId: ballot.pollId,
      userId: ballot.userId,
      rankedChoices: ballot.rankedChoices,
      createdAt: ballot.createdAt,
    });
  } catch (error) {
    console.error("Error fetching ballot:", error);
    res.status(500).send({ error: "Failed to fetch ballot" });
  }
});

module.exports = router;
