
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const STORAGE_KEY = "moments-ahead-events";

const initialEvents = [];

const today = new Date();

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCountdown(event) {
  const target = new Date(
    `${event.date}T${event.time || "00:00"}:00`
  ).getTime();

  const difference = target - Date.now();

  if (difference <= 0) {
    return null;
  }

  return {
    days: Math.floor(difference / 86400000),
    hours: Math.floor((difference % 86400000) / 3600000),
    minutes: Math.floor((difference % 3600000) / 60000),
    seconds: Math.floor((difference % 60000) / 1000),
  };
}

function formatEventDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

function App() {
  const [events, setEvents] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialEvents;
    } catch {
      return initialEvents;
    }
  });

  const [now, setNow] = useState(new Date());
  const [view, setView] = useState("home");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showFavourites, setShowFavourites] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const [month, setMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "23:59",
    emoji: "🎉",
    description: "",
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) =>
        new Date(`${a.date}T${a.time || "00:00"}`) -
        new Date(`${b.date}T${b.time || "00:00"}`)
    );
  }, [events]);

  const displayedEvents = sortedEvents.filter((event) => {
    const isFuture =
      new Date(`${event.date}T${event.time || "00:00"}`) >
      now;

    return (
      isFuture &&
      (!showFavourites || event.favourite)
    );
  });

  const upcomingEvent = sortedEvents.find(
    (event) =>
      new Date(`${event.date}T${event.time || "00:00"}`) >
      now
  );

  const clock = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  function openAddForm() {
    setEditingId(null);
    setForm({
      title: "",
      date: "",
      time: "23:59",
      emoji: "🎉",
      description: "",
    });
    setShowForm(true);
  }

  function openEditForm(event) {
    setEditingId(event.id);
    setForm({
      title: event.title,
      date: event.date,
      time: event.time || "23:59",
      emoji: event.emoji,
      description: event.description || "",
    });
    setShowForm(true);
  }

  function saveEvent(e) {
    e.preventDefault();

    if (!form.title.trim() || !form.date) {
      return;
    }

    const eventData = {
      ...form,
      title: form.title.trim(),
      id: editingId || Date.now().toString(),
    };

    if (editingId) {
      setEvents((old) =>
        old.map((event) =>
          event.id === editingId
            ? { ...event, ...eventData }
            : event
        )
      );
    } else {
      setEvents((old) => [...old, {
        ...eventData,
        favourite: false,
      }]);
    }

    setShowForm(false);
    setEditingId(null);
  }

  function deleteEvent(id) {
    if (window.confirm("Delete this event?")) {
      setEvents((old) =>
        old.filter((event) => event.id !== id)
      );
    }
  }

  function toggleFavourite(id) {
    setEvents((old) =>
      old.map((event) =>
        event.id === id
          ? { ...event, favourite: !event.favourite }
          : event
      )
    );
  }

  function changeMonth(amount) {
    setMonth(
      (old) =>
        new Date(
          old.getFullYear(),
          old.getMonth() + amount,
          1
        )
    );
  }

  const calendarDays = useMemo(() => {
    const firstDay = new Date(
      month.getFullYear(),
      month.getMonth(),
      1
    ).getDay();

    const totalDays = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0
    ).getDate();

    return [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: totalDays }, (_, i) => i + 1),
    ];
  }, [month]);

  function eventsOnDay(day) {
    if (!day) return [];

    const date = formatDate(
      new Date(month.getFullYear(), month.getMonth(), day)
    );

    return events.filter((event) => event.date === date);
  }

  const selectedEvents = selectedDate
    ? events.filter((event) => event.date === selectedDate)
    : [];

  return (
    <main className="app">
      <div className="overlay" />

      <header className="topbar">
        <a className="logo" href="#" onClick={() => setView("home")}>
          <span>🌿</span> MOMENTS AHEAD
        </a>

        <nav>
          <button
            className={view === "home" ? "nav-active" : ""}
            onClick={() => setView("home")}
          >
            Home
          </button>
          <button
            className={view === "calendar" ? "nav-active" : ""}
            onClick={() => setView("calendar")}
          >
            Calendar
          </button>
        </nav>

        <button className="add-top" onClick={openAddForm}>
          + Add Event
        </button>
      </header>

      <section className="hero">
        <p className="eyebrow">✦ MAKE EVERY MOMENT COUNT ✦</p>

        <h1>
          Every moment
          <br />
          <span>is worth waiting for.</span>
        </h1>

        <p className="hero-subtitle">
          My special days, My beautiful memories.
        </p>

        <div className="clock">{clock}</div>
        <p className="clock-date">
          {now.toLocaleDateString("en-US", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </section>

      {view === "home" ? (
        <section className="content">
          {upcomingEvent && !showFavourites && (
            <div className="next-event">
              <div>
                <span className="eyebrow">YOUR NEXT BIG MOMENT</span>
                <h2>
                  {upcomingEvent.emoji} {upcomingEvent.title}
                </h2>
                <p>{formatEventDate(upcomingEvent.date)}</p>
              </div>
              <div className="next-count">
                <strong>
                  {getCountdown(upcomingEvent)?.days ?? 0}
                </strong>
                <span>DAYS TO GO</span>
              </div>
            </div>
          )}

          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR PERSONAL COLLECTION</p>
              <h2>
                {showFavourites ? "Favourite Moments" : "Upcoming Events"}
              </h2>
              <p className="muted">
                {displayedEvents.length} events waiting for you
              </p>
            </div>

            <button
              className="secondary-button"
              onClick={() => setShowFavourites(!showFavourites)}
            >
              {showFavourites ? "☆ All Events" : "★ Favourites"}
            </button>
          </div>

          {displayedEvents.length === 0 ? (
            <div className="empty-state">
              <div>🌱</div>
              <h3>No events yet</h3>
              <p>
                Add your first special moment and start counting!
              </p>
              <button className="primary-button" onClick={openAddForm}>
                + Create Your First Event
              </button>
            </div>
          ) : (
            <div className="event-grid">
              {displayedEvents.map((event) => {
                const countdown = getCountdown(event);

                return (
                  <article className="event-card" key={event.id}>
                    <div className="card-top">
                      <span className="event-emoji">
                        {event.emoji}
                      </span>
                      <button
                        className="star-button"
                        onClick={() => toggleFavourite(event.id)}
                        title="Toggle favourite"
                      >
                        {event.favourite ? "★" : "☆"}
                      </button>
                    </div>

                    <h3>{event.title}</h3>
                    <p className="event-date">
                      {formatEventDate(event.date)}
                    </p>

                    {event.description && (
                      <p className="description">
                        {event.description}
                      </p>
                    )}

                    <div className="countdown-grid">
                      {[
                        ["Days", countdown.days],
                        ["Hours", countdown.hours],
                        ["Minutes", countdown.minutes],
                        ["Seconds", countdown.seconds],
                      ].map(([label, value]) => (
                        <div className="time-box" key={label}>
                          <strong>
                            {String(value).padStart(2, "0")}
                          </strong>
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="card-actions">
                      <button onClick={() => openEditForm(event)}>
                        ✎ Edit
                      </button>
                      <button onClick={() => deleteEvent(event.id)}>
                        🗑 Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="content calendar-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PLAN YOUR SPECIAL DAYS</p>
              <h2>Event Calendar</h2>
              <p className="muted">Select a date to see your events.</p>
            </div>
          </div>

          <div className="calendar">
            <div className="calendar-header">
              <button onClick={() => changeMonth(-1)}>‹</button>
              <h2>
                {month.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <button onClick={() => changeMonth(1)}>›</button>
            </div>

            <div className="calendar-grid">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day) => (
                  <div className="weekday" key={day}>{day}</div>
                )
              )}

              {calendarDays.map((day, index) => {
                const dayEvents = eventsOnDay(day);
                const date = day
                  ? formatDate(
                      new Date(
                        month.getFullYear(),
                        month.getMonth(),
                        day
                      )
                    )
                  : null;

                return (
                  <button
                    key={index}
                    disabled={!day}
                    className={`calendar-day ${
                      date === formatDate(now) ? "today" : ""
                    } ${
                      date === selectedDate ? "selected-day" : ""
                    }`}
                    onClick={() => setSelectedDate(date)}
                  >
                    {day && (
                      <>
                        <span>{day}</span>
                        {dayEvents.length > 0 && (
                          <span className="event-dot">
                            {dayEvents.length > 3
                              ? "•••"
                              : "•".repeat(dayEvents.length)}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="selected-events">
            <h3>
              {selectedDate
                ? `Events on ${formatEventDate(selectedDate)}`
                : "Select a date"}
            </h3>

            {selectedEvents.length === 0 ? (
              <p className="muted">No events on this date.</p>
            ) : (
              selectedEvents.map((event) => (
                <div className="calendar-event" key={event.id}>
                  <span>{event.emoji} {event.title}</span>
                  <div>
                    <button onClick={() => openEditForm(event)}>Edit</button>
                    <button onClick={() => deleteEvent(event.id)}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      <footer>
        <p>🌿 MOMENTS AHEAD</p>
        <span>Every second brings a new memory.</span>
      </footer>

      {showForm && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowForm(false);
          }}
        >
          <form className="event-form" onSubmit={saveEvent}>
            <div className="form-heading">
              <h2>{editingId ? "Edit Event" : "Create an Event"}</h2>
              <button
                type="button"
                className="close-button"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>

            <label>Event Name</label>
            <input
              type="text"
              placeholder="e.g. My Birthday"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              required
            />

            <label>Choose an Emoji</label>
            <select
              value={form.emoji}
              onChange={(e) =>
                setForm({ ...form, emoji: e.target.value })
              }
            >
              {["🎉", "🎂", "🎄", "🌙", "✈️", "🎓", "📚", "💚", "🌸", "🏆", "🎁", "🌍"].map(
                (emoji) => (
                  <option key={emoji} value={emoji}>{emoji}</option>
                )
              )}
            </select>

            <label>Event Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm({ ...form, date: e.target.value })
              }
              required
            />

            <label>Event Time</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) =>
                setForm({ ...form, time: e.target.value })
              }
              required
            />

            <label>Description (Optional)</label>
            <textarea
              placeholder="Write something about this special day..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows="3"
            />

            <button type="submit" className="primary-button full-button">
              {editingId ? "Save Changes" : "Create Countdown"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}

export default App;
