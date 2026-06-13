import React from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { issue: "DBT", count: 18 },
  { issue: "Blur", count: 25 },
  { issue: "Name", count: 12 },
  { issue: "Bank", count: 20 }
];

export default function AdminDashboard() {
  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Admin analytics</p>
        <h2>Common scholarship issues</h2>
      </div>
      <section className="stats-grid">
        <div className="stat-card blue"><p>Total students</p><strong>128</strong></div>
        <div className="stat-card green"><p>Eligible</p><strong>82</strong></div>
        <div className="stat-card amber"><p>High risk</p><strong>19</strong></div>
        <div className="stat-card teal"><p>Avg score</p><strong>74</strong></div>
      </section>
      <section className="panel chart-panel">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="issue" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
