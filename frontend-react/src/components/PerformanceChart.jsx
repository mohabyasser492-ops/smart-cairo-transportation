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
    <div className="chart-card">
      <h3>Visited Nodes Comparison</h3>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="algorithm" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="visited_nodes" name="Visited Nodes" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
``