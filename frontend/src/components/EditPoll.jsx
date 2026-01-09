import React from "react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../shared";
import "./EditPollStyles.css";

export default function EditPoll() {
  const navigate = useNavigate();
  const { pollId } = useParams();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    options: [],
    status: "draft",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/polls/${pollId}`, {
          withCredentials: true,
        });

        // If poll is closed, redirect to results page
        if (response.data.status === "closed") {
          navigate(`/polls/${pollId}/results`);
          return;
        }

        setFormData({
          title: response.data.title,
          description: response.data.description || "",
          options: (response.data.pollOptions || []).map((opt) => ({
            id: opt.id,
            text: opt.text,
          })),
          status: response.data.status,
        });
      } catch (error) {
        setErrors({
          general:
            error.response?.data?.message ||
            "Failed to load poll. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [pollId]);

  const isDraft = formData.status === "draft";

  const handleTitleChange = (e) => {
    if (!isDraft) return;
    setFormData({ ...formData, title: e.target.value });
    if (errors.title) setErrors({ ...errors, title: "" });
  };

  const handleDescriptionChange = (e) => {
    if (!isDraft) return;
    setFormData({ ...formData, description: e.target.value });
    if (errors.description) setErrors({ ...errors, description: "" });
  };

  const handleOptionChange = (index, value) => {
    if (!isDraft) return;
    const newOptions = [...formData.options];
    newOptions[index].text = value;
    setFormData({ ...formData, options: newOptions });
    if (errors.options) setErrors({ ...errors, options: "" });
  };

  const handleAddOption = () => {
    if (!isDraft) return;
    setFormData({
      ...formData,
      options: [
        ...formData.options,
        { id: `new-${crypto.randomUUID()}`, text: "" },
      ],
    });
  };

  const handleRemoveOption = (index) => {
    if (!isDraft || formData.options.length < 2) return;
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Poll title is required";
    }

    const nonEmptyOptions = formData.options.filter((opt) => opt.text.trim());
    if (nonEmptyOptions.length < 2) {
      newErrors.options = "Poll must have at least 2 options";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!isDraft) return;
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await axios.patch(
        `${API_URL}/api/polls/${pollId}`,
        {
          title: formData.title.trim(),
          description: formData.description.trim(),
          options: formData.options.map((opt) => ({
            id: opt.id,
            text: opt.text.trim(),
          })),
        },
        { withCredentials: true }
      );

      setErrors({ general: "Poll saved successfully!" });
    } catch (error) {
      setErrors({
        general:
          error.response?.data?.message || "Failed to save poll. Try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!isDraft) return;
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await axios.patch(
        `${API_URL}/api/polls/${pollId}/publish`,
        {},
        { withCredentials: true }
      );

      setFormData({ ...formData, status: response.data.status });
      setErrors({ general: "Poll published successfully!" });
    } catch (error) {
      setErrors({
        general:
          error.response?.data?.message || "Failed to publish poll. Try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this poll?")) return;

    setSubmitting(true);
    try {
      await axios.delete(`${API_URL}/api/polls/${pollId}`, {
        withCredentials: true,
      });
      navigate("/");
    } catch (error) {
      setErrors({
        general:
          error.response?.data?.message || "Failed to delete poll. Try again.",
      });
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading poll...</div>;
  }

  return (
    <div className="edit-poll-container">
      <h1>{isDraft ? "Edit Poll" : "View Poll"}</h1>
      <div className={`status-badge status-${formData.status}`}>
        {formData.status.toUpperCase()}
      </div>

      <form onSubmit={handleSave} className="edit-poll-form">
        {errors.general && (
          <div
            className={`message ${
              errors.general.includes("success") ? "success" : "error"
            }`}
          >
            {errors.general}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="title">Poll Title *</label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={handleTitleChange}
            disabled={!isDraft}
            className={`${errors.title ? "input-error" : ""} ${
              !isDraft ? "input-disabled" : ""
            }`}
          />
          {errors.title && <span className="field-error">{errors.title}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={handleDescriptionChange}
            disabled={!isDraft}
            rows="4"
            className={!isDraft ? "input-disabled" : ""}
          />
          {errors.description && (
            <span className="field-error">{errors.description}</span>
          )}
        </div>

        <div className="form-group">
          <label>Poll Options *</label>
          {formData.options.map((option, index) => (
            <div key={option.id || index} className="option-input-group">
              <input
                type="text"
                value={option.text}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                disabled={!isDraft}
                className={`${errors.options ? "input-error" : ""} ${
                  !isDraft ? "input-disabled" : ""
                }`}
              />
              {isDraft && formData.options.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(index)}
                  className="btn-remove-option"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {errors.options && (
            <span className="field-error">{errors.options}</span>
          )}
          {isDraft && (
            <button
              type="button"
              onClick={handleAddOption}
              className="btn-add-option"
            >
              + Add Option
            </button>
          )}
        </div>

        <div className="form-actions">
          {isDraft && (
            <>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={submitting}
                className="btn-publish"
              >
                {submitting ? "Publishing..." : "Publish Poll"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="btn-danger"
              >
                {submitting ? "Deleting..." : "Delete Poll"}
              </button>
            </>
          )}
          {!isDraft && (
            <>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="btn-danger"
              >
                {submitting ? "Deleting..." : "Delete Poll"}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="btn-secondary"
          >
            Back
          </button>
        </div>
      </form>
    </div>
  );
}
