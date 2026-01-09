import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import Results from "./Results";

jest.mock("axios");

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Console suppression to keep test output clean
let originalConsoleError;
let originalConsoleLog;

beforeEach(() => {
  originalConsoleError = console.error;
  originalConsoleLog = console.log;
  console.error = jest.fn();
  console.log = jest.fn();
  jest.resetAllMocks();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

const renderWithRouter = (pollId = "1") => {
  return render(
    <MemoryRouter initialEntries={[`/results/${pollId}`]}>
      <Routes>
        <Route path="/results/:pollId" element={<Results />} />
      </Routes>
    </MemoryRouter>
  );
};

const mockPoll = {
  id: 1,
  title: "Favorite Programming Language",
  description: "Vote for your favorite language",
  status: "closed",
  pollOptions: [
    { id: 1, text: "JavaScript" },
    { id: 2, text: "Python" },
    { id: 3, text: "Rust" },
  ],
};

const mockActivePoll = {
  ...mockPoll,
  status: "active",
};

const mockBallots = [
  { id: 1, rankedChoices: [1, 2, 3] },
  { id: 2, rankedChoices: [1, 3, 2] },
  { id: 3, rankedChoices: [2, 1, 3] },
  { id: 4, rankedChoices: [1, 2, 3] },
];

const mockBallotsWithClearWinner = [
  { id: 1, rankedChoices: [1, 2, 3] },
  { id: 2, rankedChoices: [1, 3, 2] },
  { id: 3, rankedChoices: [1, 2, 3] },
  { id: 4, rankedChoices: [1, 3, 2] },
  { id: 5, rankedChoices: [2, 1, 3] },
];

describe("Results - Loading State", () => {
  it("shows loading spinner while fetching data", () => {
    axios.get.mockImplementation(() => new Promise(() => {}));
    renderWithRouter();
    expect(screen.getByText("Loading results...")).toBeInTheDocument();
  });
});

describe("Results - Closed Poll Display", () => {
  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/ballots")) {
        return Promise.resolve({ data: mockBallots });
      }
      return Promise.resolve({ data: mockPoll });
    });
  });

  it("displays poll title and description", async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(
        screen.getByText("Favorite Programming Language")
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText("Vote for your favorite language")
    ).toBeInTheDocument();
  });

  it("displays vote count", async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("4 votes cast")).toBeInTheDocument();
    });
  });

  it("displays poll status badge", async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("Closed")).toBeInTheDocument();
    });
  });

  it("displays back button that navigates to my-polls", async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("Back to My Polls")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Back to My Polls"));
    expect(mockNavigate).toHaveBeenCalledWith("/my-polls");
  });
});

describe("Results - Winner Display", () => {
  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/ballots")) {
        return Promise.resolve({ data: mockBallotsWithClearWinner });
      }
      return Promise.resolve({ data: mockPoll });
    });
  });

  it("displays winner section when there is a winner", async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("🏆 Winner")).toBeInTheDocument();
    });
  });

  it("displays the winning option text", async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("JavaScript")).toBeInTheDocument();
    });
  });
});

describe("Results - No Votes", () => {
  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/ballots")) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: mockPoll });
    });
  });

  it("displays no votes message when no ballots exist", async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(
        screen.getByText("No votes have been cast yet.")
      ).toBeInTheDocument();
    });
  });

  it("displays 0 votes cast", async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("0 votes cast")).toBeInTheDocument();
    });
  });
});

describe("Results - Active Poll (Owner Access)", () => {
  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/ballots")) {
        return Promise.resolve({ data: mockBallots });
      }
      return Promise.resolve({ data: mockActivePoll });
    });
  });

  it("displays results for active poll when user is owner", async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(
        screen.getByText("Favorite Programming Language")
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});

