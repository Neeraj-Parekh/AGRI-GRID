import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
export function Spark({ data, color='#2D78B7' }){
  const d = data.filter((_,i)=>i%4===0);
  return <div style={{height:44}}><ResponsiveContainer><AreaChart data={d} margin={{top:2,bottom:0,left:0,right:0}}><Area type="monotone" dataKey="v" stroke={color} fill={color} fillOpacity={0.18} strokeWidth={1.6} isAnimationActive={false}/></AreaChart></ResponsiveContainer></div>;
}
export function WaterChart({ data }){
  return <div style={{height:220}}><ResponsiveContainer><LineChart data={data} margin={{top:8,right:8,left:-18,bottom:0}}><XAxis dataKey="t" tick={{fontSize:10}} interval={7}/><YAxis tick={{fontSize:10}} domain={[0,9]}/><Tooltip/><Line type="monotone" dataKey="v" stroke="#2D78B7" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div>;
}
