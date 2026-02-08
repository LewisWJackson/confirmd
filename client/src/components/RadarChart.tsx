import React from "react";
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RadarChartProps {
  scores: {
    price: number;
    timeline: number;
    regulatory: number;
    partnership: number;
    technology: number;
    market: number;
  };
}

const RadarChart: React.FC<RadarChartProps> = ({ scores }) => {
  const data = [
    { category: "Price", value: scores.price, fullMark: 100 },
    { category: "Timeline", value: scores.timeline, fullMark: 100 },
    { category: "Regulatory", value: scores.regulatory, fullMark: 100 },
    { category: "Partnership", value: scores.partnership, fullMark: 100 },
    { category: "Technology", value: scores.technology, fullMark: 100 },
    { category: "Market", value: scores.market, fullMark: 100 },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="rgba(148,163,184,0.15)" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: "rgb(148,163,184)", fontSize: 11, fontWeight: 700 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Accuracy"
            dataKey="value"
            stroke="#06b6d4"
            fill="url(#confirmdRadarGrad)"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(15,23,42,0.95)",
              border: "1px solid rgba(148,163,184,0.2)",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "12px",
              fontWeight: 700,
            }}
            formatter={(value: number) => [`${value}%`, "Accuracy"]}
          />
          <defs>
            <linearGradient id="confirmdRadarGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
            </linearGradient>
          </defs>
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChart;
