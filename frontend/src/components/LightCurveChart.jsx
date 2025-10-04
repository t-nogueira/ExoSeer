import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const LightCurveChart = ({ data }) => {
  const chartData = useMemo(() => {
    if (!data || !data.time || !data.flux) return [];
    
    return data.time.map((time, index) => ({
      time: time,
      flux: data.flux[index],
      flux_err: data.flux_err ? data.flux_err[index] : null
    })).filter(point => 
      point.time !== null && 
      point.time !== undefined && 
      point.flux !== null && 
      point.flux !== undefined
    );
  }, [data]);
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white text-sm">
            Time: {typeof label === 'number' ? label.toFixed(6) : label}
          </p>
          <p className="text-blue-400 text-sm">
            Flux: {payload[0].value.toFixed(6)}
          </p>
          {payload[0].payload.flux_err && (
            <p className="text-gray-400 text-sm">
              Error: ±{payload[0].payload.flux_err.toFixed(6)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  
  if (!data || chartData.length === 0) {
    return (
      <Card className="border-gray-700">
        <CardHeader>
          <CardTitle>Light Curve Data</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <div className="text-gray-400">No light curve data available</div>
        </CardContent>
      </Card>
    );
  }
  
  const stats = {
    points: chartData.length,
    timeSpan: chartData.length > 0 ? (Math.max(...chartData.map(d => d.time)) - Math.min(...chartData.map(d => d.time))).toFixed(2) : 0,
    mission: data.mission || 'Unknown',
    target: data.target_name || 'Unknown'
  };
  
  return (
    <Card className="border-gray-700" data-testid="light-curve-chart">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Light Curve Data</span>
          <div className="text-sm font-normal text-gray-400">
            {stats.mission} • {stats.points} points
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-2 rounded bg-gray-800/50">
            <div className="text-lg font-semibold text-blue-400">{stats.points}</div>
            <div className="text-gray-400">Data Points</div>
          </div>
          <div className="text-center p-2 rounded bg-gray-800/50">
            <div className="text-lg font-semibold text-green-400">{stats.timeSpan}</div>
            <div className="text-gray-400">Time Span (days)</div>
          </div>
          <div className="text-center p-2 rounded bg-gray-800/50">
            <div className="text-lg font-semibold text-purple-400">{stats.mission}</div>
            <div className="text-gray-400">Mission</div>
          </div>
          <div className="text-center p-2 rounded bg-gray-800/50">
            <div className="text-lg font-semibold text-yellow-400 truncate">{stats.target}</div>
            <div className="text-gray-400">Target</div>
          </div>
        </div>
        
        <div className="h-64 w-full" data-testid="light-curve-plot">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={(value) => typeof value === 'number' ? value.toFixed(2) : value}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={(value) => typeof value === 'number' ? value.toFixed(4) : value}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="flux" 
                stroke="#3B82F6" 
                strokeWidth={1}
                dot={false}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          Interactive light curve showing normalized flux vs. time. Hover for detailed values.
        </div>
      </CardContent>
    </Card>
  );
};

export default LightCurveChart;