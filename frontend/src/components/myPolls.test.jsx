import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import axios from "axios";
import MyPolls from "./MyPolls";

jest.mock("axios");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));

const renderWithRouter = (component) => {
  return render(<Router>{component}</Router>);
};

const mockPolls = [
  {
    id: 1,
    title: "Draft Poll",
    description: "Draft description",
    status: "draft",
    options: [
      { id: 1, text: "Option 1" },
      { id: 2, text: "Option 2" },
    ],
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 2,
    title: "Active Poll",
    description: "Active description",
    status: "active",
    slug: "active-poll",
    options: [
      { id: 3, text: "Option 3" },
      { id: 4, text: "Option 4" },
    ],
    activatedAt: "2026-01-05T00:00:00Z",
    endDate: "2026-02-05T00:00:00Z",
  },
  {
    id: 3,
    title: "Closed Poll",
    description: "Closed description",
    status: "closed",
    slug: "closed-poll",
    options: [
      { id: 5, text: "Option 5" },
      { id: 6, text: "Option 6" },
    ],
    activatedAt: "2025-12-01T00:00:00Z",
  },
];

describe("MyPolls Component", () => {
  let mockNavigate;
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;

  beforeEach(() => {
    jest.resetAllMocks();
    mockNavigate = jest.fn();
    jest
      .spyOn(require("react-router-dom"), "useNavigate")
      .mockReturnValue(mockNavigate);

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve()),
      },
    });

    // Use fake timers for copied feedback
    jest.useFakeTimers();

    // Suppress console output during tests
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();

    // Restore console
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  describe("Loading State", () => {
    it("should show loading message initially", () => {
      axios.get.mockImplementationOnce(() => new Promise(() => {}));
      renderWithRouter(<MyPolls />);
      expect(screen.getByText("Loading your polls...")).toBeInTheDocument();
    });
  });

  describe("Rendering", () => {
    beforeEach(() => {
      axios.get.mockResolvedValueOnce({ data: mockPolls });
    });

    it("should render My Polls header", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText("My Polls")).toBeInTheDocument();
      });
    });

    it("should render Create New Poll button in header", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText("+ Create New Poll")).toBeInTheDocument();
      });
    });

    it("should render all filter tabs", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText(/All \(3\)/)).toBeInTheDocument();
        expect(screen.getByText(/Draft \(1\)/)).toBeInTheDocument();
        expect(screen.getByText(/Active \(1\)/)).toBeInTheDocument();
        expect(screen.getByText(/Closed \(1\)/)).toBeInTheDocument();
      });
    });

    it("should render all polls by default", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText("Draft Poll")).toBeInTheDocument();
        expect(screen.getByText("Active Poll")).toBeInTheDocument();
        expect(screen.getByText("Closed Poll")).toBeInTheDocument();
      });
    });

    it("should render poll descriptions", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText("Draft description")).toBeInTheDocument();
        expect(screen.getByText("Active description")).toBeInTheDocument();
        expect(screen.getByText("Closed description")).toBeInTheDocument();
      });
    });

    it("should render status badges", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText("DRAFT")).toBeInTheDocument();
        expect(screen.getByText("ACTIVE")).toBeInTheDocument();
        expect(screen.getByText("CLOSED")).toBeInTheDocument();
      });
    });

    it("should render option counts", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        const optionCounts = screen.getAllByText("2 options");
        expect(optionCounts.length).toBe(3);
      });
    });
  });

  describe("Fetching Polls", () => {
    it("should fetch polls on mount", async () => {
      axios.get.mockResolvedValueOnce({ data: mockPolls });
      renderWithRouter(<MyPolls />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining("/api/polls/my-polls"),
          expect.objectContaining({ withCredentials: true })
        );
      });
    });

    it("should show error message on fetch failure", async () => {
      axios.get.mockRejectedValueOnce({
        response: { data: { error: "Failed to load polls" } },
      });
      renderWithRouter(<MyPolls />);

      await waitFor(() => {
        expect(screen.getByText("Failed to load polls")).toBeInTheDocument();
      });
    });

    it("should show default error message when API returns no error message", async () => {
      axios.get.mockRejectedValueOnce({ response: {} });
      renderWithRouter(<MyPolls />);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to load your polls. Try again.")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Filtering", () => {
    beforeEach(() => {
      axios.get.mockResolvedValueOnce({ data: mockPolls });
    });

    it("should filter polls by draft status", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText("Draft Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Draft \(1\)/));

      expect(screen.getByText("Draft Poll")).toBeInTheDocument();
      expect(screen.queryByText("Active Poll")).not.toBeInTheDocument();
      expect(screen.queryByText("Closed Poll")).not.toBeInTheDocument();
    });

    it("should filter polls by active status", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText("Active Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Active \(1\)/));

      expect(screen.getByText("Active Poll")).toBeInTheDocument();
      expect(screen.queryByText("Draft Poll")).not.toBeInTheDocument();
      expect(screen.queryByText("Closed Poll")).not.toBeInTheDocument();
    });

    it("should filter polls by closed status", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText("Closed Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Closed \(1\)/));

      expect(screen.getByText("Closed Poll")).toBeInTheDocument();
      expect(screen.queryByText("Draft Poll")).not.toBeInTheDocument();
      expect(screen.queryByText("Active Poll")).not.toBeInTheDocument();
    });

    it("should show all polls when All tab is clicked", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText("Draft Poll")).toBeInTheDocument();
      });

      // First filter to draft
      fireEvent.click(screen.getByText(/Draft \(1\)/));
      expect(screen.queryByText("Active Poll")).not.toBeInTheDocument();

      // Then back to all
      fireEvent.click(screen.getByText(/All \(3\)/));

      expect(screen.getByText("Draft Poll")).toBeInTheDocument();
      expect(screen.getByText("Active Poll")).toBeInTheDocument();
      expect(screen.getByText("Closed Poll")).toBeInTheDocument();
    });

    it("should highlight active filter tab", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText("Draft Poll")).toBeInTheDocument();
      });

      const draftTab = screen.getByText(/Draft \(1\)/);
      fireEvent.click(draftTab);

      expect(draftTab).toHaveClass("active");
    });

    it("should highlight All tab by default", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        const allTab = screen.getByText(/All \(3\)/);
        expect(allTab).toHaveClass("active");
      });
    });
  });

  describe("Poll Actions", () => {
    beforeEach(() => {
      axios.get.mockResolvedValueOnce({ data: mockPolls });
    });

    it("should show Edit button for draft polls", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText("Draft Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Draft \(1\)/));

      expect(screen.getByText("Edit")).toBeInTheDocument();
    });

    it("should show Vote button for active polls", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText("Active Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Active \(1\)/));

      expect(screen.getByText("Vote")).toBeInTheDocument();
    });

    it("should show View button for closed polls", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText("Closed Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Closed \(1\)/));

      expect(screen.getByText("View")).toBeInTheDocument();
    });

    it("should show Share button for active polls with slug", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText("Active Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Active \(1\)/));

      expect(screen.getByText("📋 Share")).toBeInTheDocument();
    });

    it("should not show Share button for draft polls", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText("Draft Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Draft \(1\)/));

      expect(screen.queryByText("📋 Share")).not.toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    beforeEach(() => {
      axios.get.mockResolvedValueOnce({ data: mockPolls });
    });

    it("should navigate to create poll page when header button is clicked", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText("+ Create New Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("+ Create New Poll"));

      expect(mockNavigate).toHaveBeenCalledWith("/polls/create");
    });

    it("should navigate to edit page when Edit button is clicked", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText("Draft Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Draft \(1\)/));
      fireEvent.click(screen.getByText("Edit"));

      expect(mockNavigate).toHaveBeenCalledWith("/polls/1");
    });

    it("should navigate to vote page when Vote button is clicked", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText("Active Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Active \(1\)/));
      fireEvent.click(screen.getByText("Vote"));

      expect(mockNavigate).toHaveBeenCalledWith("/polls/2/vote");
    });

    it("should navigate to poll page when View button is clicked", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText("Closed Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Closed \(1\)/));
      fireEvent.click(screen.getByText("View"));

      expect(mockNavigate).toHaveBeenCalledWith("/polls/3");
    });
  });

  describe("Copy Shareable Link", () => {
    beforeEach(() => {
      axios.get.mockResolvedValueOnce({ data: mockPolls });
    });

    it("should copy link to clipboard when Share button is clicked", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText("Active Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Active \(1\)/));
      fireEvent.click(screen.getByText("📋 Share"));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining("/vote/2/active-poll")
      );
    });

    it("should show Copied feedback after copying link", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText("Active Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Active \(1\)/));
      fireEvent.click(screen.getByText("📋 Share"));

      await waitFor(() => {
        expect(screen.getByText("✓ Copied!")).toBeInTheDocument();
      });
    });

    it("should hide Copied feedback after timeout", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText("Active Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Active \(1\)/));
      fireEvent.click(screen.getByText("📋 Share"));

      await waitFor(() => {
        expect(screen.getByText("✓ Copied!")).toBeInTheDocument();
      });

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText("📋 Share")).toBeInTheDocument();
      });
    });
  });

  describe("Empty States", () => {
    it("should show empty state when no polls exist", async () => {
      axios.get.mockResolvedValueOnce({ data: [] });
      renderWithRouter(<MyPolls />);

      await waitFor(() => {
        expect(
          screen.getByText("You haven't created any polls yet.")
        ).toBeInTheDocument();
        expect(screen.getByText("Create Your First Poll")).toBeInTheDocument();
      });
    });

    it("should show filtered empty state when no draft polls exist", async () => {
      const pollsWithoutDraft = mockPolls.filter((p) => p.status !== "draft");
      axios.get.mockResolvedValueOnce({ data: pollsWithoutDraft });
      renderWithRouter(<MyPolls />);

      await waitFor(() => {
        expect(screen.getByText("Active Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Draft \(0\)/));

      expect(screen.getByText("No draft polls.")).toBeInTheDocument();
    });

    it("should show filtered empty state when no active polls exist", async () => {
      const pollsWithoutActive = mockPolls.filter((p) => p.status !== "active");
      axios.get.mockResolvedValueOnce({ data: pollsWithoutActive });
      renderWithRouter(<MyPolls />);

      await waitFor(() => {
        expect(screen.getByText("Draft Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Active \(0\)/));

      expect(screen.getByText("No active polls.")).toBeInTheDocument();
    });

    it("should show filtered empty state when no closed polls exist", async () => {
      const pollsWithoutClosed = mockPolls.filter((p) => p.status !== "closed");
      axios.get.mockResolvedValueOnce({ data: pollsWithoutClosed });
      renderWithRouter(<MyPolls />);

      await waitFor(() => {
        expect(screen.getByText("Draft Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Closed \(0\)/));

      expect(screen.getByText("No closed polls.")).toBeInTheDocument();
    });

    it("should navigate to create poll from empty state button", async () => {
      axios.get.mockResolvedValueOnce({ data: [] });
      renderWithRouter(<MyPolls />);

      await waitFor(() => {
        expect(screen.getByText("Create Your First Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Create Your First Poll"));

      expect(mockNavigate).toHaveBeenCalledWith("/polls/create");
    });
  });

  describe("Date Formatting", () => {
    beforeEach(() => {
      axios.get.mockResolvedValueOnce({ data: mockPolls });
    });

    it("should display activation date for active polls", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        // Filter to active polls only to check the date
        fireEvent.click(screen.getByText(/Active \(1\)/));
      });

      expect(screen.getByText(/Active since/)).toBeInTheDocument();
    });

    it("should display end date for polls with end dates", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        fireEvent.click(screen.getByText(/Active \(1\)/));
      });

      expect(screen.getByText(/Ends/)).toBeInTheDocument();
    });

    it("should not display dates for draft polls without dates", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText("Draft Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Draft \(1\)/));

      expect(screen.queryByText(/Active since/)).not.toBeInTheDocument();
    });
  });

  describe("CSS Classes", () => {
    beforeEach(() => {
      axios.get.mockResolvedValueOnce({ data: mockPolls });
    });

    it("should apply my-polls-container class", async () => {
      const { container } = renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(
          container.querySelector(".my-polls-container")
        ).toBeInTheDocument();
      });
    });

    it("should apply filter-tabs class", async () => {
      const { container } = renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(container.querySelector(".filter-tabs")).toBeInTheDocument();
      });
    });

    it("should apply polls-list class", async () => {
      const { container } = renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(container.querySelector(".polls-list")).toBeInTheDocument();
      });
    });

    it("should apply status-specific classes to poll items", async () => {
      const { container } = renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(container.querySelector(".status-draft")).toBeInTheDocument();
        expect(container.querySelector(".status-active")).toBeInTheDocument();
        expect(container.querySelector(".status-closed")).toBeInTheDocument();
      });
    });

    it("should apply btn-create-new class to create button", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        const createButton = screen.getByText("+ Create New Poll");
        expect(createButton).toHaveClass("btn-create-new");
      });
    });

    it("should apply btn-view class to action buttons", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        const editButton = screen.getByText("Edit");
        expect(editButton).toHaveClass("btn-view");
      });
    });

    it("should apply btn-share-link class to share button", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        const shareButton = screen.getByText("📋 Share");
        expect(shareButton).toHaveClass("btn-share-link");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle poll without description", async () => {
      const pollWithoutDesc = [{ ...mockPolls[0], description: null }];
      axios.get.mockResolvedValueOnce({ data: pollWithoutDesc });
      renderWithRouter(<MyPolls />);

      await waitFor(() => {
        expect(screen.getByText("Draft Poll")).toBeInTheDocument();
        expect(screen.queryByText("Draft description")).not.toBeInTheDocument();
      });
    });

    it("should handle poll without options", async () => {
      const pollWithoutOptions = [{ ...mockPolls[0], options: null }];
      axios.get.mockResolvedValueOnce({ data: pollWithoutOptions });
      renderWithRouter(<MyPolls />);

      await waitFor(() => {
        expect(screen.getByText("Draft Poll")).toBeInTheDocument();
        expect(screen.getByText("0 options")).toBeInTheDocument();
      });
    });

    it("should handle poll with empty options array", async () => {
      const pollWithEmptyOptions = [{ ...mockPolls[0], options: [] }];
      axios.get.mockResolvedValueOnce({ data: pollWithEmptyOptions });
      renderWithRouter(<MyPolls />);

      await waitFor(() => {
        expect(screen.getByText("Draft Poll")).toBeInTheDocument();
        expect(screen.getByText("0 options")).toBeInTheDocument();
      });
    });

    it("should not show share button for active poll without slug", async () => {
      const activePollWithoutSlug = [{ ...mockPolls[1], slug: null }];
      axios.get.mockResolvedValueOnce({ data: activePollWithoutSlug });
      renderWithRouter(<MyPolls />);

      await waitFor(() => {
        expect(screen.getByText("Active Poll")).toBeInTheDocument();
        expect(screen.queryByText("📋 Share")).not.toBeInTheDocument();
      });
    });

    it("should handle multiple polls of same status", async () => {
      const multipleDrafts = [
        mockPolls[0],
        { ...mockPolls[0], id: 4, title: "Draft Poll 2" },
        { ...mockPolls[0], id: 5, title: "Draft Poll 3" },
      ];
      axios.get.mockResolvedValueOnce({ data: multipleDrafts });
      renderWithRouter(<MyPolls />);

      await waitFor(() => {
        expect(screen.getByText(/Draft \(3\)/)).toBeInTheDocument();
        expect(screen.getByText("Draft Poll")).toBeInTheDocument();
        expect(screen.getByText("Draft Poll 2")).toBeInTheDocument();
        expect(screen.getByText("Draft Poll 3")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    beforeEach(() => {
      axios.get.mockResolvedValueOnce({ data: mockPolls });
    });

    it("should have proper heading structure", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "My Polls" })
        ).toBeInTheDocument();
      });
    });

    it("should have buttons for all actions", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        expect(screen.getByText("+ Create New Poll").tagName).toBe("BUTTON");
        expect(screen.getByText("Edit").tagName).toBe("BUTTON");
      });
    });

    it("should have title attribute on share button", async () => {
      renderWithRouter(<MyPolls />);
      await waitFor(() => {
        const shareButton = screen.getByText("📋 Share");
        expect(shareButton).toHaveAttribute("title", "Copy shareable link");
      });
    });
  });
});
