import { useState, useRef } from "react";

const BRAND = {
  linen: "#FAF6F0",
  card: "#FFFFFF",
  terracotta: "#A8623F",
  terracottaText: "#854A30",
  olive: "#6B7456",
  umber: "#3D352C",
  umberSoft: "#6B6258",
  gold: "#C9905C",
  border: "rgba(61,53,44,0.12)",
};

const PROVIDER = {
  name: "Christa Stamper",
  title: "Biblical Counselor",
  email: "hello@christastamper.com",
  website: "christastamper.com",
};

function formatCurrency(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return "$0.00";
  return "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function dueDateStr(days = 30) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function generateInvoiceNumber() {
  const now = new Date();
  const yr = now.getFullYear().toString().slice(-2);
  const mo = String(now.getMonth() + 1).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 900) + 100);
  return `INV-${yr}${mo}-${rand}`;
}

const emptyLine = () => ({ description: "", sessions: "", rate: "", amount: "" });

export default function InvoiceGenerator() {
  const [church, setChurch] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [invoiceNumber] = useState(generateInvoiceNumber);
  const [issueDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(dueDateStr(30));
  const [lines, setLines] = useState([
    { description: "Biblical counseling session", sessions: "1", rate: "100", amount: "100.00" },
  ]);
  const [notes, setNotes] = useState(
    "Thank you for your partnership in caring for those in your congregation. Payment may be made by card via the link below, or by check payable to Christa Stamper."
  );
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const previewRef = useRef(null);

  const total = lines.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);

  function updateLine(i, field, val) {
    setLines((prev) => {
      const next = prev.map((l, idx) => (idx === i ? { ...l, [field]: val } : l));
      if (field === "sessions" || field === "rate") {
        const s = parseFloat(next[i].sessions) || 0;
        const r = parseFloat(next[i].rate) || 0;
        next[i].amount = (s * r).toFixed(2);
      }
      return next;
    });
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(i) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  function copyStripeLink() {
    const desc = encodeURIComponent(`Invoice ${invoiceNumber} — ${church}`);
    const url = `https://dashboard.stripe.com/payment-links/create?amount=${Math.round(total * 100)}&currency=usd&name=${desc}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    window.open(url, "_blank");
  }

  function printInvoice() {
    window.print();
  }

  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    border: `1px solid ${BRAND.border}`,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "Inter, sans-serif",
    color: BRAND.umber,
    background: BRAND.card,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: BRAND.umberSoft,
    marginBottom: 5,
    letterSpacing: "0.01em",
  };

  const sectionStyle = {
    background: BRAND.card,
    border: `1px solid ${BRAND.border}`,
    borderRadius: 12,
    padding: "24px 28px",
    marginBottom: 16,
  };

  return (
    <div style={{ minHeight: "100vh", background: BRAND.linen, fontFamily: "Inter, sans-serif", color: BRAND.umber }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        input:focus, textarea:focus, select:focus { outline: 2px solid ${BRAND.terracotta}; outline-offset: 1px; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; }
          .invoice-preview { box-shadow: none !important; border: none !important; }
        }
        .print-only { display: none; }
        .btn-primary {
          background: ${BRAND.terracotta};
          color: white;
          border: none;
          border-radius: 100px;
          padding: 11px 22px;
          font-size: 14px;
          font-weight: 600;
          font-family: Inter, sans-serif;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-primary:hover { background: ${BRAND.terracottaText}; }
        .btn-ghost {
          background: transparent;
          color: ${BRAND.umberSoft};
          border: 1px solid ${BRAND.border};
          border-radius: 100px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 500;
          font-family: Inter, sans-serif;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }
        .btn-ghost:hover { border-color: ${BRAND.terracotta}; color: ${BRAND.terracotta}; }
        .line-input {
          padding: 8px 10px;
          border: 1px solid ${BRAND.border};
          border-radius: 7px;
          font-size: 14px;
          font-family: Inter, sans-serif;
          color: ${BRAND.umber};
          background: ${BRAND.card};
          width: 100%;
        }
        .tab { padding: 8px 18px; border-radius: 100px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: background 0.15s, color 0.15s; }
        .tab-active { background: ${BRAND.umber}; color: white; }
        .tab-inactive { background: transparent; color: ${BRAND.umberSoft}; }
        .tab-inactive:hover { background: rgba(61,53,44,0.06); }
      `}</style>

      {/* Header */}
      <div className="no-print" style={{ background: BRAND.card, borderBottom: `1px solid ${BRAND.border}`, padding: "0 32px" }}>
        <div style={{ maxWidth: 980, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, background: BRAND.olive, borderRadius: "22%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 110 70" width="16" height="10"><path d="M5 65 L35 20 L50 40 L70 10 L105 65" fill="none" stroke="#FAF6F0" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 600, fontSize: 16, color: BRAND.umber }}>Christa Stamper</span>
            <span style={{ color: BRAND.border, fontSize: 16 }}>·</span>
            <span style={{ fontSize: 13, color: BRAND.umberSoft, fontWeight: 500 }}>Invoice Generator</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className={`tab ${!showPreview ? "tab-active" : "tab-inactive"}`} onClick={() => setShowPreview(false)}>Edit</button>
            <button className={`tab ${showPreview ? "tab-active" : "tab-inactive"}`} onClick={() => setShowPreview(true)}>Preview</button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 24px", display: "grid", gridTemplateColumns: showPreview ? "1fr" : "1fr 1fr", gap: 24 }}>

        {/* LEFT — Form */}
        {!showPreview && (
          <div className="no-print">

            {/* Church info */}
            <div style={sectionStyle}>
              <p style={{ fontFamily: "Playfair Display, serif", fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: BRAND.umber }}>Bill to</p>
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Church / organization name</label>
                  <input style={inputStyle} value={church} onChange={e => setChurch(e.target.value)} placeholder="Grace Community Church" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Contact name</label>
                    <input style={inputStyle} value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Treasurer or admin" />
                  </div>
                  <div>
                    <label style={labelStyle}>Contact email</label>
                    <input style={inputStyle} type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="admin@church.org" />
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice details */}
            <div style={sectionStyle}>
              <p style={{ fontFamily: "Playfair Display, serif", fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: BRAND.umber }}>Invoice details</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Invoice number</label>
                  <input style={{ ...inputStyle, background: BRAND.linen, color: BRAND.umberSoft }} value={invoiceNumber} readOnly />
                </div>
                <div>
                  <label style={labelStyle}>Due date</label>
                  <input style={inputStyle} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Line items */}
            <div style={sectionStyle}>
              <p style={{ fontFamily: "Playfair Display, serif", fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: BRAND.umber }}>Services</p>

              {/* Column headers */}
              <div style={{ display: "grid", gridTemplateColumns: "3fr 80px 90px 90px 28px", gap: 8, marginBottom: 8 }}>
                {["Description", "Sessions", "Rate", "Amount", ""].map((h, i) => (
                  <span key={i} style={{ fontSize: 11, fontWeight: 600, color: BRAND.umberSoft, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
                ))}
              </div>

              {lines.map((line, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 80px 90px 90px 28px", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <input className="line-input" value={line.description} onChange={e => updateLine(i, "description", e.target.value)} placeholder="Biblical counseling session" />
                  <input className="line-input" type="number" min="1" value={line.sessions} onChange={e => updateLine(i, "sessions", e.target.value)} style={{ textAlign: "center" }} />
                  <input className="line-input" type="number" min="0" step="0.01" value={line.rate} onChange={e => updateLine(i, "rate", e.target.value)} placeholder="100.00" />
                  <input className="line-input" value={line.amount} onChange={e => updateLine(i, "amount", e.target.value)} style={{ color: BRAND.terracottaText, fontWeight: 600 }} />
                  {lines.length > 1 ? (
                    <button onClick={() => removeLine(i)} style={{ background: "none", border: "none", cursor: "pointer", color: BRAND.umberSoft, fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
                  ) : <span />}
                </div>
              ))}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BRAND.border}` }}>
                <button className="btn-ghost" style={{ padding: "7px 14px", fontSize: 13 }} onClick={addLine}>+ Add line</button>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 12, color: BRAND.umberSoft, marginRight: 12 }}>Total</span>
                  <span style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 600, color: BRAND.umber }}>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div style={sectionStyle}>
              <label style={{ ...labelStyle, marginBottom: 8 }}>Notes to church</label>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: "vertical", lineHeight: 1.6 }}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn-primary" onClick={() => setShowPreview(true)}>Preview invoice</button>
              <button className="btn-ghost" onClick={copyStripeLink}>
                {copied ? "✓ Opened in Stripe" : "Create Stripe payment link"}
              </button>
            </div>
          </div>
        )}

        {/* RIGHT (or full width) — Invoice Preview */}
        <div ref={previewRef}>
          <div className="invoice-preview" style={{
            background: BRAND.card,
            border: `1px solid ${BRAND.border}`,
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 4px 24px rgba(61,53,44,0.07)"
          }}>
            {/* Invoice header stripe */}
            <div style={{ background: BRAND.olive, padding: "28px 36px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, background: "rgba(250,246,240,0.15)", borderRadius: "22%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg viewBox="0 0 110 70" width="20" height="13"><path d="M5 65 L35 20 L50 40 L70 10 L105 65" fill="none" stroke="#FAF6F0" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontFamily: "Playfair Display, serif", fontWeight: 600, fontSize: 17, color: "#FAF6F0" }}>{PROVIDER.name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(250,246,240,0.7)" }}>{PROVIDER.title}</p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(250,246,240,0.7)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Invoice</p>
                <p style={{ margin: 0, fontFamily: "Playfair Display, serif", fontSize: 15, fontWeight: 600, color: "#FAF6F0" }}>{invoiceNumber}</p>
              </div>
            </div>

            <div style={{ padding: "28px 36px" }}>

              {/* Bill to / Dates */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginBottom: 28, paddingBottom: 24, borderBottom: `1px solid ${BRAND.border}` }}>
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: BRAND.umberSoft, textTransform: "uppercase", letterSpacing: "0.06em" }}>Bill to</p>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: BRAND.umber }}>{church || "Church name"}</p>
                  {contactName && <p style={{ margin: "2px 0 0", fontSize: 13, color: BRAND.umberSoft }}>{contactName}</p>}
                  {contactEmail && <p style={{ margin: "2px 0 0", fontSize: 13, color: BRAND.terracottaText }}>{contactEmail}</p>}
                </div>
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: BRAND.umberSoft, textTransform: "uppercase", letterSpacing: "0.06em" }}>Date issued</p>
                  <p style={{ margin: 0, fontSize: 14, color: BRAND.umber }}>{formatDate(issueDate)}</p>
                </div>
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: BRAND.umberSoft, textTransform: "uppercase", letterSpacing: "0.06em" }}>Due date</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: BRAND.umber }}>{formatDate(dueDate)}</p>
                </div>
              </div>

              {/* Line items */}
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                    {["Description", "Sessions", "Rate", "Amount"].map((h, i) => (
                      <th key={i} style={{ padding: "0 0 8px", textAlign: i === 0 ? "left" : "right", fontSize: 11, fontWeight: 600, color: BRAND.umberSoft, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                      <td style={{ padding: "12px 0", fontSize: 14, color: BRAND.umber }}>{line.description || "—"}</td>
                      <td style={{ padding: "12px 0", fontSize: 14, color: BRAND.umberSoft, textAlign: "right" }}>{line.sessions}</td>
                      <td style={{ padding: "12px 0", fontSize: 14, color: BRAND.umberSoft, textAlign: "right" }}>{formatCurrency(line.rate)}</td>
                      <td style={{ padding: "12px 0", fontSize: 14, fontWeight: 600, color: BRAND.umber, textAlign: "right" }}>{formatCurrency(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
                <div style={{ background: BRAND.linen, borderRadius: 10, padding: "14px 20px", minWidth: 180, textAlign: "right" }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: BRAND.umberSoft, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total due</p>
                  <p style={{ margin: 0, fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 600, color: BRAND.umber }}>{formatCurrency(total)}</p>
                </div>
              </div>

              {/* Notes */}
              {notes && (
                <div style={{ background: BRAND.linen, borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
                  <p style={{ margin: 0, fontSize: 13, color: BRAND.umberSoft, lineHeight: 1.6 }}>{notes}</p>
                </div>
              )}

              {/* Footer */}
              <div style={{ borderTop: `1px solid ${BRAND.border}`, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: BRAND.umberSoft }}>{PROVIDER.email}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: BRAND.umberSoft }}>{PROVIDER.website}</p>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: BRAND.border.replace("0.12", "0.4") }}>Thank you for your partnership.</p>
              </div>
            </div>
          </div>

          {/* Preview actions */}
          {showPreview && (
            <div className="no-print" style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "center" }}>
              <button className="btn-primary" onClick={printInvoice}>Download / Print PDF</button>
              <button className="btn-ghost" onClick={copyStripeLink}>{copied ? "✓ Opened in Stripe" : "Create Stripe payment link"}</button>
              <button className="btn-ghost" onClick={() => setShowPreview(false)}>Edit</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
