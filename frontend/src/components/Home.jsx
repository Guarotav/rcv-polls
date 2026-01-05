import React from "react";
import "./HomeStyles.css";

const Home = () => {
  // Dummy poll data to represent how polls would appear when logged in
  const dummyPolls = [
    {
      id: 1,
      title: "Favorite Programming Language",
      description:
        "Which programming language do you prefer for web development?",
      options: ["JavaScript", "Python", "Java", "TypeScript"],
      totalVotes: 127,
      status: "active",
      endDate: new Date("2024-12-31"),
    },
    {
      id: 2,
      title: "Best Framework for 2024",
      description: "What's your go-to framework for building web applications?",
      options: ["React", "Vue", "Angular", "Svelte"],
      totalVotes: 89,
      status: "active",
      endDate: new Date("2025-01-15"),
    },
    {
      id: 3,
      title: "Preferred Database",
      description: "Which database technology do you use most frequently?",
      options: ["PostgreSQL", "MongoDB", "MySQL", "Redis"],
      totalVotes: 156,
      status: "closed",
      endDate: new Date("2024-11-30"),
    },
  ];

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="home">
      <div className="home-header">
        <h1>Ranked Voting</h1>
        <p className="home-subtitle">
          Participate in ranked choice voting polls
        </p>
      </div>

      <div className="polls-container">
        <h2 className="polls-section-title">Active Polls</h2>
        <div className="polls-grid">
          {dummyPolls.map((poll) => (
            <div key={poll.id} className={`poll-card ${poll.status}`}>
              <div className="poll-header">
                <h3 className="poll-title">{poll.title}</h3>
                <span className={`poll-status ${poll.status}`}>
                  {poll.status}
                </span>
              </div>
              <p className="poll-description">{poll.description}</p>
              <div className="poll-options">
                <p className="poll-options-label">Options:</p>
                <ul className="poll-options-list">
                  {poll.options.map((option, index) => (
                    <li key={index} className="poll-option">
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="poll-footer">
                <span className="poll-votes">{poll.totalVotes} votes</span>
                <span className="poll-date">
                  {poll.status === "active" ? "Closes on: " : "Closed on: "}
                  {formatDate(poll.endDate)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
