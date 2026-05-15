import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Analytics() {
  const { token } = useContext(AuthContext);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/analytics/energy`, {
      headers: { 'x-auth-token': token }
    })
    .then(res => res.json())
    .then(setData);
  }, [token]);

  if (!data) return <div className="text-brand-500 text-center mt-20 animate-pulse">Loading analytics...</div>;

  return (
    <div className="space-y-8 pb-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h2 className="text-4xl font-bold tracking-tight">Analytics Engine</h2>
        <p className="text-gray-400 mt-2 text-lg">Deep insights into your smart home efficiency. Current Load: {data.totalUsage} kW</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="min-h-[450px] flex flex-col">
          <h3 className="font-semibold text-xl mb-4">Live Energy Distribution</h3>
          <div className="flex-1 w-full min-h-0 flex items-center justify-center">
            {data.pieData.length === 0 ? (
              <p className="text-gray-500">No active devices</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 overflow-y-auto max-h-32 custom-scrollbar p-2 border-t border-white/5">
            {data.pieData.map((item, i) => (
              <div key={i} className="flex items-center gap-2" title={item.name}>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-300 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="min-h-[450px] flex flex-col">
          <h3 className="font-semibold text-xl mb-4">Weekly Consumption (kWh)</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.barData}>
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                  formatter={(value) => [`${value} kW`, 'Energy Consumed']}
                />
                <Bar dataKey="energy" fill="url(#colorBar)" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
