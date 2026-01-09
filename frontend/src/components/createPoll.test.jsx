import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter as Router } from "react-router-dom";
import axios from "axios";
import CreatePoll from "./CreatePoll";

jest.mock("axios");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));

const renderWithRouter = (component) => {
  return render(<Router>{component}</Router>);
};

describe("CreatePoll Component", () => {
  let mockNavigate;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate = jest.fn();
    jest
      .spyOn(require("react-router-dom"), "useNavigate")
      .mockReturnValue(mockNavigate);
  });

  describe("Rendering", () => {
    it("should render the page title", () => {
      renderWithRouter(<CreatePoll />);
      expect(screen.getByText("Create a New Poll")).toBeInTheDocument();
    });

    it("should render the title input field", () => {
      renderWithRouter(<CreatePoll />);
      expect(screen.getByLabelText("Poll Title *")).toBeInTheDocument();
    });

    it("should render the description textarea", () => {
      renderWithRouter(<CreatePoll />);
      expect(screen.getByLabelText("Description")).toBeInTheDocument();
    });

    it("should render the end date input", () => {
      renderWithRouter(<CreatePoll />);
      expect(
        screen.getByLabelText("Poll Close Date (Optional)")
      ).toBeInTheDocument();
    });

    it("should render the options section", () => {
      renderWithRouter(<CreatePoll />);
      expect(screen.getByText("Poll Options *")).toBeInTheDocument();
    });

    it("should render one empty option input by default", () => {
      renderWithRouter(<CreatePoll />);
      const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
      expect(optionInputs.length).toBe(1);
    });

    it("should render Add Option button", () => {
      renderWithRouter(<CreatePoll />);
      expect(screen.getByText("+ Add Option")).toBeInTheDocument();
    });

    it("should render Save Draft button", () => {
      renderWithRouter(<CreatePoll />);
      expect(screen.getByText("Save Draft")).toBeInTheDocument();
    });

    it("should render Publish Poll button", () => {
      renderWithRouter(<CreatePoll />);
      expect(screen.getByText("Publish Poll")).toBeInTheDocument();
    });

    it("should render Cancel button", () => {
      renderWithRouter(<CreatePoll />);
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });
  });

  describe("Form Input Handling", () => {
    it("should update title when typed", () => {
      renderWithRouter(<CreatePoll />);
      const titleInput = screen.getByLabelText("Poll Title *");
      fireEvent.change(titleInput, { target: { value: "My Test Poll" } });
      expect(titleInput.value).toBe("My Test Poll");
    });

    it("should update description when typed", () => {
      renderWithRouter(<CreatePoll />);
      const descInput = screen.getByLabelText("Description");
      fireEvent.change(descInput, { target: { value: "Poll description" } });
      expect(descInput.value).toBe("Poll description");
    });

    it("should update option when typed", () => {
      renderWithRouter(<CreatePoll />);
      const optionInput = screen.getByPlaceholderText("Option 1");
      fireEvent.change(optionInput, { target: { value: "First option" } });
      expect(optionInput.value).toBe("First option");
    });

    it("should update end date when changed", () => {
      renderWithRouter(<CreatePoll />);
      const dateInput = screen.getByLabelText("Poll Close Date (Optional)");
      fireEvent.change(dateInput, { target: { value: "2026-02-01T12:00" } });
      expect(dateInput.value).toBe("2026-02-01T12:00");
    });
  });

  describe("Adding and Removing Options", () => {
    it("should add a new option when Add Option is clicked", () => {
      renderWithRouter(<CreatePoll />);
      const addButton = screen.getByText("+ Add Option");

      fireEvent.click(addButton);

      const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
      expect(optionInputs.length).toBe(2);
    });

    it("should add multiple options", () => {
      renderWithRouter(<CreatePoll />);
      const addButton = screen.getByText("+ Add Option");

      fireEvent.click(addButton);
      fireEvent.click(addButton);
      fireEvent.click(addButton);

      const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
      expect(optionInputs.length).toBe(4);
    });

    it("should show Remove button when more than one option exists", () => {
      renderWithRouter(<CreatePoll />);
      const addButton = screen.getByText("+ Add Option");

      fireEvent.click(addButton);

      expect(screen.getAllByText("Remove").length).toBe(2);
    });

    it("should not show Remove button when only one option exists", () => {
      renderWithRouter(<CreatePoll />);
      expect(screen.queryByText("Remove")).not.toBeInTheDocument();
    });

    it("should remove an option when Remove is clicked", () => {
      renderWithRouter(<CreatePoll />);
      const addButton = screen.getByText("+ Add Option");
      fireEvent.click(addButton);

      const removeButtons = screen.getAllByText("Remove");
      fireEvent.click(removeButtons[0]);

      const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
      expect(optionInputs.length).toBe(1);
    });

    it("should preserve option values when adding new options", () => {
      renderWithRouter(<CreatePoll />);
      const firstOption = screen.getByPlaceholderText("Option 1");
      fireEvent.change(firstOption, { target: { value: "First choice" } });

      fireEvent.click(screen.getByText("+ Add Option"));

      expect(screen.getByDisplayValue("First choice")).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should show error when title is empty on save", async () => {
      renderWithRouter(<CreatePoll />);

      // Add two options to pass that validation
      fireEvent.click(screen.getByText("+ Add Option"));
      const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
      fireEvent.change(optionInputs[0], { target: { value: "Option A" } });
      fireEvent.change(optionInputs[1], { target: { value: "Option B" } });

      fireEvent.click(screen.getByText("Save Draft"));

      await waitFor(() => {
        expect(screen.getByText("Poll title is required")).toBeInTheDocument();
      });
    });

    it("should show error when less than 2 options on save", async () => {
      renderWithRouter(<CreatePoll />);

      const titleInput = screen.getByLabelText("Poll Title *");
      fireEvent.change(titleInput, { target: { value: "Test Poll" } });

      const optionInput = screen.getByPlaceholderText("Option 1");
      fireEvent.change(optionInput, { target: { value: "Only one option" } });

      fireEvent.click(screen.getByText("Save Draft"));

      await waitFor(() => {
        expect(
          screen.getByText("Poll must have at least 2 options")
        ).toBeInTheDocument();
      });
    });

    it("should show error when options are empty strings", async () => {
      renderWithRouter(<CreatePoll />);

      const titleInput = screen.getByLabelText("Poll Title *");
      fireEvent.change(titleInput, { target: { value: "Test Poll" } });

      fireEvent.click(screen.getByText("+ Add Option"));
      // Leave both options empty

      fireEvent.click(screen.getByText("Save Draft"));

      await waitFor(() => {
        expect(
          screen.getByText("Poll must have at least 2 options")
        ).toBeInTheDocument();
      });
    });

    it("should clear title error when user types in title", async () => {
      renderWithRouter(<CreatePoll />);

      // Trigger validation error
      fireEvent.click(screen.getByText("+ Add Option"));
      const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
      fireEvent.change(optionInputs[0], { target: { value: "Option A" } });
      fireEvent.change(optionInputs[1], { target: { value: "Option B" } });
      fireEvent.click(screen.getByText("Save Draft"));

      await waitFor(() => {
        expect(screen.getByText("Poll title is required")).toBeInTheDocument();
      });

      // Type in title to clear error
      const titleInput = screen.getByLabelText("Poll Title *");
      fireEvent.change(titleInput, { target: { value: "T" } });

      await waitFor(() => {
        expect(
          screen.queryByText("Poll title is required")
        ).not.toBeInTheDocument();
      });
    });

    it("should clear options error when user types in option", async () => {
      renderWithRouter(<CreatePoll />);

      const titleInput = screen.getByLabelText("Poll Title *");
      fireEvent.change(titleInput, { target: { value: "Test Poll" } });
      fireEvent.click(screen.getByText("Save Draft"));

      await waitFor(() => {
        expect(
          screen.getByText("Poll must have at least 2 options")
        ).toBeInTheDocument();
      });

      // Add options to clear error
      fireEvent.click(screen.getByText("+ Add Option"));
      const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
      fireEvent.change(optionInputs[0], { target: { value: "Option A" } });

      await waitFor(() => {
        expect(
          screen.queryByText("Poll must have at least 2 options")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Save Draft", () => {
    it("should call API with correct data on save draft", async () => {
      axios.post.mockResolvedValueOnce({ data: { id: 1 } });
      renderWithRouter(<CreatePoll />);

      // Fill form
      fireEvent.change(screen.getByLabelText("Poll Title *"), {
        target: { value: "My Poll" },
      });
      fireEvent.change(screen.getByLabelText("Description"), {
        target: { value: "Description text" },
      });
      fireEvent.click(screen.getByText("+ Add Option"));
      const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
      fireEvent.change(optionInputs[0], { target: { value: "Option A" } });
      fireEvent.change(optionInputs[1], { target: { value: "Option B" } });

      fireEvent.click(screen.getByText("Save Draft"));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining("/api/polls"),
          {
            title: "My Poll",
            description: "Description text",
            options: ["Option A", "Option B"],
            endDate: null,
          },
          expect.objectContaining({ withCredentials: true })
        );
      });
    });

    it("should navigate to my-polls after successful save", async () => {
      axios.post.mockResolvedValueOnce({ data: { id: 1 } });
      renderWithRouter(<CreatePoll />);

      // Fill form
      fireEvent.change(screen.getByLabelText("Poll Title *"), {
        target: { value: "My Poll" },
      });
      fireEvent.click(screen.getByText("+ Add Option"));
      const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
      fireEvent.change(optionInputs[0], { target: { value: "Option A" } });
      fireEvent.change(optionInputs[1], { target: { value: "Option B" } });

      fireEvent.click(screen.getByText("Save Draft"));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/my-polls");
      });
    });

    it("should show loading state while saving", async () => {
      axios.post.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { id: 1 } }), 100)
          )
      );
      renderWithRouter(<CreatePoll />);

      // Fill form
      fireEvent.change(screen.getByLabelText("Poll Title *"), {
        target: { value: "My Poll" },
      });
      fireEvent.click(screen.getByText("+ Add Option"));
      const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
      fireEvent.change(optionInputs[0], { target: { value: "Option A" } });
      fireEvent.change(optionInputs[1], { target: { value: "Option B" } });

      fireEvent.click(screen.getByText("Save Draft"));

      await waitFor(() => {
        expect(screen.getByText("Saving...")).toBeInTheDocument();
      });
    });

    it("should show error message on save failure", async () => {
      axios.post.mockRejectedValueOnce({
        response: { data: { message: "Server error" } },
      });
      renderWithRouter(<CreatePoll />);

      // Fill form
      fireEvent.change(screen.getByLabelText("Poll Title *"), {
        target: { value: "My Poll" },
      });
      fireEvent.click(screen.getByText("+ Add Option"));
      const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
      fireEvent.change(optionInputs[0], { target: { value: "Option A" } });
      fireEvent.change(optionInputs[1], { target: { value: "Option B" } });

      fireEvent.click(screen.getByText("Save Draft"));

      await waitFor(() => {
        expect(screen.getByText("Server error")).toBeInTheDocument();
      });
    });

    it("should show default error message when API returns no message", async () => {
      axios.post.mockRejectedValueOnce({ response: {} });
      renderWithRouter(<CreatePoll />);

      // Fill form
      fireEvent.change(screen.getByLabelText("Poll Title *"), {
        target: { value: "My Poll" },
      });
      fireEvent.click(screen.getByText("+ Add Option"));
      const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
      fireEvent.change(optionInputs[0], { target: { value: "Option A" } });
      fireEvent.change(optionInputs[1], { target: { value: "Option B" } });

      fireEvent.click(screen.getByText("Save Draft"));

      await waitFor(() => {
        expect(
          screen.getByText("Failed to create poll. Try again.")
        ).toBeInTheDocument();
      });
    });

    it("should include endDate when provided", async () => {
      axios.post.mockResolvedValueOnce({ data: { id: 1 } });
      renderWithRouter(<CreatePoll />);

      // Fill form
      fireEvent.change(screen.getByLabelText("Poll Title *"), {
        target: { value: "My Poll" },
      });
      fireEvent.change(screen.getByLabelText("Poll Close Date (Optional)"), {
        target: { value: "2026-02-01T12:00" },
      });
      fireEvent.click(screen.getByText("+ Add Option"));
      const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
      fireEvent.change(optionInputs[0], { target: { value: "Option A" } });
      fireEvent.change(optionInputs[1], { target: { value: "Option B" } });

      fireEvent.click(screen.getByText("Save Draft"));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining("/api/polls"),
          expect.objectContaining({
            endDate: "2026-02-01T12:00",
          }),
          expect.anything()
        );
      });
    });
  });

  // ...existing code...

  describe("Publish Poll", () => {
    it("should call API with status active on publish", async () => {
      const user = userEvent.setup();
      axios.post.mockResolvedValueOnce({ data: { id: 1 } });
      renderWithRouter(<CreatePoll />);

      // Fill form
      await user.type(screen.getByLabelText("Poll Title *"), "My Poll");
      await user.click(screen.getByText("+ Add Option"));
      const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
      await user.type(optionInputs[0], "Option A");
      await user.type(optionInputs[1], "Option B");

      // Click publish
      await user.click(screen.getByText("Publish Poll"));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining("/api/polls"),
          expect.objectContaining({
            title: "My Poll",
            status: "active",
          }),
          expect.objectContaining({ withCredentials: true })
        );
      });
    });

    it("should navigate to my-polls after successful publish", async () => {
      axios.post.mockResolvedValueOnce({ data: { id: 1 } });
      renderWithRouter(<CreatePoll />);

      // Fill form
      fireEvent.change(screen.getByLabelText("Poll Title *"), {
        target: { value: "My Poll" },
      });
      fireEvent.click(screen.getByText("+ Add Option"));
      const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
      fireEvent.change(optionInputs[0], { target: { value: "Option A" } });
      fireEvent.change(optionInputs[1], { target: { value: "Option B" } });

      fireEvent.click(screen.getByText("Publish Poll"));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/my-polls");
      });
    });

    it("should show loading state while publishing", async () => {
      axios.post.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { id: 1 } }), 100)
          )
      );
      renderWithRouter(<CreatePoll />);

      // Fill form
      fireEvent.change(screen.getByLabelText("Poll Title *"), {
        target: { value: "My Poll" },
      });
      fireEvent.click(screen.getByText("+ Add Option"));
      const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
      fireEvent.change(optionInputs[0], { target: { value: "Option A" } });
      fireEvent.change(optionInputs[1], { target: { value: "Option B" } });

      fireEvent.click(screen.getByText("Publish Poll"));

      await waitFor(() => {
        expect(screen.getByText("Publishing...")).toBeInTheDocument();
      });
    });

    it("should show error message on publish failure", async () => {
      axios.post.mockRejectedValueOnce({
        response: { data: { message: "Publish failed" } },
      });
      renderWithRouter(<CreatePoll />);

      // Fill form
      fireEvent.change(screen.getByLabelText("Poll Title *"), {
        target: { value: "My Poll" },
      });
      fireEvent.click(screen.getByText("+ Add Option"));
      const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
      fireEvent.change(optionInputs[0], { target: { value: "Option A" } });
      fireEvent.change(optionInputs[1], { target: { value: "Option B" } });

      fireEvent.click(screen.getByText("Publish Poll"));

      await waitFor(() => {
        expect(screen.getByText("Publish failed")).toBeInTheDocument();
      });
    });

    it("should validate form before publishing", async () => {
      renderWithRouter(<CreatePoll />);

      fireEvent.click(screen.getByText("Publish Poll"));

      await waitFor(() => {
        expect(screen.getByText("Poll title is required")).toBeInTheDocument();
      });

      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  describe("Cancel Button", () => {
    it("should navigate to my-polls when cancel is clicked", () => {
      renderWithRouter(<CreatePoll />);

      fireEvent.click(screen.getByText("Cancel"));

      expect(mockNavigate).toHaveBeenCalledWith("/my-polls");
    });
  });

  describe("Button States", () => {
    it("should disable buttons while loading", async () => {
      axios.post.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { id: 1 } }), 100)
          )
      );
      renderWithRouter(<CreatePoll />);

      // Fill form
      fireEvent.change(screen.getByLabelText("Poll Title *"), {
        target: { value: "My Poll" },
      });
      fireEvent.click(screen.getByText("+ Add Option"));
      const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
      fireEvent.change(optionInputs[0], { target: { value: "Option A" } });
      fireEvent.change(optionInputs[1], { target: { value: "Option B" } });

      fireEvent.click(screen.getByText("Save Draft"));

      await waitFor(() => {
        expect(screen.getByText("Saving...")).toBeDisabled();
      });
    });
  });

  describe("CSS Classes", () => {
    it("should apply create-poll-container class", () => {
      const { container } = renderWithRouter(<CreatePoll />);
      expect(
        container.querySelector(".create-poll-container")
      ).toBeInTheDocument();
    });

    it("should apply create-poll-form class", () => {
      const { container } = renderWithRouter(<CreatePoll />);
      expect(container.querySelector(".create-poll-form")).toBeInTheDocument();
    });

    it("should apply input-error class when title has error", async () => {
      renderWithRouter(<CreatePoll />);

      fireEvent.click(screen.getByText("+ Add Option"));
      const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
      fireEvent.change(optionInputs[0], { target: { value: "Option A" } });
      fireEvent.change(optionInputs[1], { target: { value: "Option B" } });
      fireEvent.click(screen.getByText("Save Draft"));

      await waitFor(() => {
        const titleInput = screen.getByLabelText("Poll Title *");
        expect(titleInput).toHaveClass("input-error");
      });
    });

    it("should apply btn-primary class to Save Draft button", () => {
      renderWithRouter(<CreatePoll />);
      const saveButton = screen.getByText("Save Draft");
      expect(saveButton).toHaveClass("btn-primary");
    });

    it("should apply btn-publish class to Publish Poll button", () => {
      renderWithRouter(<CreatePoll />);
      const publishButton = screen.getByText("Publish Poll");
      expect(publishButton).toHaveClass("btn-publish");
    });

    it("should apply btn-secondary class to Cancel button", () => {
      renderWithRouter(<CreatePoll />);
      const cancelButton = screen.getByText("Cancel");
      expect(cancelButton).toHaveClass("btn-secondary");
    });
  });

  describe("Accessibility", () => {
    it("should have form element", () => {
      const { container } = renderWithRouter(<CreatePoll />);
      expect(container.querySelector("form")).toBeInTheDocument();
    });

    it("should have labels for all form fields", () => {
      renderWithRouter(<CreatePoll />);
      expect(screen.getByLabelText("Poll Title *")).toBeInTheDocument();
      expect(screen.getByLabelText("Description")).toBeInTheDocument();
      expect(
        screen.getByLabelText("Poll Close Date (Optional)")
      ).toBeInTheDocument();
    });

    it("should have proper button types", () => {
      renderWithRouter(<CreatePoll />);
      const saveButton = screen.getByText("Save Draft");
      const publishButton = screen.getByText("Publish Poll");
      const cancelButton = screen.getByText("Cancel");

      expect(saveButton).toHaveAttribute("type", "button");
      expect(publishButton).toHaveAttribute("type", "button");
      expect(cancelButton).toHaveAttribute("type", "button");
    });
  });

  describe("Edge Cases", () => {
    it("should trim whitespace from title", async () => {
      axios.post.mockResolvedValueOnce({ data: { id: 1 } });
      renderWithRouter(<CreatePoll />);

      fireEvent.change(screen.getByLabelText("Poll Title *"), {
        target: { value: "  My Poll  " },
      });
      fireEvent.click(screen.getByText("+ Add Option"));
      const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
      fireEvent.change(optionInputs[0], { target: { value: "Option A" } });
      fireEvent.change(optionInputs[1], { target: { value: "Option B" } });

      fireEvent.click(screen.getByText("Save Draft"));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            title: "My Poll",
          }),
          expect.anything()
        );
      });
    });

    it("should filter out empty options", async () => {
      axios.post.mockResolvedValueOnce({ data: { id: 1 } });
      renderWithRouter(<CreatePoll />);

      fireEvent.change(screen.getByLabelText("Poll Title *"), {
        target: { value: "My Poll" },
      });
      fireEvent.click(screen.getByText("+ Add Option"));
      fireEvent.click(screen.getByText("+ Add Option"));
      const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
      fireEvent.change(optionInputs[0], { target: { value: "Option A" } });
      // Leave optionInputs[1] empty
      fireEvent.change(optionInputs[2], { target: { value: "Option B" } });

      fireEvent.click(screen.getByText("Save Draft"));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            options: ["Option A", "Option B"],
          }),
          expect.anything()
        );
      });
    });

    it("should handle whitespace-only title as empty", async () => {
      renderWithRouter(<CreatePoll />);

      fireEvent.change(screen.getByLabelText("Poll Title *"), {
        target: { value: "   " },
      });
      fireEvent.click(screen.getByText("+ Add Option"));
      const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
      fireEvent.change(optionInputs[0], { target: { value: "Option A" } });
      fireEvent.change(optionInputs[1], { target: { value: "Option B" } });

      fireEvent.click(screen.getByText("Save Draft"));

      await waitFor(() => {
        expect(screen.getByText("Poll title is required")).toBeInTheDocument();
      });
    });
  });
});
