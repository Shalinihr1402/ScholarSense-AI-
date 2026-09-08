import React from "react";
import { X, MessageCircle, Send, CheckCircle, AlertCircle } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function WhatsAppNotifyModal({ scholarship, onClose }) {
  const [phone, setPhone] = React.useState("");
  const [studentName, setStudentName] = React.useState("");
  const [state, setState] = React.useState("idle"); // idle | sending | success | error
  const [errorMsg, setErrorMsg] = React.useState("");

  async function handleSend(e) {
    e.preventDefault();
    if (!phone || !studentName) return;
    setState("sending");
    setErrorMsg("");
    try {
      const token = localStorage.getItem("scholarsense_token");
      const res = await fetch(`${API}/api/whatsapp/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          to: phone,
          studentName,
          scholarshipName: scholarship.name,
          status: "eligible",
          deadline: scholarship.deadline,
          portal: scholarship.applicationLink
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ಕಳುಹಿಸಲು ವಿಫಲವಾಗಿದೆ");
      setState("success");
    } catch (err) {
      setErrorMsg(err.message);
      setState("error");
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: 16
    }}>
      <div style={{
        background: "white", borderRadius: 16, width: "100%", maxWidth: 420,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg,#25d366,#128c7e)",
          padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "white" }}>
            <MessageCircle size={20} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>WhatsApp ಅಧಿಸೂಚನೆ</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "20px 24px 24px" }}>
          {/* Scholarship info */}
          <div style={{
            background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10,
            padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#15803d", fontWeight: 600
          }}>
            🎓 {scholarship.name}
          </div>

          {state === "success" ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <CheckCircle size={48} color="#15803d" style={{ marginBottom: 12 }} />
              <p style={{ fontWeight: 700, fontSize: 16, color: "#15803d", marginBottom: 6 }}>
                ಸಂದೇಶ ಕಳುಹಿಸಲಾಗಿದೆ!
              </p>
              <p style={{ fontSize: 13, color: "#555" }}>
                WhatsApp ಮೂಲಕ ಪೋಷಕರಿಗೆ ಯಶಸ್ವಿಯಾಗಿ ತಿಳಿಸಲಾಗಿದೆ.
              </p>
              <button onClick={onClose} style={{
                marginTop: 16, padding: "10px 28px", background: "#15803d", color: "white",
                border: "none", borderRadius: 9, fontWeight: 700, cursor: "pointer", fontSize: 14
              }}>
                ಸರಿ
              </button>
            </div>
          ) : (
            <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#374151", marginBottom: 6, display: "block" }}>
                  ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು *
                </label>
                <input
                  type="text"
                  placeholder="ಉದಾ: Shalini H R"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  required
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 9, fontSize: 14,
                    border: "1.5px solid #e2e8f0", outline: "none", boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#374151", marginBottom: 6, display: "block" }}>
                  WhatsApp ಸಂಖ್ಯೆ (ಪೋಷಕರ / ವಿದ್ಯಾರ್ಥಿ) *
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    padding: "10px 12px", background: "#f1f5f9", border: "1.5px solid #e2e8f0",
                    borderRadius: 9, fontSize: 13, fontWeight: 600, color: "#475569", whiteSpace: "nowrap"
                  }}>🇮🇳 +91</span>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    required
                    maxLength={10}
                    style={{
                      flex: 1, padding: "10px 12px", borderRadius: 9, fontSize: 14,
                      border: "1.5px solid #e2e8f0", outline: "none"
                    }}
                  />
                </div>
                <p style={{ fontSize: 11.5, color: "#888", marginTop: 5 }}>
                  ಈ ಸಂಖ್ಯೆಯಲ್ಲಿ WhatsApp ಸಕ್ರಿಯವಾಗಿರಬೇಕು
                </p>
              </div>

              {/* Preview */}
              {studentName && (
                <div style={{
                  background: "#f9fafb", border: "1px dashed #d1d5db", borderRadius: 10,
                  padding: "10px 14px", fontSize: 12, color: "#555", lineHeight: 1.7
                }}>
                  <p style={{ fontWeight: 700, marginBottom: 4, color: "#374151" }}>ಸಂದೇಶ ಪೂರ್ವವೀಕ್ಷಣೆ (ಕನ್ನಡ):</p>
                  <p>📢 <b>ScholarSense AI - ವಿದ್ಯಾರ್ಥಿ ವಜೀಫ ಅಧಿಸೂಚನೆ</b></p>
                  <p>ನಿಮ್ಮ ಮಗು <b>{studentName}</b> <b>{scholarship.name}</b> ವಿದ್ಯಾರ್ಥಿ ವೇತನಕ್ಕೆ ಅರ್ಹರಾಗಿದ್ದಾರೆ.</p>
                  {scholarship.deadline && <p>📅 ಕೊನೆ ದಿನಾಂಕ: <b>{scholarship.deadline}</b></p>}
                </div>
              )}

              {state === "error" && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fecdd3", borderRadius: 9,
                  padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#dc2626"
                }}>
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={state === "sending"}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "12px", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer",
                  background: state === "sending" ? "#d1d5db" : "linear-gradient(135deg,#25d366,#128c7e)",
                  color: "white", border: "none"
                }}
              >
                {state === "sending" ? (
                  <>
                    <span style={{ width: 16, height: 16, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...
                  </>
                ) : (
                  <><Send size={15} /> WhatsApp ಸಂದೇಶ ಕಳುಹಿಸಿ</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
