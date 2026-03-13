import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as eventsApi from "../api/events.js";
import * as tasksApi from "../api/tasks.js";
import * as financeApi from "../api/finance.js";
import * as usersApi from "../api/users.js";
import * as notificationsApi from "../api/notifications.js";
import { useAuth } from "../context/AuthContext.jsx";

const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "FINANCE",
  "MANAGER",
  "VOLUNTEER",
  "VIEWER"
];

const STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED"];
const PAYMENT_METHODS = ["CASH", "UPI", "BANK_TRANSFER", "CARD"];
const DONATION_PAGE_SIZE = 5;
const EXPENSE_PAGE_SIZE = 5;

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [memberForm, setMemberForm] = useState({
    username: "",
    role: "VIEWER"
  });
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState([]);
  const [memberSearchLoading, setMemberSearchLoading] = useState(false);
  const [memberSearchError, setMemberSearchError] = useState("");
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: ""
  });
  const [eventForm, setEventForm] = useState({
    name: "",
    description: "",
    donationUpiId: "",
    fundingGoal: ""
  });

  const [financeSummary, setFinanceSummary] = useState(null);
  const [donations, setDonations] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeError, setFinanceError] = useState("");
  const [expensesError, setExpensesError] = useState("");
  const [donationQr, setDonationQr] = useState("");
  const [qrError, setQrError] = useState("");
  const [donationPage, setDonationPage] = useState(1);
  const [donationPagination, setDonationPagination] = useState(null);
  const [expensePage, setExpensePage] = useState(1);
  const [expensePagination, setExpensePagination] = useState(null);
  const [donationForm, setDonationForm] = useState({
    donorName: "",
    amount: "",
    paymentMethod: "CASH",
    referenceId: ""
  });
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: ""
  });
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    type: "GENERAL"
  });
  const [notificationError, setNotificationError] = useState("");
  const [notificationSuccess, setNotificationSuccess] = useState("");
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [verifyingDonationId, setVerifyingDonationId] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);

  const loadEvent = async () => {
    setLoading(true);
    setError("");
    try {
      const eventData = await eventsApi.getEventById(eventId);
      setEvent(eventData);
      setEventForm({
        name: eventData?.name || "",
        description: eventData?.description || "",
        donationUpiId: eventData?.donationUpiId || "",
        fundingGoal:
          eventData?.fundingGoal !== null && eventData?.fundingGoal !== undefined
            ? String(eventData.fundingGoal)
            : ""
      });
    } catch (err) {
      setError(err.message || "Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const data = await tasksApi.getEventTasks(eventId);
      setTasks(data || []);
    } catch (err) {
      setError(err.message || "Failed to load tasks");
    }
  };

  const loadFinance = async (options = {}) => {
    const donationPageToLoad = options.donationPage ?? donationPage;
    const expensePageToLoad = options.expensePage ?? expensePage;
    setFinanceLoading(true);
    setFinanceError("");
    setExpensesError("");
    try {
      const summary = await financeApi.getFinanceSummary(eventId);
      setFinanceSummary(summary);
    } catch (err) {
      setFinanceError(err.message || "Failed to load finance summary");
    }

    try {
      const donationPayload = await financeApi.getEventDonations(eventId, {
        page: donationPageToLoad,
        limit: DONATION_PAGE_SIZE
      });
      const donationList = Array.isArray(donationPayload)
        ? donationPayload
        : donationPayload?.donations;
      setDonations(donationList || []);
      setDonationPagination(
        donationPayload && !Array.isArray(donationPayload)
          ? donationPayload.pagination || null
          : null
      );
    } catch (err) {
      setFinanceError(err.message || "Failed to load donations");
    }

    try {
      const expensePayload = await financeApi.getEventExpenses(eventId, {
        page: expensePageToLoad,
        limit: EXPENSE_PAGE_SIZE
      });
      const expenseList = Array.isArray(expensePayload)
        ? expensePayload
        : expensePayload?.expenses;
      setExpenses(expenseList || []);
      setExpensePagination(
        expensePayload && !Array.isArray(expensePayload)
          ? expensePayload.pagination || null
          : null
      );
    } catch (err) {
      if (err?.status === 403) {
        setExpensesError("Expenses are restricted to finance/admin roles.");
      } else {
        setExpensesError(err.message || "Failed to load expenses");
      }
    } finally {
      setFinanceLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
    loadTasks();
  }, [eventId]);

  useEffect(() => {
    if (activeTab === "finance" || activeTab === "overview") {
      loadFinance();
    }
  }, [activeTab, eventId, donationPage, expensePage]);

  useEffect(() => {
    setDonationPage(1);
    setExpensePage(1);
  }, [eventId]);

  useEffect(() => {
    const query = memberSearch.trim();
    if (!query || query.length < 2) {
      setMemberResults([]);
      setMemberSearchError("");
      setMemberSearchLoading(false);
      return;
    }

    let isActive = true;
    setMemberSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await usersApi.searchUsers(query);
        if (!isActive) return;
        setMemberResults(data || []);
        setMemberSearchError("");
      } catch (err) {
        if (!isActive) return;
        setMemberSearchError(err.message || "Failed to search users");
      } finally {
        if (isActive) {
          setMemberSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [memberSearch]);

  const members = useMemo(() => event?.members || [], [event]);
  const currentMemberRole = useMemo(() => {
    if (!user?.username) return null;
    const current = members.find(
      (member) => member.user?.username === user.username
    );
    return current?.role || null;
  }, [members, user]);
  const canManageFinance = ["SUPER_ADMIN", "ADMIN", "FINANCE"].includes(
    currentMemberRole
  );
  const canManageNotifications = ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(
    currentMemberRole
  );
  const taskStats = useMemo(() => {
    const summary = { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0 };
    tasks.forEach((task) => {
      if (summary[task.status] !== undefined) {
        summary[task.status] += 1;
      }
    });
    return summary;
  }, [tasks]);
  const raisedAmount = financeSummary?.totalDonations ?? 0;
  const goalAmount = event?.fundingGoal ?? 0;
  const goalProgress = goalAmount
    ? Math.min(100, Math.round((raisedAmount / goalAmount) * 100))
    : 0;
  const formatAmount = (value) =>
    Number(value || 0).toLocaleString("en-IN");

  const handleEventChange = (event) => {
    const { name, value } = event.target;
    setEventForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMemberChange = (event) => {
    const { name, value } = event.target;
    setMemberForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMemberSearchChange = (event) => {
    setMemberSearch(event.target.value);
  };

  const handleTaskChange = (event) => {
    const { name, value } = event.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDonationChange = (event) => {
    const { name, value } = event.target;
    setDonationForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleExpenseChange = (event) => {
    const { name, value } = event.target;
    setExpenseForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (event) => {
    const { name, value } = event.target;
    setNotificationForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendNotification = async (event) => {
    event.preventDefault();
    setNotificationError("");
    setNotificationSuccess("");
    setNotificationLoading(true);
    try {
      await notificationsApi.createEventNotification(eventId, {
        title: notificationForm.title.trim(),
        message: notificationForm.message.trim(),
        type: notificationForm.type
      });
      setNotificationForm({
        title: "",
        message: "",
        type: notificationForm.type || "GENERAL"
      });
      setNotificationSuccess("Notification sent to event members.");
    } catch (err) {
      setNotificationError(err.message || "Failed to send notification");
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleUpdateEvent = async (event) => {
    event.preventDefault();
    setActionLoading(true);
    setError("");
    try {
      await eventsApi.updateEvent(eventId, {
        name: eventForm.name.trim(),
        description: eventForm.description.trim(),
        donationUpiId: eventForm.donationUpiId.trim() || null,
        fundingGoal:
          eventForm.fundingGoal === ""
            ? null
            : Number(eventForm.fundingGoal)
      });
      await loadEvent();
    } catch (err) {
      setError(err.message || "Failed to update event");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    const confirmed = window.confirm("Delete this event? This cannot be undone.");
    if (!confirmed) {
      return;
    }
    setActionLoading(true);
    setError("");
    try {
      await eventsApi.deleteEvent(eventId);
      navigate("/events");
    } catch (err) {
      setError(err.message || "Failed to delete event");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMember = async (event) => {
    event.preventDefault();
    setActionLoading(true);
    setError("");
    try {
      await eventsApi.addEventMember(eventId, {
        username: memberForm.username.trim(),
        role: memberForm.role
      });
      setMemberForm({ username: "", role: "VIEWER" });
      setMemberSearch("");
      setMemberResults([]);
      await loadEvent();
    } catch (err) {
      setError(err.message || "Failed to add member");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRole = async (username, role) => {
    setActionLoading(true);
    setError("");
    try {
      await eventsApi.updateMemberRole(eventId, username, { role });
      await loadEvent();
    } catch (err) {
      setError(err.message || "Failed to update role");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (username) => {
    setActionLoading(true);
    setError("");
    try {
      await eventsApi.removeEventMember(eventId, username);
      await loadEvent();
    } catch (err) {
      setError(err.message || "Failed to remove member");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    setActionLoading(true);
    setError("");
    try {
      await tasksApi.createTask(eventId, {
        title: taskForm.title.trim(),
        description: taskForm.description.trim()
      });
      setTaskForm({ title: "", description: "" });
      await loadTasks();
    } catch (err) {
      setError(err.message || "Failed to create task");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateDonation = async (event) => {
    event.preventDefault();
    setActionLoading(true);
    setFinanceError("");
    try {
      await financeApi.createDonation(eventId, {
        donorName: donationForm.donorName.trim(),
        amount: donationForm.amount,
        paymentMethod: donationForm.paymentMethod,
        referenceId: donationForm.referenceId.trim() || undefined
      });
      setDonationForm({
        donorName: "",
        amount: "",
        paymentMethod: "CASH",
        referenceId: ""
      });
      setDonationPage(1);
      await loadFinance({ donationPage: 1 });
    } catch (err) {
      setFinanceError(err.message || "Failed to record donation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateExpense = async (event) => {
    event.preventDefault();
    setActionLoading(true);
    setFinanceError("");
    try {
      await financeApi.createExpense(eventId, {
        title: expenseForm.title.trim(),
        amount: expenseForm.amount
      });
      setExpenseForm({ title: "", amount: "" });
      setExpensePage(1);
      await loadFinance({ expensePage: 1 });
    } catch (err) {
      setFinanceError(err.message || "Failed to record expense");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFetchDonationQR = async () => {
    setQrError("");
    setDonationQr("");
    try {
      const data = await financeApi.getDonationQR(eventId);
      setDonationQr(data?.qrCode || "");
    } catch (err) {
      setQrError(err.message || "Unable to generate donation QR");
    }
  };

  const handleVerifyDonation = async (donationId) => {
    setVerifyingDonationId(donationId);
    setFinanceError("");
    try {
      await financeApi.verifyDonation(donationId);
      await loadFinance();
    } catch (err) {
      setFinanceError(err.message || "Failed to verify donation");
    } finally {
      setVerifyingDonationId(null);
    }
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    setActionLoading(true);
    setError("");
    try {
      await tasksApi.updateTaskStatus(taskId, { status });
      await loadTasks();
    } catch (err) {
      setError(err.message || "Failed to update task");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="card">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="page">
        <div className="card error">{error || "Event not found"}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="page-hero">
        <div>
          <div className="hero-title">{event.name}</div>
          <div className="hero-subtitle">
            {event.description || "No description yet."}
          </div>
          <div className="hero-meta">
            <span className="meta-pill">
              Members <strong>{members.length}</strong>
            </span>
            <span className="meta-pill">
              Tasks <strong>{tasks.length}</strong>
            </span>
            {currentMemberRole ? (
              <span className="meta-pill">
                Role <strong>{currentMemberRole}</strong>
              </span>
            ) : null}
          </div>
        </div>
        <div className="hero-actions">
          <button className="btn ghost" onClick={() => navigate("/events")}>
            Back to events
          </button>
          <button className="btn danger" onClick={handleDeleteEvent}>
            Delete event
          </button>
        </div>
      </section>

      {error ? <div className="form-error">{error}</div> : null}

      <section className="panel">
        <div className="tabs">
          {["overview", "members", "tasks", "finance"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? "tab active" : "tab"}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="tab-panel">
            <div className="page-grid">
              <div className="stack">
                <div className="card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Finance snapshot</div>
                      <div className="panel-subtitle">
                        Verified donations only.
                      </div>
                    </div>
                  </div>
                  <div className="stat-grid">
                    <div className="stat-card">
                      <div className="stat-label">Total Donations</div>
                      <div className="stat-value">
                        ₹{formatAmount(financeSummary?.totalDonations ?? 0)}
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Total Expenses</div>
                      <div className="stat-value">
                        ₹{formatAmount(financeSummary?.totalExpenses ?? 0)}
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Balance</div>
                      <div className="stat-value">
                        ₹{formatAmount(financeSummary?.balance ?? 0)}
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Members</div>
                      <div className="stat-value">{members.length}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Tasks</div>
                      <div className="stat-value">{tasks.length}</div>
                    </div>
                  </div>
                </div>

                {goalAmount ? (
                  <div className="card goal-card">
                    <div className="goal-top">
                      <div>
                        <div className="goal-title">{event.name}</div>
                        <div className="goal-subtitle">Funding Goal</div>
                      </div>
                      <div className="goal-badge">
                        Raised ₹{formatAmount(raisedAmount)}
                      </div>
                    </div>
                    <div className="goal-metrics">
                      <div>
                        <div className="goal-label">Goal</div>
                        <div className="goal-amount">
                          ₹{formatAmount(goalAmount)}
                        </div>
                      </div>
                      <div>
                        <div className="goal-label">Raised</div>
                        <div className="goal-amount highlight">
                          ₹{formatAmount(raisedAmount)}
                        </div>
                      </div>
                      <div>
                        <div className="goal-label">Progress</div>
                        <div className="goal-amount">{goalProgress}%</div>
                      </div>
                    </div>
                    <div className="progress goal-progress">
                      <div
                        className="progress-bar"
                        style={{ width: `${goalProgress}%` }}
                      />
                    </div>
                    <div className="goal-caption">
                      Only verified donations are counted.
                    </div>
                  </div>
                ) : null}

                {canManageNotifications ? (
                  <div className="card">
                    <div className="panel-header">
                      <div>
                        <div className="panel-title">Notify members</div>
                        <div className="panel-subtitle">
                          Send a message to everyone in this event.
                        </div>
                      </div>
                    </div>
                    <form className="form" onSubmit={handleSendNotification}>
                      <label className="field">
                        <span>Title</span>
                        <input
                          name="title"
                          value={notificationForm.title}
                          onChange={handleNotificationChange}
                          placeholder="Update or reminder"
                          required
                        />
                      </label>
                      <label className="field">
                        <span>Message</span>
                        <textarea
                          name="message"
                          rows="4"
                          value={notificationForm.message}
                          onChange={handleNotificationChange}
                          placeholder="Write a short message for members."
                          required
                        />
                      </label>
                      <label className="field">
                        <span>Type</span>
                        <select
                          name="type"
                          value={notificationForm.type}
                          onChange={handleNotificationChange}
                        >
                          {["GENERAL", "TASK", "FINANCE", "ALERT"].map(
                            (item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            )
                          )}
                        </select>
                      </label>
                      <div className="form-actions">
                        <button
                          className="btn primary"
                          type="submit"
                          disabled={notificationLoading}
                        >
                          {notificationLoading ? "Sending..." : "Send"}
                        </button>
                      </div>
                      {notificationError ? (
                        <div className="form-error">{notificationError}</div>
                      ) : null}
                      {notificationSuccess ? (
                        <div className="card-meta">{notificationSuccess}</div>
                      ) : null}
                    </form>
                  </div>
                ) : (
                  <div className="card muted">
                    You don’t have permission to send notifications.
                  </div>
                )}
              </div>

              <div className="card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Event settings</div>
                    <div className="panel-subtitle">
                      Update core information and finance settings.
                    </div>
                  </div>
                </div>
                <form className="form" onSubmit={handleUpdateEvent}>
                  <label className="field">
                    <span>Event name</span>
                    <input
                      name="name"
                      value={eventForm.name}
                      onChange={handleEventChange}
                    />
                  </label>
                  <label className="field">
                    <span>Description</span>
                    <textarea
                      name="description"
                      rows="4"
                      value={eventForm.description}
                      onChange={handleEventChange}
                    />
                  </label>
                  <label className="field">
                    <span>Donation UPI ID</span>
                    <input
                      name="donationUpiId"
                      value={eventForm.donationUpiId}
                      onChange={handleEventChange}
                      placeholder="example@upi"
                    />
                  </label>
                  <label className="field">
                    <span>Funding Goal</span>
                    <input
                      name="fundingGoal"
                      type="number"
                      min="0"
                      value={eventForm.fundingGoal}
                      onChange={handleEventChange}
                      placeholder="50000"
                    />
                  </label>
                  <div className="form-actions">
                    <button
                      className="btn primary"
                      type="submit"
                      disabled={actionLoading}
                    >
                      {actionLoading ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div className="tab-panel">
            <div className="page-grid">
              <div className="stack">
                <div className="card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Find member</div>
                      <div className="panel-subtitle">
                        Search by name, username, or email.
                      </div>
                    </div>
                  </div>
                  <input
                    value={memberSearch}
                    onChange={handleMemberSearchChange}
                    placeholder="Search users"
                  />
                  {memberSearchLoading ? (
                    <div className="card-meta">Searching...</div>
                  ) : null}
                  {memberSearchError ? (
                    <div className="form-error">{memberSearchError}</div>
                  ) : null}
                  {memberSearch &&
                  !memberSearchLoading &&
                  !memberResults.length ? (
                    <div className="card muted">No users found.</div>
                  ) : null}
                  {memberResults.length ? (
                    <div className="list">
                      {memberResults.map((user) => (
                        <div key={user.id} className="list-item">
                          <div>
                            <div className="list-title">{user.name}</div>
                            <div className="list-meta">
                              @{user.username} · {user.email}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn ghost"
                            onClick={() =>
                              setMemberForm((prev) => ({
                                ...prev,
                                username: user.username
                              }))
                            }
                          >
                            Use
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="card">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Add member</div>
                      <div className="panel-subtitle">
                        Assign a role and invite to the event.
                      </div>
                    </div>
                  </div>
                  <form className="form" onSubmit={handleAddMember}>
                    <label className="field">
                      <span>Username</span>
                      <input
                        name="username"
                        value={memberForm.username}
                        onChange={handleMemberChange}
                        placeholder="username"
                        required
                      />
                    </label>
                    <label className="field">
                      <span>Role</span>
                      <select
                        name="role"
                        value={memberForm.role}
                        onChange={handleMemberChange}
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="form-actions">
                      <button className="btn primary" type="submit">
                        Add member
                      </button>
                    </div>
                  </form>
                </div>

              </div>

              <div className="card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Members</div>
                    <div className="panel-subtitle">
                      Manage roles and access.
                    </div>
                  </div>
                  {members.length > 3 ? (
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setShowAllMembers((prev) => !prev)}
                    >
                      {showAllMembers
                        ? "Show key roles"
                        : "Show all members"}
                    </button>
                  ) : null}
                </div>
                <div className="list">
                  {(showAllMembers
                    ? members
                    : members.filter((member) =>
                        ["SUPER_ADMIN", "MANAGER", "FINANCE"].includes(
                          member.role
                        )
                      )
                  ).map((member) => (
                    <div key={member.userId} className="list-item">
                      <div>
                        <div className="list-title">{member.user.name}</div>
                        <div className="list-meta">
                          {member.user.username || "no-username"} ·{" "}
                          {member.user.email}
                        </div>
                      </div>
                      <div className="list-actions">
                        <select
                          value={member.role}
                          onChange={(event) =>
                            handleUpdateRole(
                              member.user.username,
                              event.target.value
                            )
                          }
                        >
                          {ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        <button
                          className="btn ghost"
                          onClick={() =>
                            handleRemoveMember(member.user.username)
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {!members.length ? (
                    <div className="card muted">No members yet.</div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="tab-panel">
            <div className="page-grid">
              <div className="card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Create task</div>
                    <div className="panel-subtitle">
                      Assign work and track progress.
                    </div>
                  </div>
                </div>
                <form className="form" onSubmit={handleCreateTask}>
                  <label className="field">
                    <span>Task title</span>
                    <input
                      name="title"
                      value={taskForm.title}
                      onChange={handleTaskChange}
                      placeholder="Task title"
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Description</span>
                    <input
                      name="description"
                      value={taskForm.description}
                      onChange={handleTaskChange}
                      placeholder="Short description"
                    />
                  </label>
                  <div className="form-actions">
                    <button className="btn primary" type="submit">
                      Add task
                    </button>
                  </div>
                </form>
              </div>

              <div className="card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Task progress</div>
                    <div className="panel-subtitle">
                      Live status breakdown.
                    </div>
                  </div>
                </div>
                <div className="stat-grid">
                  <div className="stat-card">
                    <div className="stat-label">Pending</div>
                    <div className="stat-value">{taskStats.PENDING}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">In progress</div>
                    <div className="stat-value">{taskStats.IN_PROGRESS}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Completed</div>
                    <div className="stat-value">{taskStats.COMPLETED}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="panel-header">
                <div>
                  <div className="panel-title">Task board</div>
                  <div className="panel-subtitle">
                    Update status or jump into details.
                  </div>
                </div>
              </div>
              <div className="grid event-grid">
                {tasks.map((task) => (
                  <div key={task.id} className="card">
                    <div className="card-title">{task.title}</div>
                    <div className="card-desc">
                      {task.description || "No description yet."}
                    </div>
                    <div className="card-meta">
                      Status: <strong>{task.status}</strong>
                    </div>
                    <div className="card-actions">
                      <select
                        value={task.status}
                        onChange={(event) =>
                          handleUpdateTaskStatus(task.id, event.target.value)
                        }
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <Link to={`/tasks/${task.id}`} className="btn ghost">
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
                {!tasks.length ? (
                  <div className="card muted">No tasks yet.</div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {activeTab === "finance" && (
          <div className="tab-panel">
            {financeLoading ? (
              <div className="card">Loading finance data...</div>
            ) : null}
            {financeError ? <div className="form-error">{financeError}</div> : null}
            <div className="card">
              <div className="panel-header">
                <div>
                  <div className="panel-title">Finance snapshot</div>
                  <div className="panel-subtitle">
                    Overview of verified money movement.
                  </div>
                </div>
              </div>
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-label">Total Donations</div>
                  <div className="stat-value">
                    ₹{formatAmount(financeSummary?.totalDonations ?? 0)}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Total Expenses</div>
                  <div className="stat-value">
                    ₹{formatAmount(financeSummary?.totalExpenses ?? 0)}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Balance</div>
                  <div className="stat-value">
                    ₹{formatAmount(financeSummary?.balance ?? 0)}
                  </div>
                </div>
              </div>
            </div>

            {goalAmount ? (
              <div className="card goal-card">
                <div className="goal-top">
                  <div>
                    <div className="goal-title">{event.name}</div>
                    <div className="goal-subtitle">Funding Goal</div>
                  </div>
                  <div className="goal-badge">
                    Raised ₹{formatAmount(raisedAmount)}
                  </div>
                </div>
                <div className="goal-metrics">
                  <div>
                    <div className="goal-label">Goal</div>
                    <div className="goal-amount">
                      ₹{formatAmount(goalAmount)}
                    </div>
                  </div>
                  <div>
                    <div className="goal-label">Raised</div>
                    <div className="goal-amount highlight">
                      ₹{formatAmount(raisedAmount)}
                    </div>
                  </div>
                  <div>
                    <div className="goal-label">Progress</div>
                    <div className="goal-amount">{goalProgress}%</div>
                  </div>
                </div>
                <div className="progress goal-progress">
                  <div
                    className="progress-bar"
                    style={{ width: `${goalProgress}%` }}
                  />
                </div>
                <div className="goal-caption">
                  Only verified donations are counted.
                </div>
              </div>
            ) : null}

            <div className="page-grid">
              <div className="stack">
                {canManageFinance ? (
                  <div className="card finance-card">
                    <div className="panel-header">
                      <div>
                        <div className="panel-title">Record donation</div>
                        <div className="panel-subtitle">
                          Add a donation for verification.
                        </div>
                      </div>
                    </div>
                    <form className="form" onSubmit={handleCreateDonation}>
                      <label className="field">
                        <span>Donor name</span>
                        <input
                          name="donorName"
                          value={donationForm.donorName}
                          onChange={handleDonationChange}
                          required
                        />
                      </label>
                      <label className="field">
                        <span>Amount</span>
                        <input
                          name="amount"
                          type="number"
                          min="1"
                          value={donationForm.amount}
                          onChange={handleDonationChange}
                          required
                        />
                      </label>
                      <label className="field">
                        <span>Payment method</span>
                        <select
                          name="paymentMethod"
                          value={donationForm.paymentMethod}
                          onChange={handleDonationChange}
                        >
                          {PAYMENT_METHODS.map((method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>Reference ID (optional)</span>
                        <input
                          name="referenceId"
                          value={donationForm.referenceId}
                          onChange={handleDonationChange}
                        />
                      </label>
                      <div className="form-actions">
                        <button className="btn primary" type="submit">
                          Save donation
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="card muted">
                    You don’t have permission to record donations.
                  </div>
                )}

                {canManageFinance ? (
                  <div className="card finance-card">
                    <div className="panel-header">
                      <div>
                        <div className="panel-title">Record expense</div>
                        <div className="panel-subtitle">
                          Track outgoing payments.
                        </div>
                      </div>
                    </div>
                    <form className="form" onSubmit={handleCreateExpense}>
                      <label className="field">
                        <span>Title</span>
                        <input
                          name="title"
                          value={expenseForm.title}
                          onChange={handleExpenseChange}
                          required
                        />
                      </label>
                      <label className="field">
                        <span>Amount</span>
                        <input
                          name="amount"
                          type="number"
                          min="1"
                          value={expenseForm.amount}
                          onChange={handleExpenseChange}
                          required
                        />
                      </label>
                      <div className="form-actions">
                        <button className="btn primary" type="submit">
                          Save expense
                        </button>
                      </div>
                    </form>
                    <div className="card-meta">
                      Expense creation requires FINANCE, ADMIN, or SUPER_ADMIN.
                    </div>
                  </div>
                ) : (
                  <div className="card muted">
                    You don’t have permission to record expenses.
                  </div>
                )}
              </div>

              <div className="card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Donation UPI</div>
                    <div className="panel-subtitle">
                      Share the QR code with donors.
                    </div>
                  </div>
                </div>
                <div className="card-desc">
                  {event.donationUpiId
                    ? `UPI ID: ${event.donationUpiId}`
                    : "No UPI ID configured for this event."}
                </div>
                <div className="card-actions">
                  <button className="btn ghost" onClick={handleFetchDonationQR}>
                    Generate donation QR
                  </button>
                </div>
                {qrError ? <div className="form-error">{qrError}</div> : null}
                {donationQr ? (
                  <div className="card-meta">
                    <img
                      src={donationQr}
                      alt="Donation UPI QR"
                      style={{ width: "180px", height: "180px" }}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="page-grid">
              <div className="card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Donations</div>
                    <div className="panel-subtitle">
                      {donationPagination
                        ? `Page ${donationPagination.page} of ${donationPagination.totalPages}`
                        : `Showing ${donations.length} donation${
                            donations.length === 1 ? "" : "s"
                          }`}
                    </div>
                  </div>
                  {donationPagination ? (
                    <div className="panel-actions">
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() =>
                          setDonationPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={donationPage <= 1}
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() =>
                          setDonationPage((prev) =>
                            Math.min(
                              donationPagination.totalPages || prev + 1,
                              prev + 1
                            )
                          )
                        }
                        disabled={
                          donationPage >=
                          (donationPagination.totalPages || donationPage)
                        }
                      >
                        Next
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="list">
                  {donations.length ? (
                    donations.map((donation) => (
                      <div key={donation.id} className="list-item">
                        <div>
                          <div className="list-title">
                            {donation.donorName || "Anonymous"}
                          </div>
                          <div className="list-meta">
                            {donation.paymentMethod}
                            {donation.referenceId
                              ? ` · Ref: ${donation.referenceId}`
                              : ""}
                          </div>
                        </div>
                        <div className="list-actions">
                          <div className="badge">₹{donation.amount}</div>
                          <div className="badge soft">
                            {donation.status || "SUCCESS"}
                          </div>
                          {canManageFinance &&
                          donation.status === "PENDING" ? (
                            <button
                              type="button"
                              className="btn ghost"
                              onClick={() => handleVerifyDonation(donation.id)}
                              disabled={verifyingDonationId === donation.id}
                            >
                              {verifyingDonationId === donation.id
                                ? "Verifying..."
                                : "Verify"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="card muted">No donations yet.</div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Expenses</div>
                    <div className="panel-subtitle">
                      {expensePagination
                        ? `Page ${expensePagination.page} of ${expensePagination.totalPages} · Verified payouts for this event.`
                        : "All verified payouts for this event."}
                    </div>
                  </div>
                  {expensePagination ? (
                    <div className="panel-actions">
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() =>
                          setExpensePage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={expensePage <= 1}
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() =>
                          setExpensePage((prev) =>
                            Math.min(
                              expensePagination.totalPages || prev + 1,
                              prev + 1
                            )
                          )
                        }
                        disabled={
                          expensePage >=
                          (expensePagination.totalPages || expensePage)
                        }
                      >
                        Next
                      </button>
                    </div>
                  ) : null}
                </div>
                {expensesError ? (
                  <div className="form-error">{expensesError}</div>
                ) : null}
                <div className="list">
                  {expenses.length ? (
                    expenses.map((expense) => (
                      <div key={expense.id} className="list-item">
                        <div>
                          <div className="list-title">{expense.title}</div>
                          <div className="list-meta">
                            Paid by{" "}
                            {expense.user?.username ||
                              expense.user?.name ||
                              "member"}
                          </div>
                        </div>
                        <div className="badge">₹{expense.amount}</div>
                      </div>
                    ))
                  ) : (
                    <div className="card muted">No expenses yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