describe("Results - Active Poll (Non-Owner Access)", () => {
  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/ballots")) {
        return Promise.reject({
          response: { status: 403, data: { error: "Forbidden" } },
        });
      }
      return Promise.resolve({ data: mockActivePoll });
    });
  });

  it("displays permission error for non-owner on active poll", async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(
        screen.getByText(
          "Only the poll owner can view results for active polls"
        )
      ).toBeInTheDocument();
    });
  });

  it("displays back button on permission error", async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("Back to My Polls")).toBeInTheDocument();
    });
  });
});

describe("Results - Error Handling", () => {
  it("displays error message when poll fetch fails", async () => {
    axios.get.mockRejectedValueOnce({
      response: { data: { error: "Poll not found" } },
    });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("Poll not found")).toBeInTheDocument();
    });
  });

  it("displays generic error message when no specific error", async () => {
    axios.get.mockRejectedValueOnce({
      response: {},
    });
    renderWithRouter();
    await waitFor(() => {
      expect(
        screen.getByText("Failed to load results. Please try again.")
      ).toBeInTheDocument();
    });
  });

  it("displays back button on error", async () => {
    axios.get.mockRejectedValueOnce({
      response: { data: { error: "Error" } },
    });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("Back to My Polls")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Back to My Polls"));
    expect(mockNavigate).toHaveBeenCalledWith("/my-polls");
  });
});

describe("Results - Access Denied", () => {
  it("displays access denied when isOwner is false after loading", async () => {
    // When poll status is neither active nor closed, isOwner stays false
    const unknownStatusPoll = { ...mockPoll, status: "unknown" };
    axios.get.mockResolvedValueOnce({ data: unknownStatusPoll });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("Access denied")).toBeInTheDocument();
    });
  });
});

describe("Results - Instant Runoff Calculation", () => {
  // Ballots where no one has majority in first round
  const multiRoundBallots = [
    { id: 1, rankedChoices: [1, 2, 3] },
    { id: 2, rankedChoices: [2, 1, 3] },
    { id: 3, rankedChoices: [3, 1, 2] },
  ];

  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/ballots")) {
        return Promise.resolve({ data: multiRoundBallots });
      }
      return Promise.resolve({ data: mockPoll });
    });
  });

  it("displays round numbers when multiple rounds needed", async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("Round 1")).toBeInTheDocument();
    });
  });

  it("displays instant runoff voting header", async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(
        screen.getByText("Instant Runoff Voting Rounds")
      ).toBeInTheDocument();
    });
  });

  it("displays option names in round results", async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("JavaScript")).toBeInTheDocument();
    });
  });

  it("displays vote counts with percentages", async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText(/votes/)).toBeInTheDocument();
    });
  });
});

describe("Results - Poll with options property", () => {
  const pollWithOptionsProperty = {
    ...mockPoll,
    pollOptions: undefined,
    options: [
      { id: 1, text: "Option A" },
      { id: 2, text: "Option B" },
    ],
  };

  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/ballots")) {
        return Promise.resolve({
          data: [
            { id: 1, rankedChoices: [1, 2] },
            { id: 2, rankedChoices: [1, 2] },
          ],
        });
      }
      return Promise.resolve({ data: pollWithOptionsProperty });
    });
  });

  it("handles poll with options property instead of pollOptions", async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("Option A")).toBeInTheDocument();
    });
  });
});

describe("Results - Closed Poll Ballot Fetch Error", () => {
  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/ballots")) {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.resolve({ data: mockPoll });
    });
  });

  it("still displays poll info when ballot fetch fails for closed poll", async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(
        screen.getByText("Favorite Programming Language")
      ).toBeInTheDocument();
    });
    expect(screen.getByText("0 votes cast")).toBeInTheDocument();
  });
});

describe("Results - Non-403 Error on Active Poll Ballots", () => {
  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/ballots")) {
        return Promise.reject({
          response: { status: 500, data: { error: "Server error" } },
        });
      }
      return Promise.resolve({ data: mockActivePoll });
    });
  });

  it("displays server error for non-403 ballot fetch errors on active poll", async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });
});
