import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../shared";
import "./ResultsStyles.css";

export default function Results() {
  const navigate = useNavigate();
  const { pollId } = useParams();
  const [poll, setPoll] = useState(null);
  const [ballots, setBallots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rounds, setRounds] = useState([]);
  const [winner, setWinner] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchPollAndResults = async () => {
      try {
        // Get poll details
        const pollResponse = await axios.get(`${API_URL}/api/polls/${pollId}`, {
          withCredentials: true,
        });
        const poll = pollResponse.data;
        setPoll(poll);

        // Permission logic:
        // - Closed polls: anyone can view results
        // - Active polls: only owner can view results (backend will deny ballots endpoint)
        if (poll.status === "active") {
          // For active polls, try to fetch ballots (backend will check ownership)
          try {
            const ballotsResponse = await axios.get(
              `${API_URL}/api/polls/${pollId}/ballots`,
              { withCredentials: true }
            );
            const ballotList = ballotsResponse.data;
            setBallots(ballotList);

            // Calculate instant runoff voting results
            if (ballotList.length > 0) {
              const options = poll.pollOptions || poll.options || [];
              const result = calculateInstantRunoff(ballotList, options);
              setRounds(result.rounds);
              setWinner(result.winner);
            }
            setIsOwner(true);
          } catch (err) {
            if (err.response?.status === 403) {
              setError("Only the poll owner can view results for active polls");
            } else {
              setError(err.response?.data?.error || "Failed to load results");
            }
            setLoading(false);
            return;
          }
        } else if (poll.status === "closed") {
          // For closed polls, anyone can view results
          try {
            const ballotsResponse = await axios.get(
              `${API_URL}/api/polls/${pollId}/ballots`,
              { withCredentials: true }
            );
            const ballotList = ballotsResponse.data;
            setBallots(ballotList);

            // Calculate instant runoff voting results
            if (ballotList.length > 0) {
              const options = poll.pollOptions || poll.options || [];
              const result = calculateInstantRunoff(ballotList, options);
              setRounds(result.rounds);
              setWinner(result.winner);
            }
          } catch (err) {
            console.error("Error fetching ballots:", err);
          }
          setIsOwner(true); // Allow viewing for closed polls
        }

        setLoading(false);
      } catch (err) {
        setError(
          err.response?.data?.error ||
            "Failed to load results. Please try again."
        );
        setLoading(false);
      }
    };

    fetchPollAndResults();
  }, [pollId]);

  const calculateInstantRunoff = (ballotList, options) => {
    if (!ballotList || ballotList.length === 0) {
      return { rounds: [], winner: null };
    }

    const rounds = [];
    let remainingOptions = new Set(options.map((opt) => opt.id));
    let currentBallots = ballotList.map((ballot) => ({
      ...ballot,
      preferences: ballot.rankedChoices,
    }));

    let round = 0;
    let winner = null;

    while (
      remainingOptions.size > 1 &&
      currentBallots.length > 0 &&
      round < 10
    ) {
      round++;
      const voteCounts = {};
      const voterPreferences = {};

      // Initialize vote counts
      remainingOptions.forEach((optId) => {
        voteCounts[optId] = 0;
        voterPreferences[optId] = [];
      });

      // Count first preferences
      currentBallots.forEach((ballot, idx) => {
        let firstPreference = null;
        for (let prefId of ballot.preferences) {
          if (remainingOptions.has(prefId)) {
            firstPreference = prefId;
            break;
          }
        }
        if (firstPreference !== null) {
          voteCounts[firstPreference]++;
          voterPreferences[firstPreference].push(idx);
        }
      });

      // Find the option with the most votes
      let maxVotes = Math.max(...Object.values(voteCounts));
      const optionsWithMaxVotes = Object.entries(voteCounts)
        .filter(([_, count]) => count === maxVotes)
        .map(([optId]) => optId);

      // Check for majority (over 50%)
      const majorityThreshold = currentBallots.length / 2;
      const majoritiesReached = Object.entries(voteCounts).filter(
        ([_, count]) => count > majorityThreshold
      );

      if (majoritiesReached.length > 0) {
        winner = parseInt(majoritiesReached[0][0]);
        break;
      }

      // Store round results
      const roundData = {
        roundNumber: round,
        votesByOption: {},
      };
      remainingOptions.forEach((optId) => {
        const option = options.find((o) => o.id === optId);
        roundData.votesByOption[optId] = {
          optionText: option?.text || "Unknown",
          votes: voteCounts[optId],
          percentage:
            currentBallots.length > 0
              ? ((voteCounts[optId] / currentBallots.length) * 100).toFixed(1)
              : 0,
        };
      });
      rounds.push(roundData);

      // Eliminate the option(s) with the fewest votes
      const minVotes = Math.min(...Object.values(voteCounts));
      const optionsToEliminate = Object.entries(voteCounts)
        .filter(([_, count]) => count === minVotes)
        .map(([optId]) => optId);

      optionsToEliminate.forEach((optId) => {
        remainingOptions.delete(parseInt(optId));
      });
    }

    // If one option remains, it's the winner
    if (remainingOptions.size === 1 && !winner) {
      winner = parseInt([...remainingOptions][0]);
    }

    return { rounds, winner };
  };

  if (loading) {
    return (
      <div className="results-container">
        <div className="loading-spinner">Loading results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-container">
        <div className="error-message">{error}</div>
        <button className="back-button" onClick={() => navigate("/my-polls")}>
          Back to My Polls
        </button>
      </div>
    );
  }

  if (!poll || !isOwner) {
    return (
      <div className="results-container">
        <div className="error-message">Access denied</div>
      </div>
    );
  }

  const pollOptions = poll.pollOptions || poll.options || [];
  const winnerOption = pollOptions.find((opt) => opt.id === winner);

  return (
    <div className="results-container">
      <div className="results-header">
        <h1>{poll.title}</h1>
        <p className="results-description">{poll.description}</p>
        <div className="results-meta">
          <div className="vote-count">
            <span className="vote-icon">🗳️</span>
            <span>{ballots.length} votes cast</span>
          </div>
          <div className="poll-status">
            <span className={`status-badge ${poll.status}`}>
              {poll.status.charAt(0).toUpperCase() + poll.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {ballots.length === 0 ? (
        <div className="no-votes-message">
          <p>No votes have been cast yet.</p>
        </div>
      ) : (
        <div className="results-content">
          {rounds.length > 0 && (
            <div className="rounds-container">
              <h2>Instant Runoff Voting Rounds</h2>
              {rounds.map((round) => (
                <div key={round.roundNumber} className="round">
                  <h3>Round {round.roundNumber}</h3>
                  <div className="round-results">
                    {Object.entries(round.votesByOption).map(
                      ([optId, data]) => (
                        <div key={optId} className="option-result">
                          <div className="option-header">
                            <span className="option-text">
                              {data.optionText}
                            </span>
                            <span className="vote-count">
                              {data.votes} vote{data.votes !== 1 ? "s" : ""} (
                              {data.percentage}%)
                            </span>
                          </div>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${data.percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {winner && (
            <div className="winner-section">
              <h2>🏆 Winner</h2>
              <div className="winner-card">
                <p className="winner-text">{winnerOption?.text || "Unknown"}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="results-actions">
        <button className="back-button" onClick={() => navigate("/my-polls")}>
          Back to My Polls
        </button>
      </div>
    </div>
  );
}
