import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import axios from "axios";
import EditPoll from "./EditPoll";

jest.mock("axios");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ pollId: "1" }),
  useNavigate: () => jest.fn(),
}));

// Mock crypto.randomUUID for JSDOM environment
const mockRandomUUID = jest.fn(() => "test-uuid-" + Math.random());
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: mockRandomUUID,
  },
});

const renderWithRouter = (component) => {
  return render(<Router>{component}</Router>);
};

const mockDraftPollData = {
  id: 1,
  title: "Test Poll",
  description: "Test Description",
  status: "draft",
  pollOptions: [
    { id: 1, text: "Option A" },
    { id: 2, text: "Option B" },
  ],
};

const mockActivePollData = {
  id: 1,
  title: "Active Poll",
  description: "Active Description",
  status: "active",
  slug: "active-poll",
  pollOptions: [
    { id: 1, text: "Option A" },
    { id: 2, text: "Option B" },
  ],
};

const mockClosedPollData = {
  id: 1,
  title: "Closed Poll",
  description: "Closed Description",
  status: "closed",
  pollOptions: [
    { id: 1, text: "Option A" },
    { id: 2, text: "Option B" },
  ],
};

describe("EditPoll Component", () => {
  let mockNavigate;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate = jest.fn();
    jest
      .spyOn(require("react-router-dom"), "useNavigate")
      .mockReturnValue(mockNavigate);

    // Mock window.confirm
    jest.spyOn(window, "confirm").mockImplementation(() => true);
  });

  afterEach(() => {
    window.confirm.mockRestore();
  });

  describe("Loading State", () => {
    it("should show loading message initially", () => {
      axios.get.mockImplementationOnce(() => new Promise(() => {}));
      renderWithRouter(<EditPoll />);
      expect(screen.getByText("Loading poll...")).toBeInTheDocument();
    });
  });

  describe("Rendering - Draft Poll", () => {
    beforeEach(() => {
      axios.get.mockResolvedValueOnce({ data: mockDraftPollData });
    });

    it("should render Edit Poll title for draft polls", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getByText("Edit Poll")).toBeInTheDocument();
      });
    });

    it("should render the poll title input with correct value", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Poll")).toBeInTheDocument();
      });
    });

    it("should render the poll description with correct value", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(
          screen.getByDisplayValue("Test Description")
        ).toBeInTheDocument();
      });
    });

    it("should render all poll options", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getByDisplayValue("Option A")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Option B")).toBeInTheDocument();
      });
    });

    it("should render DRAFT status badge", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getByText("DRAFT")).toBeInTheDocument();
      });
    });

    it("should render Save Changes button for draft polls", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getByText("Save Changes")).toBeInTheDocument();
      });
    });

    it("should render Publish Poll button for draft polls", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getByText("Publish Poll")).toBeInTheDocument();
      });
    });

    it("should render Delete Poll button", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getByText("Delete Poll")).toBeInTheDocument();
      });
    });

    it("should render Back button", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getByText("Back")).toBeInTheDocument();
      });
    });

    it("should render Add Option button for draft polls", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getByText("+ Add Option")).toBeInTheDocument();
      });
    });

    it("should render Remove buttons for options", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getAllByText("Remove").length).toBe(2);
      });
    });
  });

  describe("Rendering - Active Poll", () => {
    beforeEach(() => {
      axios.get.mockResolvedValueOnce({ data: mockActivePollData });
    });

    it("should render View Poll title for active polls", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getByText("View Poll")).toBeInTheDocument();
      });
    });

    it("should render ACTIVE status badge", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getByText("ACTIVE")).toBeInTheDocument();
      });
    });

    it("should not render Save Changes button for active polls", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getByText("ACTIVE")).toBeInTheDocument();
      });
      expect(screen.queryByText("Save Changes")).not.toBeInTheDocument();
    });

    it("should not render Publish Poll button for active polls", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getByText("ACTIVE")).toBeInTheDocument();
      });
      expect(screen.queryByText("Publish Poll")).not.toBeInTheDocument();
    });

    it("should not render Add Option button for active polls", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getByText("ACTIVE")).toBeInTheDocument();
      });
      expect(screen.queryByText("+ Add Option")).not.toBeInTheDocument();
    });

    it("should not render Remove buttons for active polls", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getByText("ACTIVE")).toBeInTheDocument();
      });
      expect(screen.queryByText("Remove")).not.toBeInTheDocument();
    });

    it("should disable title input for active polls", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        const titleInput = screen.getByDisplayValue("Active Poll");
        expect(titleInput).toBeDisabled();
      });
    });

    it("should disable description input for active polls", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        const descInput = screen.getByDisplayValue("Active Description");
        expect(descInput).toBeDisabled();
      });
    });

    it("should disable option inputs for active polls", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        const optionA = screen.getByDisplayValue("Option A");
        const optionB = screen.getByDisplayValue("Option B");
        expect(optionA).toBeDisabled();
        expect(optionB).toBeDisabled();
      });
    });

    it("should still show Delete Poll button for active polls", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getByText("Delete Poll")).toBeInTheDocument();
      });
    });
  });

  describe("Closed Poll Redirect", () => {
    it("should redirect to results page for closed polls", async () => {
      axios.get.mockResolvedValueOnce({ data: mockClosedPollData });
      renderWithRouter(<EditPoll />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/polls/1/results");
      });
    });
  });

  describe("Form Input Handling - Draft Poll", () => {
    beforeEach(() => {
      axios.get.mockResolvedValueOnce({ data: mockDraftPollData });
    });

    it("should update title when typed", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Poll")).toBeInTheDocument();
      });

      const titleInput = screen.getByDisplayValue("Test Poll");
      fireEvent.change(titleInput, { target: { value: "Updated Title" } });

      expect(screen.getByDisplayValue("Updated Title")).toBeInTheDocument();
    });

    it("should update description when typed", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(
          screen.getByDisplayValue("Test Description")
        ).toBeInTheDocument();
      });

      const descInput = screen.getByDisplayValue("Test Description");
      fireEvent.change(descInput, { target: { value: "Updated Description" } });

      expect(
        screen.getByDisplayValue("Updated Description")
      ).toBeInTheDocument();
    });

    it("should update option when typed", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getByDisplayValue("Option A")).toBeInTheDocument();
      });

      const optionInput = screen.getByDisplayValue("Option A");
      fireEvent.change(optionInput, { target: { value: "Updated Option A" } });

      expect(screen.getByDisplayValue("Updated Option A")).toBeInTheDocument();
    });
  });

  describe("Adding and Removing Options", () => {
    beforeEach(() => {
      axios.get.mockResolvedValueOnce({ data: mockDraftPollData });
    });

    it("should add a new option when Add Option is clicked", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getByDisplayValue("Option A")).toBeInTheDocument();
      });

      // Initially should have 2 Remove buttons
      expect(screen.getAllByText("Remove").length).toBe(2);

      fireEvent.click(screen.getByText("+ Add Option"));

      // After adding, should have 3 Remove buttons
      await waitFor(() => {
        expect(screen.getAllByText("Remove").length).toBe(3);
      });
    });

    it("should not remove option if only one remains", async () => {
      // Start with poll that has only one option after removal
      const pollWithOneOption = {
        ...mockDraftPollData,
        pollOptions: [{ id: 1, text: "Only Option" }],
      };
      axios.get.mockReset();
      axios.get.mockResolvedValueOnce({ data: pollWithOneOption });

      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getByDisplayValue("Only Option")).toBeInTheDocument();
      });

      // Should not show remove button when only one option
      expect(screen.queryByText("Remove")).not.toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    beforeEach(() => {
      axios.get.mockResolvedValueOnce({ data: mockDraftPollData });
    });

    it("should show error when title is empty on save", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Poll")).toBeInTheDocument();
      });

      const titleInput = screen.getByDisplayValue("Test Poll");
      fireEvent.change(titleInput, { target: { value: "" } });

      fireEvent.click(screen.getByText("Save Changes"));

      await waitFor(() => {
        expect(screen.getByText("Poll title is required")).toBeInTheDocument();
      });
    });

    it("should show error when less than 2 options on save", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getByDisplayValue("Option A")).toBeInTheDocument();
      });

      // Clear both options
      const optionA = screen.getByDisplayValue("Option A");
      const optionB = screen.getByDisplayValue("Option B");
      fireEvent.change(optionA, { target: { value: "" } });
      fireEvent.change(optionB, { target: { value: "" } });

      fireEvent.click(screen.getByText("Save Changes"));

      await waitFor(() => {
        expect(
          screen.getByText("Poll must have at least 2 options")
        ).toBeInTheDocument();
      });
    });

    it("should clear title error when user types", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Poll")).toBeInTheDocument();
      });

      const titleInput = screen.getByDisplayValue("Test Poll");
      fireEvent.change(titleInput, { target: { value: "" } });
      fireEvent.click(screen.getByText("Save Changes"));

      await waitFor(() => {
        expect(screen.getByText("Poll title is required")).toBeInTheDocument();
      });

      fireEvent.change(titleInput, { target: { value: "New Title" } });

      await waitFor(() => {
        expect(
          screen.queryByText("Poll title is required")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Save Changes", () => {
    beforeEach(() => {
      axios.get.mockResolvedValueOnce({ data: mockDraftPollData });
    });

    it("should call API with correct data on save", async () => {
      axios.patch.mockResolvedValueOnce({ data: mockDraftPollData });
      renderWithRouter(<EditPoll />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Save Changes"));

      await waitFor(() => {
        expect(axios.patch).toHaveBeenCalledWith(
          expect.stringContaining("/api/polls/1"),
          {
            title: "Test Poll",
            description: "Test Description",
            options: [
              { id: 1, text: "Option A" },
              { id: 2, text: "Option B" },
            ],
          },
          expect.objectContaining({ withCredentials: true })
        );
      });
    });

    it("should show success message after successful save", async () => {
      axios.patch.mockResolvedValueOnce({ data: mockDraftPollData });
      renderWithRouter(<EditPoll />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Save Changes"));

      await waitFor(() => {
        expect(
          screen.getByText("Poll saved successfully!")
        ).toBeInTheDocument();
      });
    });

    it("should show loading state while saving", async () => {
      axios.patch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: mockDraftPollData }), 100)
          )
      );
      renderWithRouter(<EditPoll />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Save Changes"));

      await waitFor(() => {
        expect(screen.getByText("Saving...")).toBeInTheDocument();
      });
    });

    it("should show error message on save failure", async () => {
      axios.patch.mockRejectedValueOnce({
        response: { data: { message: "Save failed" } },
      });
      renderWithRouter(<EditPoll />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Save Changes"));

      await waitFor(() => {
        expect(screen.getByText("Save failed")).toBeInTheDocument();
      });
    });

    it("should show default error message when API returns no message", async () => {
      axios.patch.mockRejectedValueOnce({ response: {} });
      renderWithRouter(<EditPoll />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Save Changes"));

      await waitFor(() => {
        expect(
          screen.getByText("Failed to save poll. Try again.")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Publish Poll", () => {
    beforeEach(() => {
      axios.get.mockResolvedValueOnce({ data: mockDraftPollData });
    });

    it("should call publish API on publish button click", async () => {
      axios.patch.mockResolvedValueOnce({
        data: { ...mockDraftPollData, status: "active" },
      });
      renderWithRouter(<EditPoll />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Publish Poll"));

      await waitFor(() => {
        expect(axios.patch).toHaveBeenCalledWith(
          expect.stringContaining("/api/polls/1/publish"),
          {},
          expect.objectContaining({ withCredentials: true })
        );
      });
    });

    it("should show success message after successful publish", async () => {
      axios.patch.mockResolvedValueOnce({
        data: { ...mockDraftPollData, status: "active" },
      });
      renderWithRouter(<EditPoll />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Publish Poll"));

      await waitFor(() => {
        expect(
          screen.getByText("Poll published successfully!")
        ).toBeInTheDocument();
      });
    });

    it("should update status badge after successful publish", async () => {
      axios.patch.mockResolvedValueOnce({
        data: { ...mockDraftPollData, status: "active" },
      });
      renderWithRouter(<EditPoll />);

      await waitFor(() => {
        expect(screen.getByText("DRAFT")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Publish Poll"));

      await waitFor(() => {
        expect(screen.getByText("ACTIVE")).toBeInTheDocument();
      });
    });

    it("should show loading state while publishing", async () => {
      axios.patch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({ data: { ...mockDraftPollData, status: "active" } }),
              100
            )
          )
      );
      renderWithRouter(<EditPoll />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Publish Poll"));

      await waitFor(() => {
        expect(screen.getByText("Publishing...")).toBeInTheDocument();
      });
    });

    it("should show error message on publish failure", async () => {
      axios.patch.mockRejectedValueOnce({
        response: { data: { message: "Publish failed" } },
      });
      renderWithRouter(<EditPoll />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Publish Poll"));

      await waitFor(() => {
        expect(screen.getByText("Publish failed")).toBeInTheDocument();
      });
    });

    it("should validate form before publishing", async () => {
      renderWithRouter(<EditPoll />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Poll")).toBeInTheDocument();
      });

      const titleInput = screen.getByDisplayValue("Test Poll");
      fireEvent.change(titleInput, { target: { value: "" } });

      fireEvent.click(screen.getByText("Publish Poll"));

      await waitFor(() => {
        expect(screen.getByText("Poll title is required")).toBeInTheDocument();
      });

      expect(axios.patch).not.toHaveBeenCalled();
    });
  });

  describe("Delete Poll", () => {
    beforeEach(() => {
      axios.get.mockResolvedValueOnce({ data: mockDraftPollData });
    });

    it("should show confirmation dialog when delete is clicked", async () => {
      renderWithRouter(<EditPoll />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Delete Poll"));

      expect(window.confirm).toHaveBeenCalledWith(
        "Are you sure you want to delete this poll?"
      );
    });

    it("should call delete API when confirmed", async () => {
      axios.delete.mockResolvedValueOnce({ data: { message: "Deleted" } });
      renderWithRouter(<EditPoll />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Delete Poll"));

      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith(
          expect.stringContaining("/api/polls/1"),
          expect.objectContaining({ withCredentials: true })
        );
      });
    });

    it("should navigate to home after successful delete", async () => {
      axios.delete.mockResolvedValueOnce({ data: { message: "Deleted" } });
      renderWithRouter(<EditPoll />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Delete Poll"));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });

    it("should not call delete API when cancelled", async () => {
      window.confirm.mockReturnValueOnce(false);
      renderWithRouter(<EditPoll />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Delete Poll"));

      expect(axios.delete).not.toHaveBeenCalled();
    });

    it("should show error message on delete failure", async () => {
      axios.delete.mockRejectedValueOnce({
        response: { data: { message: "Delete failed" } },
      });
      renderWithRouter(<EditPoll />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Delete Poll"));

      await waitFor(() => {
        expect(screen.getByText("Delete failed")).toBeInTheDocument();
      });
    });

    it("should show loading state while deleting", async () => {
      axios.delete.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { message: "Deleted" } }), 100)
          )
      );
      renderWithRouter(<EditPoll />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Delete Poll"));

      await waitFor(() => {
        expect(screen.getByText("Deleting...")).toBeInTheDocument();
      });
    });
  });

  describe("Navigation", () => {
    beforeEach(() => {
      axios.get.mockResolvedValueOnce({ data: mockDraftPollData });
    });

    it("should navigate to home when Back is clicked", async () => {
      renderWithRouter(<EditPoll />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Poll")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Back"));

      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  describe("Error Handling", () => {
    it("should show error message when poll fetch fails", async () => {
      axios.get.mockRejectedValueOnce({
        response: { data: { message: "Poll not found" } },
      });
      renderWithRouter(<EditPoll />);

      await waitFor(() => {
        expect(screen.getByText("Poll not found")).toBeInTheDocument();
      });
    });

    it("should show default error message when fetch fails without message", async () => {
      axios.get.mockRejectedValueOnce({ response: {} });
      renderWithRouter(<EditPoll />);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to load poll. Please try again.")
        ).toBeInTheDocument();
      });
    });
  });

  describe("CSS Classes", () => {
    beforeEach(() => {
      axios.get.mockResolvedValueOnce({ data: mockDraftPollData });
    });

    it("should apply edit-poll-container class", async () => {
      const { container } = renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(
          container.querySelector(".edit-poll-container")
        ).toBeInTheDocument();
      });
    });

    it("should apply edit-poll-form class", async () => {
      const { container } = renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(container.querySelector(".edit-poll-form")).toBeInTheDocument();
      });
    });

    it("should apply status-draft class to status badge", async () => {
      const { container } = renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(container.querySelector(".status-draft")).toBeInTheDocument();
      });
    });

    it("should apply input-disabled class for active polls", async () => {
      axios.get.mockReset();
      axios.get.mockResolvedValueOnce({ data: mockActivePollData });
      const { container } = renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(container.querySelector(".input-disabled")).toBeInTheDocument();
      });
    });

    it("should apply btn-primary class to Save Changes button", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        const saveButton = screen.getByText("Save Changes");
        expect(saveButton).toHaveClass("btn-primary");
      });
    });

    it("should apply btn-publish class to Publish Poll button", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        const publishButton = screen.getByText("Publish Poll");
        expect(publishButton).toHaveClass("btn-publish");
      });
    });

    it("should apply btn-danger class to Delete Poll button", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        const deleteButton = screen.getByText("Delete Poll");
        expect(deleteButton).toHaveClass("btn-danger");
      });
    });

    it("should apply btn-secondary class to Back button", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        const backButton = screen.getByText("Back");
        expect(backButton).toHaveClass("btn-secondary");
      });
    });
  });

  describe("Accessibility", () => {
    beforeEach(() => {
      axios.get.mockResolvedValueOnce({ data: mockDraftPollData });
    });

    it("should have form element", async () => {
      const { container } = renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(container.querySelector("form")).toBeInTheDocument();
      });
    });

    it("should have labels for form fields", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        expect(screen.getByLabelText("Poll Title *")).toBeInTheDocument();
        expect(screen.getByLabelText("Description")).toBeInTheDocument();
      });
    });

    it("should have proper button types", async () => {
      renderWithRouter(<EditPoll />);
      await waitFor(() => {
        const saveButton = screen.getByText("Save Changes");
        const publishButton = screen.getByText("Publish Poll");
        const deleteButton = screen.getByText("Delete Poll");
        const backButton = screen.getByText("Back");

        expect(saveButton).toHaveAttribute("type", "submit");
        expect(publishButton).toHaveAttribute("type", "button");
        expect(deleteButton).toHaveAttribute("type", "button");
        expect(backButton).toHaveAttribute("type", "button");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle poll with empty description", async () => {
      const pollWithNoDesc = { ...mockDraftPollData, description: null };
      axios.get.mockResolvedValueOnce({ data: pollWithNoDesc });
      renderWithRouter(<EditPoll />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Poll")).toBeInTheDocument();
        const descInput = screen.getByLabelText("Description");
        expect(descInput.value).toBe("");
      });
    });

    it("should handle poll with no options", async () => {
      const pollWithNoOptions = { ...mockDraftPollData, pollOptions: [] };
      axios.get.mockResolvedValueOnce({ data: pollWithNoOptions });
      renderWithRouter(<EditPoll />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Poll")).toBeInTheDocument();
        expect(screen.queryByText("Remove")).not.toBeInTheDocument();
      });
    });

    it("should trim whitespace from title on save", async () => {
      axios.get.mockResolvedValueOnce({ data: mockDraftPollData });
      axios.patch.mockResolvedValueOnce({ data: mockDraftPollData });
      renderWithRouter(<EditPoll />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Poll")).toBeInTheDocument();
      });

      const titleInput = screen.getByDisplayValue("Test Poll");
      fireEvent.change(titleInput, { target: { value: "  Trimmed Title  " } });

      fireEvent.click(screen.getByText("Save Changes"));

      await waitFor(() => {
        expect(axios.patch).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            title: "Trimmed Title",
          }),
          expect.anything()
        );
      });
    });
  });
});
