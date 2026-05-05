import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function PerformanceChart({ data = [] }) {
  if (!data.length) {
    return <div className="empty-state">No performance data available yet.</div>;
  }

  return (
    <div className="chart-stack">
      <div className="details-card">
        <h4>Visited Nodes Comparison</h4>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="algorithm" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="visited_nodes" name="Visited Nodes" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="details-card">
        <h4>Runtime Comparison (ms)</h4>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="algorithm" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="runtime_ms" name="Runtime (ms)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="details-card">
        <h4>Total Cost Comparison</h4>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="algorithm" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total_cost" name="Total Cost" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}