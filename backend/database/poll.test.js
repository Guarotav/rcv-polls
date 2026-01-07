const Poll = require("./poll");
const { db } = require("./index");

describe("Poll Instance Methods", () => {
  beforeAll(async () => {
    // Sync database before tests
    await db.sync({ force: false });
  });

  afterAll(async () => {
    // Close database connection after tests
    await db.close();
  });

  describe("activate()", () => {
    it("should set status to 'active'", async () => {
      const poll = Poll.build({
        title: "Test Poll",
        status: "draft",
        creatorId: 1,
      });

      poll.activate();

      expect(poll.status).toBe("active");
    });

    it("should set activatedAt timestamp", async () => {
      const poll = Poll.build({
        title: "Test Poll",
        status: "draft",
        creatorId: 1,
      });

      const beforeActivation = new Date();
      poll.activate();
      const afterActivation = new Date();

      expect(poll.activatedAt).toBeInstanceOf(Date);
      expect(poll.activatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeActivation.getTime()
      );
      expect(poll.activatedAt.getTime()).toBeLessThanOrEqual(
        afterActivation.getTime()
      );
    });

    it("should generate shareableId if not already set", () => {
      const poll = Poll.build({
        title: "Test Poll",
        status: "draft",
        creatorId: 1,
      });

      expect(poll.shareableId).toBeUndefined();

      poll.activate();

      expect(poll.shareableId).toBeDefined();
      expect(typeof poll.shareableId).toBe("string");
      expect(poll.shareableId.length).toBeGreaterThan(0);
    });

    it("should not overwrite existing shareableId", () => {
      const existingShareableId = "existing-id-123";
      const poll = Poll.build({
        title: "Test Poll",
        status: "draft",
        creatorId: 1,
        shareableId: existingShareableId,
      });

      poll.activate();

      expect(poll.shareableId).toBe(existingShareableId);
    });

    it("should return the poll instance for chaining", () => {
      const poll = Poll.build({
        title: "Test Poll",
        status: "draft",
        creatorId: 1,
      });

      const result = poll.activate();

      expect(result).toBe(poll);
    });
  });

  describe("close()", () => {
    it("should set status to 'closed'", () => {
      const poll = Poll.build({
        title: "Test Poll",
        status: "active",
        creatorId: 1,
      });

      poll.close();

      expect(poll.status).toBe("closed");
    });

    it("should work from 'active' status", () => {
      const poll = Poll.build({
        title: "Test Poll",
        status: "active",
        creatorId: 1,
      });

      poll.close();

      expect(poll.status).toBe("closed");
    });

    it("should work from 'draft' status", () => {
      const poll = Poll.build({
        title: "Test Poll",
        status: "draft",
        creatorId: 1,
      });

      poll.close();

      expect(poll.status).toBe("closed");
    });

    it("should return the poll instance for chaining", () => {
      const poll = Poll.build({
        title: "Test Poll",
        status: "active",
        creatorId: 1,
      });

      const result = poll.close();

      expect(result).toBe(poll);
    });
  });

  describe("canEdit()", () => {
    it("should return true when status is 'draft'", () => {
      const poll = Poll.build({
        title: "Test Poll",
        status: "draft",
        creatorId: 1,
      });

      expect(poll.canEdit()).toBe(true);
    });

    it("should return false when status is 'active'", () => {
      const poll = Poll.build({
        title: "Test Poll",
        status: "active",
        creatorId: 1,
      });

      expect(poll.canEdit()).toBe(false);
    });

    it("should return false when status is 'closed'", () => {
      const poll = Poll.build({
        title: "Test Poll",
        status: "closed",
        creatorId: 1,
      });

      expect(poll.canEdit()).toBe(false);
    });
  });

  describe("isVisibleTo()", () => {
    it("should return true for draft poll when userId matches creatorId", () => {
      const creatorId = 1;
      const poll = Poll.build({
        title: "Test Poll",
        status: "draft",
        creatorId: creatorId,
      });

      expect(poll.isVisibleTo(creatorId)).toBe(true);
    });

    it("should return false for draft poll when userId does not match creatorId", () => {
      const poll = Poll.build({
        title: "Test Poll",
        status: "draft",
        creatorId: 1,
      });

      expect(poll.isVisibleTo(2)).toBe(false);
      expect(poll.isVisibleTo(999)).toBe(false);
    });

    it("should return true for active poll for any userId", () => {
      const poll = Poll.build({
        title: "Test Poll",
        status: "active",
        creatorId: 1,
      });

      expect(poll.isVisibleTo(1)).toBe(true);
      expect(poll.isVisibleTo(2)).toBe(true);
      expect(poll.isVisibleTo(999)).toBe(true);
    });

    it("should return true for closed poll for any userId", () => {
      const poll = Poll.build({
        title: "Test Poll",
        status: "closed",
        creatorId: 1,
      });

      expect(poll.isVisibleTo(1)).toBe(true);
      expect(poll.isVisibleTo(2)).toBe(true);
      expect(poll.isVisibleTo(999)).toBe(true);
    });

    it("should handle null userId for draft polls", () => {
      const poll = Poll.build({
        title: "Test Poll",
        status: "draft",
        creatorId: 1,
      });

      expect(poll.isVisibleTo(null)).toBe(false);
    });

    it("should handle null userId for active polls", () => {
      const poll = Poll.build({
        title: "Test Poll",
        status: "active",
        creatorId: 1,
      });

      expect(poll.isVisibleTo(null)).toBe(true);
    });
  });
});
