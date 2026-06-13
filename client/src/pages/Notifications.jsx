import React from "react";
import { Bell, CheckCheck, CircleAlert, CircleCheck, Mail } from "lucide-react";
import { emailApi, notificationApi } from "../services/api.js";

function priorityClass(priority) {
  if (priority === "critical" || priority === "high") {
    return "bad";
  }

  if (priority === "medium") {
    return "warn";
  }

  return "ok";
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function Notifications() {
  const [data, setData] = React.useState({ notifications: [], summary: { total: 0, unread: 0, highPriority: 0 } });
  const [emailStatus, setEmailStatus] = React.useState({
    configured: false,
    logs: [],
    summary: { total: 0, sent: 0, skipped: 0, failed: 0 }
  });
  const [status, setStatus] = React.useState({ loading: true, error: "" });

  async function loadNotifications() {
    try {
      const response = await notificationApi.list();
      setData(response);
      const emailResponse = await emailApi.status();
      setEmailStatus(emailResponse);
      setStatus({ loading: false, error: "" });
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  }

  React.useEffect(() => {
    loadNotifications();
  }, []);

  async function markRead(id) {
    try {
      await notificationApi.markRead(id);
      await loadNotifications();
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  }

  async function markAllRead() {
    try {
      await notificationApi.markAllRead();
      await loadNotifications();
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  }

  async function createDemoNotification() {
    try {
      await notificationApi.create({
        title: "Deadline reminder",
        message: "Post-Matric Scholarship deadline is approaching. Verify documents and DBT status.",
        type: "deadline",
        priority: "high"
      });
      await loadNotifications();
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Notifications</p>
        <h2>Scholarship alerts</h2>
      </div>

      <section className="stats-grid">
        <div className="stat-card blue">
          <p>Total alerts</p>
          <strong>{data.summary.total}</strong>
          <span>All notifications</span>
        </div>
        <div className="stat-card amber">
          <p>Unread</p>
          <strong>{data.summary.unread}</strong>
          <span>Need attention</span>
        </div>
        <div className="stat-card red">
          <p>High priority</p>
          <strong>{data.summary.highPriority}</strong>
          <span>DBT/document/risk alerts</span>
        </div>
        <div className="stat-card teal">
          <p>Channels</p>
          <strong>{emailStatus.configured ? "Email On" : "Email Off"}</strong>
          <span>{emailStatus.configured ? "SMTP configured" : "Set EMAIL_USER/PASS"}</span>
        </div>
      </section>

      <section className="panel notification-toolbar">
        <button className="primary-btn" type="button" onClick={markAllRead} disabled={data.summary.unread === 0}>
          <CheckCheck size={18} /> Mark all read
        </button>
        <button className="secondary-btn" type="button" onClick={createDemoNotification}>
          <Bell size={18} /> Create test alert
        </button>
      </section>

      <section className="panel">
        <div className="quality-header">
          <div>
            <p className="eyebrow">Email alert status</p>
            <h3>{emailStatus.configured ? "Gmail SMTP is configured" : "Email is not configured yet"}</h3>
          </div>
          <span className={`status-pill ${emailStatus.configured ? "ok" : "warn"}`}>
            {emailStatus.summary.sent} sent / {emailStatus.summary.skipped} skipped / {emailStatus.summary.failed} failed
          </span>
        </div>
        <p className="muted-text">
          High and critical alerts are automatically sent to the student email when Gmail SMTP credentials are configured.
        </p>
      </section>

      {status.loading ? <section className="panel">Loading notifications...</section> : null}
      {status.error ? <div className="form-alert error">{status.error}</div> : null}

      <section className="notification-card-list">
        {data.notifications.length === 0 && !status.loading ? (
          <article className="empty-state">
            <CircleCheck size={32} />
            <h3>No notifications yet</h3>
            <p>Alerts will appear here after profile, readiness, diagnosis, OCR, and deadline events.</p>
          </article>
        ) : null}

        {data.notifications.map((notification) => (
          <article
            className={`notification-card ${notification.isRead ? "read" : "unread"} ${priorityClass(notification.priority)}`}
            key={notification.id || notification._id}
          >
            <div className="notification-icon">
              {priorityClass(notification.priority) === "bad" ? <CircleAlert size={22} /> : <Bell size={22} />}
            </div>
            <div>
              <div className="notification-card-title">
                <h3>{notification.title}</h3>
                <span>{notification.priority}</span>
              </div>
              <p>{notification.message}</p>
              <div className="notification-meta">
                <span>{notification.type}</span>
                <span>{formatDate(notification.createdAt)}</span>
                <span>
                  <Mail size={14} />{" "}
                  {notification.emailSent
                    ? "Email sent"
                    : notification.emailStatus
                      ? `Email ${notification.emailStatus}`
                      : "In-app only"}
                </span>
              </div>
            </div>
            {!notification.isRead ? (
              <button
                className="secondary-btn compact"
                type="button"
                onClick={() => markRead(notification.id || notification._id)}
              >
                Mark read
              </button>
            ) : null}
          </article>
        ))}
      </section>

      {emailStatus.logs.length > 0 ? (
        <section className="panel">
          <h3>Email log</h3>
          <div className="timeline">
            {emailStatus.logs.slice(0, 5).map((log) => (
              <span key={log.id}>
                {log.status.toUpperCase()} - {log.subject} to {log.toEmail}
                {log.reason ? ` (${log.reason})` : ""}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
