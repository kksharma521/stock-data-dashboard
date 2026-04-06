import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import './AdvancedChart.css';

// Candlestick Chart Component
const CandlestickChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <ComposedChart
        data={data}
        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(date) => {
            const d = new Date(date);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '10px',
          }}
          formatter={(value) => `$${value.toFixed(2)}`}
          labelFormatter={(label) => new Date(label).toLocaleDateString()}
        />
        <Bar
          dataKey="open"
          fill="transparent"
          shape={<CandlestickShape />}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

// Custom candlestick shape renderer
const CandlestickShape = (props) => {
  const { x, y, width, payload } = props;
  if (!payload) return null;

  const { open, close, high, low } = payload;
  const scale = 50; // Price scale for SVG

  const openY = 300 - open * scale;
  const closeY = 300 - close * scale;
  const highY = 300 - high * scale;
  const lowY = 300 - low * scale;

  const color = close >= open ? '#22c55e' : '#ef4444';
  const bodyTop = Math.min(openY, closeY);
  const bodyHeight = Math.abs(closeY - openY);

  return (
    <g>
      {/* Wick */}
      <line x1={x + width / 2} y1={highY} x2={x + width / 2} y2={lowY} stroke={color} strokeWidth={1} />
      {/* Body */}
      <rect
        x={x + width / 4}
        y={bodyTop}
        width={width / 2}
        height={bodyHeight || 2}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

// Line Chart Component
const LineChartComponent = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(date) => {
            const d = new Date(date);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '10px',
          }}
          formatter={(value) => `$${value.toFixed(2)}`}
          labelFormatter={(label) => new Date(label).toLocaleDateString()}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="close"
          stroke="#667eea"
          strokeWidth={2}
          dot={false}
          name="Close Price"
        />
        <Line
          type="monotone"
          dataKey="ma_7"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
          name="7-Day MA"
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Area Chart Component
const AreaChartComponent = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
        <defs>
          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(date) => {
            const d = new Date(date);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '10px',
          }}
          formatter={(value) => `$${value.toFixed(2)}`}
          labelFormatter={(label) => new Date(label).toLocaleDateString()}
        />
        <Area
          type="monotone"
          dataKey="close"
          stroke="#667eea"
          fillOpacity={1}
          fill="url(#colorPrice)"
          name="Close Price"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// Bar Chart Component for Price Range
const BarChartComponent = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(date) => {
            const d = new Date(date);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '10px',
          }}
          formatter={(value) => `$${value.toFixed(2)}`}
          labelFormatter={(label) => new Date(label).toLocaleDateString()}
        />
        <Legend />
        <Bar dataKey="close" fill="#667eea" name="Close Price" radius={[8, 8, 0, 0]} />
        <Bar dataKey="ma_7" fill="#f59e0b" name="7-Day MA" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Daily Return Chart
const ReturnChartComponent = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(date) => {
            const d = new Date(date);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '10px',
          }}
          formatter={(value) => `${value.toFixed(2)}%`}
          labelFormatter={(label) => new Date(label).toLocaleDateString()}
        />
        <Bar
          dataKey="daily_return_pct"
          fill="#667eea"
          name="Daily Return %"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export { LineChartComponent, AreaChartComponent, BarChartComponent, CandlestickChart, ReturnChartComponent };
