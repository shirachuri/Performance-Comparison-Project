import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import backupData from './backupData.json';

const PerformanceChart = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

   useEffect(() => {
    // Accessing the environment variable
    const apiUrl = process.env.REACT_APP_API_URL || 'https://localhost:44304/api';

    fetch(`${apiUrl}/performance`)
        .then((response) => {
            if (!response.ok) throw new Error('Server is down');
            return response.json();
        })
        .then((json) => {
            setData(json);
            setLoading(false);
        })
        .catch((error) => {
            console.warn('API unavailable, switching to local JSON backup...', error);
            setData(backupData);
            setLoading(false);
        });
}, []);

    if (loading) {
        return <div className="loading-container">Gathering performance data from SQL...</div>;
    }

    // Helper function to calculate average time per processing engine
    const calculateAverage = (key) => {
        const validValues = data.map(item => item[key]).filter(v => v !== null);
        return validValues.length ? (validValues.reduce((a, b) => a + b, 0) / validValues.length).toFixed(2) : 0;
    };

    // Logic to determine the best performing engine based on global average
    const getWinner = () => {
        const avgSql = parseFloat(calculateAverage('sql'));
        const avgNode = parseFloat(calculateAverage('nodeJS'));
        const avgCSharp = parseFloat(calculateAverage('cSharp'));

        const minVal = Math.min(avgSql, avgNode, avgCSharp);

        if (minVal === avgSql) return { name: 'SQL Server', color: '#4e73df' };
        if (minVal === avgNode) return { name: 'Node.js', color: '#1cc88a' };
        return { name: 'C# .NET', color: '#f6c23e' };
    };
    
    const winner = getWinner();

    return (
        <div className="dashboard-layout">
            {/* Chart Section: Visualizing time differences per formula */}
            <div className="chart-section">
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>Performance Analysis by Formula ID</h3>
                <div style={{ width: '100%', height: '90%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 10, right: 10, left: 20, bottom: 40 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />

                            {/* X-Axis mapping to the Formula ID (Name) */}
                            <XAxis
                                dataKey="name"
                                label={{ value: 'Formula ID', position: 'bottom', offset: 20, fontSize: 14, fontWeight: 'bold' }}
                            />

                            {/* Y-Axis representing the duration in seconds */}
                            <YAxis
                                tickCount={13}
                                interval={0}
                                domain={[0, 'auto']}
                                label={{ value: 'Execution Time (Seconds)', angle: -90, position: 'insideLeft', offset: -5, fontSize: 14, fontWeight: 'bold' }}
                            />

                            <Tooltip
                                cursor={{ fill: '#f5f5f5' }}
                                formatter={(value) => [`${value} sec`, '']}
                            />
                            <Legend verticalAlign="top" height={40} />

                            {/* Different bars representing the three tested environments */}
                            <Bar dataKey="sql" fill="#4e73df" name="SQL Server" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="nodeJS" fill="#1cc88a" name="Node.js" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="cSharp" fill="#f6c23e" name="C# .NET" radius={[2, 2, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Sidebar: Winner badge and overall efficiency metrics */}
            <div className="table-section">
                <div style={{
                    backgroundColor: '#f8f9fc',
                    padding: '15px',
                    borderRadius: '10px',
                    marginBottom: '20px',
                    border: `2px solid ${winner.color}`,
                    textAlign: 'center'
                }}>
                    <span style={{ fontSize: '1.5rem' }}>🏆</span>
                    <h4 style={{ margin: '5px 0', color: '#333' }}>Fastest Engine</h4>
                    <strong style={{ color: winner.color, fontSize: '1.1rem' }}>{winner.name}</strong>
                </div>
                
                <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem' }}>Overall Efficiency</h3>
                <table className="summary-table">
                    <thead>
                        <tr>
                            <th>Engine</th>
                            <th>Avg Time (sec)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ color: '#4e73df', fontWeight: 'bold' }}>SQL Server</td>
                            <td>{calculateAverage('sql')} s</td>
                        </tr>
                        <tr>
                            <td style={{ color: '#1cc88a', fontWeight: 'bold' }}>Node.js</td>
                            <td>{calculateAverage('nodeJS')} s</td>
                        </tr>
                        <tr>
                            <td style={{ color: '#f6c23e', fontWeight: 'bold' }}>C# .NET</td>
                            <td>{calculateAverage('cSharp')} s</td>
                        </tr>
                    </tbody>
                </table>

                {/* Legend and Data definitions for clarity */}
                <div style={{ marginTop: '25px', fontSize: '0.8rem', color: '#555', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '5px' }}>
                    <strong>Definitions:</strong><br />
                    • <strong>Formula ID:</strong> Corresponds to the unique ID of the math formula processed.<br />
                    • <strong>Execution Time:</strong> Duration in seconds to complete the calculation.<br />
                    • <strong>Comparison:</strong> Highlights how each engine handles different formula complexities.
                </div>
            </div>
        </div>
    );
};

export default PerformanceChart;