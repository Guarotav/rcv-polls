import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../shared";
import "./MyPollsStyles.css";

export default function MyPolls() {
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, draft, active, closed
  const [copiedPollId, setCopiedPollId] = useState(null);

  useEffect(() => {
    fetchMyPolls();
  }, []);

  const fetchMyPolls = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/polls/my-polls`, {
        withCredentials: true,
      });
      setPolls(response.data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to load your polls. Try again."
      );
      setPolls([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPolls =
    filter === "all" ? polls : polls.filter((poll) => poll.status === filter);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleCopyLink = (poll) => {
    if (!poll.slug) return;

    const shareLink = `${window.location.origin}/vote/${poll.id}/${poll.slug}`;
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopiedPollId(poll.id);
      setTimeout(() => setCopiedPollId(null), 2000);
    });
  };

  if (loading) {
    return <div className="loading">Loading your polls...</div>;
  }

  return (
    <div className="my-polls-container">
      <div className="my-polls-header">
        <h1>My Polls</h1>
        <button
          onClick={() => navigate("/polls/create")}
          className="btn-create-new"
        >
          + Create New Poll
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({polls.length})
        </button>
        <button
          className={`filter-tab ${filter === "draft" ? "active" : ""}`}
          onClick={() => setFilter("draft")}
        >
          Draft ({polls.filter((p) => p.status === "draft").length})
        </button>
        <button
          className={`filter-tab ${filter === "active" ? "active" : ""}`}
          onClick={() => setFilter("active")}
        >
          Active ({polls.filter((p) => p.status === "active").length})
        </button>
        <button
          className={`filter-tab ${filter === "closed" ? "active" : ""}`}
          onClick={() => setFilter("closed")}
        >
          Closed ({polls.filter((p) => p.status === "closed").length})
        </button>
      </div>

      {filteredPolls.length === 0 ? (
        <div className="empty-state">
          <p>
            {filter === "all"
              ? "You haven't created any polls yet."
              : `No ${filter} polls.`}
          </p>
          <button
            onClick={() => navigate("/polls/create")}
            className="btn-create-new"
          >
            Create Your First Poll
          </button>
        </div>
      ) : (
        <div className="polls-list">
          {filteredPolls.map((poll) => (
            <div key={poll.id} className={`poll-item status-${poll.status}`}>
              <div className="poll-item-header">
                <div className="poll-info">
                  <h3>{poll.title}</h3>
                  <span className={`status-badge status-${poll.status}`}>
                    {poll.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {poll.description && (
                <p className="poll-description">{poll.description}</p>
              )}

              <div className="poll-meta">
                <span className="option-count">
                  {poll.options?.length || 0} options
                </span>
                {poll.activatedAt && (
                  <span className="activated-date">
                    Active since {formatDate(poll.activatedAt)}
                  </span>
                )}
                {poll.endDate && (
                  <span className="end-date">
                    Ends {formatDate(poll.endDate)}
                  </span>
                )}
              </div>

              <div className="poll-actions">
                <button
                  onClick={() =>
                    poll.status === "active"
                      ? navigate(`/polls/${poll.id}/vote`)
                      : navigate(`/polls/${poll.id}`)
                  }
                  className="btn-view"
                >
                  {poll.status === "draft"
                    ? "Edit"
                    : poll.status === "active"
                    ? "Vote"
                    : "View"}
                </button>
                {poll.status === "active" && poll.slug && (
                  <button
                    onClick={() => handleCopyLink(poll)}
                    className="btn-share-link"
                    title="Copy shareable link"
                  >
                    {copiedPollId === poll.id ? "✓ Copied!" : "📋 Share"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
