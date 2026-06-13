import React from "react";

export default function Chatbot() {
  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">AI scholarship chatbot</p>
        <h2>Ask scholarship, DBT, and document doubts</h2>
      </div>
      <section className="chat-panel">
        <div className="chat-bubble bot">How can I help with your scholarship application today?</div>
        <div className="chat-bubble user">What does bank validation failed mean?</div>
        <div className="chat-bubble bot">
          It may mean incorrect bank details, inactive account, IFSC issue, or Aadhaar-bank seeding problem.
        </div>
        <div className="chat-input">
          <input placeholder="Type your question..." />
          <button className="primary-btn" type="button">Send</button>
        </div>
      </section>
    </div>
  );
}
