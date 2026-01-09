import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import axios from "axios";
import VotePoll from "./VotePoll";

jest.mock("axios");

const mockNavigate = jest.fn();
let mockUseParamsValue = { pollId: "1", slug: null };

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParamsValue,
}));

const mockPoll = {
  id: 1,
  title: "Test Poll",
  description: "This is a test poll description",
  status: "active",
  creatorId: 1,
  slug: "test-poll",
  pollOptions: [
    { id: 1, text: "Option A" },
    { id: 2, text: "Option B" },
    { id: 3, text: "Option C" },
  ],
};

const mockUser = {
  id: 1,
  username: "testuser",
};

const renderWithRouter = (component) => {
  return render(<Router>{component}</Router>);
};

describe("VotePoll Component", () => {
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;

  beforeEach(() => {
    jest.resetAllMocks();
    // Reset to default params (no slug)
    mockUseParamsValue = { pollId: "1", slug: null };

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(),
      },
    });

    // Mock window.alert
    window.alert = jest.fn();

    // Suppress console output during tests
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    // Restore console
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  describe("Loading State", () => {
    it("should show loading message initially", () => {
      axios.get.mockImplementation(() => new Promise(() => {}));
      renderWithRouter(<VotePoll user={mockUser} />);
      expect(screen.getByText("Loading poll...")).toBeInTheDocument();
    });
  });

  describe("Poll Display", () => {
    it("should render poll title after loading", async () => {
      axios.get.mockResolvedValueOnce({ data: mockPoll });
      renderWithRouter(<VotePoll user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText("Test Poll")).toBeInTheDocument();
      });
    });

    it("should render poll description", async () => {
      axios.get.mockResolvedValueOnce({ data: mockPoll });
      renderWithRouter(<VotePoll user={mockUser} />);

      await waitFor(() => {
        expect(
          screen.getByText("This is a test poll description")
        ).toBeInTheDocument();
      });
    });

    it("should render all poll options", async () => {
      axios.get.mockResolvedValueOnce({ data: mockPoll });
      renderWithRouter(<VotePoll user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText("Option A")).toBeInTheDocument();
        expect(screen.getByText("Option B")).toBeInTheDocument();
        expect(screen.getByText("Option C")).toBeInTheDocument();
      });
    });

    it("should render submit vote button", async () => {
      axios.get.mockResolvedValueOnce({ data: mockPoll });
      renderWithRouter(<VotePoll user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText("Submit Vote")).toBeInTheDocument();
      });
    });

    it("should disable submit button when no options selected", async () => {
      axios.get.mockResolvedValueOnce({ data: mockPoll });
      renderWithRouter(<VotePoll user={mockUser} />);

      await waitFor(() => {
        const submitButton = screen.getByText("Submit Vote");
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe("Ranking Options", () => {
    it("should add rank number when option is clicked", async () => {
      axios.get.mockResolvedValueOnce({ data: mockPoll });
      renderWithRouter(<VotePoll user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText("Option A")).toBeInTheDocument();
      });

      const optionA = screen.getByText("Option A").closest(".vote-option");
      fireEvent.click(optionA);

      expect(screen.getByText("#1")).toBeInTheDocument();
    });

    it("should increment rank for each selected option", async () => {
      axios.get.mockResolvedValueOnce({ data: mockPoll });
      renderWithRouter(<VotePoll user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText("Option A")).toBeInTheDocument();
      });

      const optionA = screen.getByText("Option A").closest(".vote-option");
      const optionB = screen.getByText("Option B").closest(".vote-option");
      const optionC = screen.getByText("Option C").closest(".vote-option");

      fireEvent.click(optionA);
      fireEvent.click(optionB);
      fireEvent.click(optionC);

      expect(screen.getByText("#1")).toBeInTheDocument();
      expect(screen.getByText("#2")).toBeInTheDocument();
      expect(screen.getByText("#3")).toBeInTheDocument();
    });

    it("should remove option from ranking when clicked again", async () => {
      axios.get.mockResolvedValueOnce({ data: mockPoll });
      renderWithRouter(<VotePoll user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText("Option A")).toBeInTheDocument();
      });

      const optionA = screen.getByText("Option A").closest(".vote-option");
      fireEvent.click(optionA);
      expect(screen.getByText("#1")).toBeInTheDocument();

      fireEvent.click(optionA);
      expect(screen.queryByText("#1")).not.toBeInTheDocument();
    });

    it("should enable submit button when at least one option is selected", async () => {
      axios.get.mockResolvedValueOnce({ data: mockPoll });
      renderWithRouter(<VotePoll user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText("Option A")).toBeInTheDocument();
      });

      const optionA = screen.getByText("Option A").closest(".vote-option");
      fireEvent.click(optionA);

      const submitButton = screen.getByText("Submit Vote");
      expect(submitButton).not.toBeDisabled();
    });

    it("should add 'selected' class to ranked options", async () => {
      axios.get.mockResolvedValueOnce({ data: mockPoll });
      renderWithRouter(<VotePoll user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText("Option A")).toBeInTheDocument();
      });

      const optionA = screen.getByText("Option A").closest(".vote-option");
      fireEvent.click(optionA);

      expect(optionA).toHaveClass("selected");
    });
  });

  describe("Vote Submission", () => {
    it("should submit vote successfully", async () => {
      axios.get.mockResolvedValueOnce({ data: mockPoll });
      axios.post.mockResolvedValueOnce({ data: { id: 1, rankedChoices: [1] } });

      renderWithRouter(<VotePoll user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText("Option A")).toBeInTheDocument();
      });

      const optionA = screen.getByText("Option A").closest(".vote-option");
      fireEvent.click(optionA);

      const submitButton = screen.getByText("Submit Vote");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining("/api/ballots"),
          expect.objectContaining({
            pollId: "1",
            rankedChoices: [1],
          }),
          expect.objectContaining({ withCredentials: true })
        );
      });
    });

    it("should show 'Submitting...' while submitting", async () => {
      axios.get.mockResolvedValueOnce({ data: mockPoll });
      axios.post.mockImplementation(() => new Promise(() => {}));

      renderWithRouter(<VotePoll user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText("Option A")).toBeInTheDocument();
      });

      const optionA = screen.getByText("Option A").closest(".vote-option");
      fireEvent.click(optionA);

      const submitButton = screen.getByText("Submit Vote");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Submitting...")).toBeInTheDocument();
      });
    });

    it("should show already voted message after successful submission", async () => {
      axios.get.mockResolvedValueOnce({ data: mockPoll });
      axios.post.mockResolvedValueOnce({ data: { id: 1, rankedChoices: [1] } });

      renderWithRouter(<VotePoll user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText("Option A")).toBeInTheDocument();
      });

      const optionA = screen.getByText("Option A").closest(".vote-option");
      fireEvent.click(optionA);

      const submitButton = screen.getByText("Submit Vote");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("✓ You have already voted on this poll")
        ).toBeInTheDocument();
      });
    });

    it("should hide submit button after successful vote", async () => {
      axios.get.mockResolvedValueOnce({ data: mockPoll });
      axios.post.mockResolvedValueOnce({ data: { id: 1, rankedChoices: [1] } });

      renderWithRouter(<VotePoll user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText("Option A")).toBeInTheDocument();
      });

      const optionA = screen.getByText("Option A").closest(".vote-option");
      fireEvent.click(optionA);

      const submitButton = screen.getByText("Submit Vote");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText("Submit Vote")).not.toBeInTheDocument();
      });
    });

    it("should display error message on submission failure", async () => {
      axios.get.mockResolvedValueOnce({ data: mockPoll });
      axios.post.mockRejectedValueOnce({
        response: { data: { error: "Failed to submit vote" } },
      });

      renderWithRouter(<VotePoll user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText("Option A")).toBeInTheDocument();
      });

      const optionA = screen.getByText("Option A").closest(".vote-option");
      fireEvent.click(optionA);

      const submitButton = screen.getByText("Submit Vote");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Failed to submit vote")).toBeInTheDocument();
      });
    });
  });

  describe("User Not Logged In", () => {
    it("should redirect to login when trying to vote without being logged in", async () => {
      axios.get.mockResolvedValueOnce({ data: mockPoll });

      renderWithRouter(<VotePoll user={null} />);

      await waitFor(() => {
        expect(screen.getByText("Option A")).toBeInTheDocument();
      });

      const optionA = screen.getByText("Option A").closest(".vote-option");
      fireEvent.click(optionA);

      const submitButton = screen.getByText("Submit Vote");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          "You must be logged in to vote"
        );
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      });
    });
  });

  describe("Already Voted", () => {
    it("should show existing vote if user has already voted", async () => {
      axios.get
        .mockResolvedValueOnce({ data: mockPoll })
        .mockResolvedValueOnce({ data: { rankedChoices: [1, 2] } });

      renderWithRouter(<VotePoll user={mockUser} />);

      await waitFor(() => {
        expect(
          screen.getByText("✓ You have already voted on this poll")
        ).toBeInTheDocument();
      });
    });

    it("should display previous rankings when user has voted", async () => {
      axios.get
        .mockResolvedValueOnce({ data: mockPoll })
        .mockResolvedValueOnce({ data: { rankedChoices: [1, 2] } });

      renderWithRouter(<VotePoll user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText("#1")).toBeInTheDocument();
        expect(screen.getByText("#2")).toBeInTheDocument();
      });
    });

    it("should not allow changing votes when already voted", async () => {
      axios.get
        .mockResolvedValueOnce({ data: mockPoll })
        .mockResolvedValueOnce({ data: { rankedChoices: [1] } });

      renderWithRouter(<VotePoll user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText("#1")).toBeInTheDocument();
      });

      // Try clicking Option C (not voted for)
      const optionC = screen.getByText("Option C").closest(".vote-option");
      fireEvent.click(optionC);

      // Should still only have #1 (no #2 added)
      expect(screen.queryByText("#2")).not.toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should display not found when poll fetch fails with specific error", async () => {
      axios.get.mockRejectedValueOnce({
        response: { data: { error: "Poll not found" } },
      });

      renderWithRouter(<VotePoll user={mockUser} />);

      // When poll fetch fails, poll is null so component shows the not found message
      await waitFor(() => {
        expect(
          screen.getByText("Poll not found or is no longer available")
        ).toBeInTheDocument();
      });
    });

    it("should show not found when network error occurs", async () => {
      axios.get.mockRejectedValueOnce(new Error("Network error"));

      renderWithRouter(<VotePoll user={mockUser} />);

      // When poll fetch fails, poll is null so component shows the not found message
      await waitFor(() => {
        expect(
          screen.getByText("Poll not found or is no longer available")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Inactive Poll", () => {
    it("should navigate away when poll is not active", async () => {
      const inactivePoll = { ...mockPoll, status: "draft" };
      axios.get.mockResolvedValueOnce({ data: inactivePoll });

      renderWithRouter(<VotePoll user={mockUser} />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });
  });

  describe("No Options", () => {
    it("should show placeholder when poll has no options", async () => {
      const pollWithNoOptions = { ...mockPoll, pollOptions: [] };
      axios.get.mockResolvedValueOnce({ data: pollWithNoOptions });

      renderWithRouter(<VotePoll user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText("No options available")).toBeInTheDocument();
      });
    });
  });

  describe("Poll Not Found", () => {
    it("should show not found message when poll response is null", async () => {
      axios.get.mockResolvedValueOnce({ data: null });

      renderWithRouter(<VotePoll user={mockUser} />);

      // When data is null, the component catches the error and shows the not found message
      await waitFor(() => {
        expect(
          screen.getByText("Poll not found or is no longer available")
        ).toBeInTheDocument();
      });
    });
  });
});

