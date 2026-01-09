const express = require("express");
const jwt = require("jsonwebtoken");
const { Poll, PollOption, Ballot, User } = require("../database");

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

// Helper function to generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);
};

// POST /polls - Create a new poll (draft or active)
router.post("/", authenticateJWT, async (req, res) => {
  try {
    const { title, description, options, endDate, status } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!title || !title.trim()) {
      return res.status(400).send({ error: "Poll title is required" });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return res
        .status(400)
        .send({ error: "Poll must have at least 2 options" });
    }

    const validOptions = options.filter(
      (opt) => typeof opt === "string" && opt.trim()
    );
    if (validOptions.length < 2) {
      return res
        .status(400)
        .send({ error: "All options must be non-empty strings" });
    }

    // Determine poll status (default: draft)
    const pollStatus = status === "active" ? "active" : "draft";
    const now = new Date();

    // Create poll with transaction
    const poll = await Poll.create({
      title: title.trim(),
      description: description ? description.trim() : null,
      status: pollStatus,
      creatorId: userId,
      endDate: endDate || null,
      activatedAt: pollStatus === "active" ? now : null,
      slug: pollStatus === "active" ? generateSlug(title.trim()) : null,
    });

    // Create poll options
    const pollOptions = await Promise.all(
      validOptions.map((optionText) =>
        PollOption.create({
          text: optionText.trim(),
          pollId: poll.id,
        })
      )
    );

    // Return poll with options
    res.status(201).send({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      status: poll.status,
      creatorId: poll.creatorId,
      endDate: poll.endDate,
      activatedAt: poll.activatedAt,
      slug: poll.slug,
      pollOptions: pollOptions,
    });
  } catch (error) {
    console.error("Error creating poll:", error);
    res.status(500).send({ error: "Failed to create poll" });
  }
});

// GET /polls/:id - Get a specific poll
// GET /my-polls - Get all polls created by authenticated user
router.get("/my-polls", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    const polls = await Poll.findAll({
      where: { creatorId: userId },
      include: [{ model: PollOption, as: "options" }],
      order: [["createdAt", "DESC"]],
    });

    res.send(polls);
  } catch (error) {
    console.error("Error fetching user polls:", error);
    res.status(500).send({ error: "Failed to fetch polls" });
  }
});

// GET /polls/vote/:id - Get a specific poll by ID for voting (public, no auth required)
router.get("/vote/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const poll = await Poll.findByPk(id, {
      include: [{ model: PollOption, as: "options" }],
    });

    if (!poll) {
      return res.status(404).send({ error: "Poll not found" });
    }

    // Only active polls can be accessed via public vote link
    if (poll.status !== "active") {
      return res
        .status(403)
        .send({ error: "This poll is not currently available for voting" });
    }

    res.send({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      status: poll.status,
      creatorId: poll.creatorId,
      activatedAt: poll.activatedAt,
      slug: poll.slug,
      endDate: poll.endDate,
      pollOptions: poll.options || [],
    });
  } catch (error) {
    console.error("Error fetching poll:", error);
    res.status(500).send({ error: "Failed to fetch poll" });
  }
});

// GET /polls/:id - Get a specific poll
router.get("/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const poll = await Poll.findByPk(id, {
      include: [{ model: PollOption, as: "options" }],
    });

    if (!poll) {
      return res.status(404).send({ error: "Poll not found" });
    }

    // Check visibility: draft polls only visible to creator, others visible to all authenticated users
    if (poll.status === "draft" && poll.creatorId !== userId) {
      return res
        .status(403)
        .send({ error: "You do not have permission to view this poll" });
    }

    res.send({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      status: poll.status,
      creatorId: poll.creatorId,
      activatedAt: poll.activatedAt,
      slug: poll.slug,
      endDate: poll.endDate,
      pollOptions: poll.options || [],
    });
  } catch (error) {
    console.error("Error fetching poll:", error);
    res.status(500).send({ error: "Failed to fetch poll" });
  }
});

