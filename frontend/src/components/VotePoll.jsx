import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../shared";
import "./VotePollStyles.css";

export default function VotePoll({ user }) {
  const navigate = useNavigate();
  const { pollId, slug } = useParams();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [rankedChoices, setRankedChoices] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [copyLinkFeedback, setCopyLinkFeedback] = useState("");
  const isShareableRoute = !!slug;

  useEffect(() => {
    console.log("VotePoll component mounted", {
      pollId,
      slug,
      isShareableRoute,
      user: user ? user.id : "not logged in",
    });
  }, []);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        let response;

        if (isShareableRoute) {
          // Fetch via public vote link (no auth required)
          console.log("Fetching poll by ID for sharing:", pollId);
          response = await axios.get(`${API_URL}/api/polls/vote/${pollId}`);
          console.log("Poll fetched successfully:", response.data);
        } else {
          // Fetch via poll ID (authenticated)
          console.log("Fetching poll by ID:", pollId);
          response = await axios.get(`${API_URL}/api/polls/${pollId}`, {
            withCredentials: true,
          });
          console.log("Poll fetched successfully:", response.data);
        }

        // Only allow voting on active polls
        if (response.data.status !== "active") {
          console.log("Poll is not active, navigating home");
          navigate("/");
          return;
        }

        setPoll(response.data);

        // Only check existing vote if user is logged in
        if (user && !isShareableRoute) {
          try {
            const ballotResponse = await axios.get(
              `${API_URL}/api/ballots/${pollId}`,
              { withCredentials: true }
            );
            if (ballotResponse.data) {
              setRankedChoices(ballotResponse.data.rankedChoices);
              setHasVoted(true);
            }
          } catch {
            // No ballot found (user hasn't voted yet)
            setHasVoted(false);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching poll:", err);
        const errorMsg =
          err.response?.data?.error || "Failed to load poll. Please try again.";
        console.error("Setting error:", errorMsg);
        setError(errorMsg);
        setLoading(false);
      }
    };

    fetchPoll();
  }, [pollId, slug, isShareableRoute, navigate, user]);

  const handleOptionClick = (optionId) => {
    // Don't allow editing if already voted
    if (hasVoted) return;

    setRankedChoices((prev) => {
      // If option is already ranked, remove it
      if (prev.includes(optionId)) {
        return prev.filter((id) => id !== optionId);
      }
      // Otherwise add it to the end
      return [...prev, optionId];
    });
  };

  const getRankingPosition = (optionId) => {
    const position = rankedChoices.indexOf(optionId);
    if (position === -1) return null;
    return position + 1;
  };

  const handleCopyLink = () => {
    if (!poll) return;
    const shareLink = `${window.location.origin}/vote/${poll.id}/${poll.slug}`;
    navigator.clipboard
      .writeText(shareLink)
      .then(() => {
        setCopyLinkFeedback("Link copied to clipboard!");
        setTimeout(() => setCopyLinkFeedback(""), 2000);
      })
      .catch(() => {
        setCopyLinkFeedback("Failed to copy link");
        setTimeout(() => setCopyLinkFeedback(""), 2000);
      });
  };

  const handleSubmitVote = async () => {
    if (!user) {
      alert("You must be logged in to vote");
      navigate("/login");
      return;
    }

    if (rankedChoices.length === 0) {
      setError("Please rank at least one option");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${API_URL}/api/ballots`,
        {
          pollId,
          rankedChoices,
        },
        {
          withCredentials: true,
        }
      );

      setHasVoted(true);
      setError("");
      alert("Vote submitted successfully!");
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || "Failed to submit vote. Please try again.";
      setError(errorMsg);
      console.error("Error submitting vote:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="vote-poll-container">
        <div className="loading">Loading poll...</div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="vote-poll-container">
        <div className="error">Poll not found or is no longer available</div>
      </div>
    );
  }

  return (
    <div className="vote-poll-container">
      <div className="vote-poll-header">
        <div className="vote-poll-title-section">
          <h1>{poll.title}</h1>
          {poll.description && (
            <p className="vote-description">{poll.description}</p>
          )}
        </div>
      </div>

      {error && <div className="vote-error-message">{error}</div>}

      {copyLinkFeedback && (
        <div className="copy-feedback">{copyLinkFeedback}</div>
      )}

      {isShareableRoute && (
        <div className="vote-share-section">
          <button
            className="btn-copy-link"
            onClick={handleCopyLink}
            disabled={!poll.slug}
          >
            📋 Copy Shareable Link
          </button>
        </div>
      )}

      <div className="vote-options">
        {poll.pollOptions && poll.pollOptions.length > 0 ? (
          poll.pollOptions.map((option) => (
            <div
              key={option.id}
              className={`vote-option ${
                rankedChoices.includes(option.id) ? "selected" : ""
              }`}
              onClick={() => handleOptionClick(option.id)}
            >
              <div className="vote-option-content">
                <span className="vote-option-text">{option.text}</span>
                {getRankingPosition(option.id) && (
                  <span className="vote-option-rank">
                    #{getRankingPosition(option.id)}
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="vote-options-placeholder">
            <p>No options available</p>
          </div>
        )}
      </div>

      {!hasVoted && (
        <button
          className="btn-submit-vote"
          onClick={handleSubmitVote}
          disabled={rankedChoices.length === 0 || submitting}
        >
          {submitting ? "Submitting..." : "Submit Vote"}
        </button>
      )}

      {hasVoted && (
        <div className="vote-login-banner">
          <div className="vote-login-banner-content">
            <p>✓ You have already voted on this poll</p>
          </div>
        </div>
      )}
    </div>
  );
}
