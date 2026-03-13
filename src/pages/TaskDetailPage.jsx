import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as tasksApi from "../api/tasks.js";
import * as eventsApi from "../api/events.js";

const STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED"];

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignForm, setAssignForm] = useState({ username: "" });
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("PENDING");
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");

  const loadTask = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await tasksApi.getTaskDetails(taskId);
      setTask(data);
      setStatus(data?.status || "PENDING");
    } catch (err) {
      setError(err.message || "Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async (eventId) => {
    setMembersLoading(true);
    setMembersError("");
    try {
      const eventData = await eventsApi.getEventById(eventId);
      setMembers(eventData?.members || []);
    } catch (err) {
      setMembersError(err.message || "Failed to load members");
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [taskId]);

  useEffect(() => {
    if (task?.eventId) {
      loadMembers(task.eventId);
    }
  }, [task?.eventId]);

  const handleAssign = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await tasksApi.assignTask(taskId, {
        username: assignForm.username.trim()
      });
      setAssignForm({ username: "" });
      await loadTask();
    } catch (err) {
      setError(err.message || "Failed to assign task");
    }
  };

  const handleProgressUpdate = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await tasksApi.updateTaskProgress(taskId, {
        progress: Number(progress)
      });
      await loadTask();
    } catch (err) {
      setError(err.message || "Failed to update progress");
    }
  };

  const handleStatusUpdate = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await tasksApi.updateTaskStatus(taskId, { status });
      await loadTask();
    } catch (err) {
      setError(err.message || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this task?");
    if (!confirmed) {
      return;
    }
    setError("");
    try {
      await tasksApi.deleteTask(taskId);
      navigate(-1);
    } catch (err) {
      setError(err.message || "Failed to delete task");
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="card">Loading task...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="page">
        <div className="card error">{error || "Task not found"}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>{task.title}</h2>
            <p>{task.description || "No description yet."}</p>
          </div>
          <div className="panel-actions">
            <button className="btn ghost" onClick={() => navigate(-1)}>
              Back
            </button>
            <button className="btn danger" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>
        {error ? <div className="form-error">{error}</div> : null}

        <div className="grid">
          <div className="card">
            <div className="card-title">Assignments</div>
            {membersLoading ? (
              <div className="card-meta">Loading members...</div>
            ) : null}
            {membersError ? <div className="form-error">{membersError}</div> : null}
            <form className="inline-form" onSubmit={handleAssign}>
              {members.length ? (
                <select
                  name="username"
                  value={assignForm.username}
                  onChange={(event) =>
                    setAssignForm({ username: event.target.value })
                  }
                  required
                >
                  <option value="">Select member</option>
                  {members.map((member) => (
                    <option
                      key={member.id}
                      value={member.user?.username || ""}
                    >
                      {member.user?.name || "Member"}{" "}
                      {member.user?.username
                        ? `(@${member.user.username})`
                        : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name="username"
                  value={assignForm.username}
                  onChange={(event) =>
                    setAssignForm({ username: event.target.value })
                  }
                  placeholder="Username"
                  required
                />
              )}
              <button className="btn primary" type="submit">
                Assign
              </button>
            </form>
            <div className="list">
              {task.assignments?.length ? (
                task.assignments.map((assignment) => (
                  <div key={assignment.id} className="list-item">
                    <div>
                      <div className="list-title">
                        {assignment.user?.name || "Member"}
                      </div>
                      <div className="list-meta">
                        {assignment.user?.email || "No email"}
                      </div>
                    </div>
                    <div className="badge">{assignment.progress}%</div>
                  </div>
                ))
              ) : (
                <div className="card muted">No assignments yet.</div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Update status</div>
            <form className="form" onSubmit={handleStatusUpdate}>
              <label className="field">
                <span>Status</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  {STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn primary" type="submit">
                Save status
              </button>
            </form>
          </div>

          <div className="card">
            <div className="card-title">Update progress</div>
            <form className="form" onSubmit={handleProgressUpdate}>
              <label className="field">
                <span>Progress (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(event) => setProgress(event.target.value)}
                />
              </label>
              <button className="btn primary" type="submit">
                Update progress
              </button>
            </form>
            <div className="card-meta">
              Progress updates require you to be assigned to this task.
            </div>
          </div>
        </div>

        <div className="card muted">
          Event ID: {task.eventId} · Created by: {task.createdBy}
        </div>
        <Link to={`/events/${task.eventId}`} className="btn ghost">
          Go to event
        </Link>
      </section>
    </div>
  );
}