describe("VotePoll Shareable Route", () => {
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;

  beforeEach(() => {
    jest.resetAllMocks();
    // Set params with slug for shareable route
    mockUseParamsValue = { pollId: "1", slug: "test-poll" };

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(),
      },
    });

    // Suppress console output during tests
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    // Restore console
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  it("should show copy link button on shareable route", async () => {
    axios.get.mockResolvedValueOnce({ data: mockPoll });
    renderWithRouter(<VotePoll user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText("📋 Copy Shareable Link")).toBeInTheDocument();
    });
  });

  it("should call clipboard writeText when copy button is clicked", async () => {
    axios.get.mockResolvedValueOnce({ data: mockPoll });
    renderWithRouter(<VotePoll user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText("📋 Copy Shareable Link")).toBeInTheDocument();
    });

    const copyButton = screen.getByText("📋 Copy Shareable Link");
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining("/vote/1/test-poll")
      );
    });
  });

  it("should show success feedback when copy succeeds", async () => {
    axios.get.mockResolvedValueOnce({ data: mockPoll });
    renderWithRouter(<VotePoll user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText("📋 Copy Shareable Link")).toBeInTheDocument();
    });

    const copyButton = screen.getByText("📋 Copy Shareable Link");
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText("Link copied to clipboard!")).toBeInTheDocument();
    });
  });

  it("should show error feedback when copy fails", async () => {
    axios.get.mockResolvedValueOnce({ data: mockPoll });
    navigator.clipboard.writeText.mockRejectedValueOnce(
      new Error("Copy failed")
    );

    renderWithRouter(<VotePoll user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText("📋 Copy Shareable Link")).toBeInTheDocument();
    });

    const copyButton = screen.getByText("📋 Copy Shareable Link");
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to copy link")).toBeInTheDocument();
    });
  });
});
