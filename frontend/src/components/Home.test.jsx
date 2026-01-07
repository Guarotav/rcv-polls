import React from "react";
import { render, screen } from "@testing-library/react";
import Home from "./Home";

describe("Home", () => {
  it("renders the Ranked Voting title", () => {
    render(<Home />);
    expect(screen.getByText("Ranked Voting")).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    render(<Home />);
    expect(
      screen.getByText("Participate in ranked choice voting polls")
    ).toBeInTheDocument();
  });

  it("renders the Active Polls section title", () => {
    render(<Home />);
    expect(screen.getByText("Active Polls")).toBeInTheDocument();
  });

  it("renders all poll cards", () => {
    render(<Home />);

    expect(
      screen.getByText("Favorite Programming Language")
    ).toBeInTheDocument();
    expect(screen.getByText("Best Framework for 2024")).toBeInTheDocument();
    expect(screen.getByText("Preferred Database")).toBeInTheDocument();
  });

  it("renders poll descriptions", () => {
    render(<Home />);

    expect(
      screen.getByText(
        "Which programming language do you prefer for web development?"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "What's your go-to framework for building web applications?"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("Which database technology do you use most frequently?")
    ).toBeInTheDocument();
  });

  it("renders poll options", () => {
    render(<Home />);

    // Check options for first poll
    expect(screen.getByText("JavaScript")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("Java")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();

    // Check options for second poll
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Vue")).toBeInTheDocument();
    expect(screen.getByText("Angular")).toBeInTheDocument();
    expect(screen.getByText("Svelte")).toBeInTheDocument();

    // Check options for third poll
    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
    expect(screen.getByText("MongoDB")).toBeInTheDocument();
    expect(screen.getByText("MySQL")).toBeInTheDocument();
    expect(screen.getByText("Redis")).toBeInTheDocument();
  });

  it("renders vote counts", () => {
    render(<Home />);

    expect(screen.getByText("127 votes")).toBeInTheDocument();
    expect(screen.getByText("89 votes")).toBeInTheDocument();
    expect(screen.getByText("156 votes")).toBeInTheDocument();
  });

  it("renders status badges for active and closed polls", () => {
    render(<Home />);

    const activeStatuses = screen.getAllByText("active");
    const closedStatuses = screen.getAllByText("closed");

    expect(activeStatuses.length).toBe(2);
    expect(closedStatuses.length).toBe(1);
  });

  it("renders end dates with correct format for active polls", () => {
    render(<Home />);

    const closesOnTexts = screen.getAllByText(/Closes on:/);
    expect(closesOnTexts.length).toBe(2);

    // Check that dates are rendered with month names and years
    const allText = document.body.textContent || "";
    expect(allText).toMatch(/December/);
    expect(allText).toMatch(/January/);
    expect(allText).toMatch(/2024/);
    expect(allText).toMatch(/2025/);
  });

  it("renders end dates with correct format for closed polls", () => {
    render(<Home />);

    expect(screen.getByText(/Closed on:/)).toBeInTheDocument();
    expect(screen.getByText(/November/)).toBeInTheDocument();
  });

  it("renders Options label for all polls", () => {
    render(<Home />);

    const optionsLabels = screen.getAllByText("Options:");
    expect(optionsLabels.length).toBe(3);
  });

  it("applies correct CSS classes to poll cards", () => {
    const { container } = render(<Home />);

    const pollCards = container.querySelectorAll(".poll-card");
    expect(pollCards.length).toBe(3);

    const activePollCards = container.querySelectorAll(".poll-card.active");
    expect(activePollCards.length).toBe(2);

    const closedPollCards = container.querySelectorAll(".poll-card.closed");
    expect(closedPollCards.length).toBe(1);
  });
});