// PATCH /polls/:id - Update a draft poll
router.patch("/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, options } = req.body;
    const userId = req.user.id;

    const poll = await Poll.findByPk(id, {
      include: [{ model: PollOption, as: "options" }],
    });

    if (!poll) {
      return res.status(404).send({ error: "Poll not found" });
    }

    // Check authorization: only creator can edit
    if (poll.creatorId !== userId) {
      return res
        .status(403)
        .send({ error: "You do not have permission to edit this poll" });
    }

    // Check poll status: only draft polls can be edited
    if (poll.status !== "draft") {
      return res.status(400).send({ error: "Only draft polls can be edited" });
    }

    // Validate input
    if (title !== undefined) {
      if (!title || !title.trim()) {
        return res.status(400).send({ error: "Poll title is required" });
      }
      poll.title = title.trim();
    }

    if (description !== undefined) {
      poll.description = description ? description.trim() : null;
    }

    // Handle options update
    if (Array.isArray(options)) {
      if (options.length < 2) {
        return res
          .status(400)
          .send({ error: "Poll must have at least 2 options" });
      }

      const validOptions = options.filter(
        (opt) =>
          (typeof opt === "string" && opt.trim()) ||
          (typeof opt === "object" && opt.text && opt.text.trim())
      );

      if (validOptions.length < 2) {
        return res.status(400).send({ error: "All options must be non-empty" });
      }

      // Delete existing options
      await PollOption.destroy({ where: { pollId: poll.id } });

      // Create new options
      const newOptions = await Promise.all(
        validOptions.map((opt) => {
          const text = typeof opt === "string" ? opt : opt.text;
          return PollOption.create({
            text: text.trim(),
            pollId: poll.id,
          });
        })
      );

      // Attach options for response consistency
      poll.options = newOptions;
    }

    await poll.save();

    res.send({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      status: poll.status,
      creatorId: poll.creatorId,
      slug: poll.slug,
      pollOptions: poll.options || [],
    });
  } catch (error) {
    console.error("Error updating poll:", error);
    res.status(500).send({ error: "Failed to update poll" });
  }
});

// PATCH /polls/:id/publish - Publish a draft poll
router.patch("/:id/publish", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const poll = await Poll.findByPk(id, {
      include: [{ model: PollOption, as: "options" }],
    });

    if (!poll) {
      return res.status(404).send({ error: "Poll not found" });
    }

    // Check authorization: only creator can publish
    if (poll.creatorId !== userId) {
      return res
        .status(403)
        .send({ error: "You do not have permission to publish this poll" });
    }

    // Check poll status: only draft polls can be published
    if (poll.status !== "draft") {
      return res
        .status(400)
        .send({ error: "Only draft polls can be published" });
    }

    // Check minimum requirements
    if (!poll.options || poll.options.length < 2) {
      return res
        .status(400)
        .send({ error: "Poll must have at least 2 options to publish" });
    }

    // Activate poll
    poll.activate();
    await poll.save();

    res.send({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      status: poll.status,
      creatorId: poll.creatorId,
      activatedAt: poll.activatedAt,
      slug: poll.slug,
      pollOptions: poll.options,
    });
  } catch (error) {
    console.error("Error publishing poll:", error);
    res.status(500).send({ error: "Failed to publish poll" });
  }
});

// GET /polls/:id/ballots - Get all ballots for a poll
// Permissions:
// - Closed polls: anyone can view
// - Active polls: only owner can view
router.get("/:id/ballots", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const poll = await Poll.findByPk(id);

    if (!poll) {
      return res.status(404).send({ error: "Poll not found" });
    }

    // For active polls, only owner can view ballots
    if (poll.status === "active" && poll.creatorId !== userId) {
      return res.status(403).send({
        error: "Only the poll owner can view results for active polls",
      });
    }

    // Closed polls can be viewed by anyone

    // Fetch all ballots for this poll
    const ballots = await Ballot.findAll({
      where: { pollId: id },
      order: [["createdAt", "ASC"]],
    });

    res.send(ballots);
  } catch (error) {
    console.error("Error fetching ballots:", error);
    res.status(500).send({ error: "Failed to fetch ballots" });
  }
});

// DELETE /polls/:id - Delete a poll and cascade delete options and ballots
router.delete("/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const poll = await Poll.findByPk(id);

    if (!poll) {
      return res.status(404).send({ error: "Poll not found" });
    }

    // Check authorization: only creator can delete
    if (poll.creatorId !== userId) {
      return res
        .status(403)
        .send({ error: "You do not have permission to delete this poll" });
    }

    // Delete cascade: ballots → options → poll
    await Ballot.destroy({ where: { pollId: poll.id } });
    await PollOption.destroy({ where: { pollId: poll.id } });
    await poll.destroy();

    res.send({ message: "Poll deleted successfully" });
  } catch (error) {
    console.error("Error deleting poll:", error);
    res.status(500).send({ error: "Failed to delete poll" });
  }
});

module.exports = router;
