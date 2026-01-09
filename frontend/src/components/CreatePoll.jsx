import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../shared";
import "./CreatePollStyles.css";

export default function CreatePoll() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    options: [""],
    endDate: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleTitleChange = (e) => {
    setFormData({ ...formData, title: e.target.value });
    if (errors.title) setErrors({ ...errors, title: "" });
  };

  const handleDescriptionChange = (e) => {
    setFormData({ ...formData, description: e.target.value });
    if (errors.description) setErrors({ ...errors, description: "" });
  };

  const handleEndDateChange = (e) => {
    setFormData({ ...formData, endDate: e.target.value });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
    if (errors.options) setErrors({ ...errors, options: "" });
  };

  const handleAddOption = () => {
    setFormData({ ...formData, options: [...formData.options, ""] });
  };

  const handleRemoveOption = (index) => {
    if (formData.options.length > 1) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({ ...formData, options: newOptions });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Poll title is required";
    }

    const nonEmptyOptions = formData.options.filter((opt) => opt.trim());
    if (nonEmptyOptions.length < 2) {
      newErrors.options = "Poll must have at least 2 options";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    return true;
  };

  const handleSaveDraft = async (e) => {
    e && e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/polls`,
        {
          title: formData.title.trim(),
          description: formData.description.trim(),
          options: formData.options.filter((opt) => opt.trim()),
          endDate: formData.endDate || null,
        },
        { withCredentials: true }
      );

      navigate(`/my-polls`);
    } catch (error) {
      setErrors({
        general:
          error.response?.data?.message || "Failed to create poll. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (e) => {
    e && e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/polls`,
        {
          title: formData.title.trim(),
          description: formData.description.trim(),
          options: formData.options.filter((opt) => opt.trim()),
          endDate: formData.endDate || null,
          status: "active",
        },
        { withCredentials: true }
      );

      navigate(`/my-polls`);
    } catch (error) {
      setErrors({
        general:
          error.response?.data?.message || "Failed to publish poll. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-poll-container">
      <h1>Create a New Poll</h1>
      <form className="create-poll-form">
        {errors.general && (
          <div className="error-message">{errors.general}</div>
        )}

        <div className="form-group">
          <label htmlFor="title">Poll Title *</label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={handleTitleChange}
            placeholder="Enter your poll question"
            className={errors.title ? "input-error" : ""}
          />
          {errors.title && <span className="field-error">{errors.title}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={handleDescriptionChange}
            placeholder="Add more details about your poll (optional)"
            rows="4"
          />
          {errors.description && (
            <span className="field-error">{errors.description}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="endDate">Poll Close Date (Optional)</label>
          <input
            id="endDate"
            type="datetime-local"
            value={formData.endDate}
            onChange={handleEndDateChange}
          />
        </div>

        <div className="form-group">
          <label>Poll Options *</label>
          {formData.options.map((option, index) => (
            <div key={index} className="option-input-group">
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className={errors.options ? "input-error" : ""}
              />
              {formData.options.length > 1 && (
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
          <button
            type="button"
            onClick={handleAddOption}
            className="btn-add-option"
          >
            + Add Option
          </button>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? "Saving..." : "Save Draft"}
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={loading}
            className="btn-publish"
          >
            {loading ? "Publishing..." : "Publish Poll"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/my-polls")}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
