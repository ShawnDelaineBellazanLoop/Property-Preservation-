import React from 'react';
import { PropertyStop } from '../types';
import { formatCurrency } from '../utils';
import { CheckSquare, AlertTriangle, Home, FileText, Filter } from 'lucide-react';

interface SummaryStatsProps {
  stops: PropertyStop[];
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

export default function SummaryStats({ stops, activeFilter, setActiveFilter }: SummaryStatsProps) {
  // Compute metrics
  const totalStops = stops.length;
  const highPriorityStops = stops.filter(s => s.priority === 'high').length;
  
  let totalItems = 0;
  let checkedItems = 0;
  let totalDelinquent = 0;
  
  stops.forEach(stop => {
    totalItems += stop.items.length;
    checkedItems += stop.items.filter(i => i.checked).length;
    if (stop.delinquentAmount) {
      totalDelinquent += stop.delinquentAmount;
    }
  });

  const overallProgress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
  
  const completedStops = stops.filter(stop => {
    return stop.items.length > 0 && stop.items.every(i => i.checked);
  }).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Overall Progress Widget */}
      <div className="glass-panel p-5 rounded-xl relative overflow-hidden flex flex-col justify-between border-white/10 hover:border-emerald-500/20 glow-green transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-500">System Progress</span>
          <CheckSquare className="w-5 h-5 text-emerald-400 animate-pulse" />
        </div>
        <div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-heading font-bold text-white transition-all">{overallProgress}%</span>
            <span className="text-xs text-gray-400">({checkedItems}/{totalItems} items)</span>
          </div>
          {/* Neon mini progress bar */}
          <div className="w-full bg-[#0a0a0b] h-1.5 rounded-full overflow-hidden mt-3 border border-white/5">
            <div 
              style={{ width: `${overallProgress}%` }} 
              className="bg-emerald-500 h-full rounded-full transition-all duration-550 ease-out shadow-[0_0_8px_rgba(16,185,129,0.4)]"
            />
          </div>
        </div>
      </div>

      {/* Active Stops Widget */}
      <div className="glass-panel p-5 rounded-xl relative overflow-hidden flex flex-col justify-between border-white/10 hover:border-cyan-500/20 glow-cyan transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-500">Field Stops</span>
          <Home className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-heading font-bold text-white">{completedStops}/{totalStops}</span>
            <span className="text-xs text-gray-400">completed</span>
          </div>
          <div className="text-xs text-gray-400 mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
            <span>High Priority: {highPriorityStops} remaining</span>
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          </div>
        </div>
      </div>

      {/* Total Delinquent Under Walkthrough */}
      <div className="glass-panel p-5 rounded-xl relative overflow-hidden flex flex-col justify-between border-white/10 hover:border-amber-500/20 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-500">Inspection Value</span>
          <AlertTriangle className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <div className="flex flex-col">
            <span className="text-2xl font-mono font-bold text-amber-450">{formatCurrency(totalDelinquent)}</span>
            <span className="text-[9px] uppercase tracking-wider text-gray-500 mt-1">Sum Delinquent On-Walk</span>
          </div>
          <div className="text-xs text-gray-400 mt-3 pt-2 border-t border-white/5 flex justify-between">
            <span>Stops Audited:</span>
            <span className="font-mono text-gray-300">{stops.filter(s => s.items.some(i => i.checked)).length} Active</span>
          </div>
        </div>
      </div>

      {/* Filter and Selection Panel */}
      <div className="glass-panel p-5 rounded-xl flex flex-col justify-between border-white/10 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-500 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-500" /> Walk Filters
          </span>
        </div>
        <div className="flex flex-col gap-1.5 mt-1">
          <button 
            id="filter-all"
            onClick={() => setActiveFilter('all')}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex justify-between items-center ${
              activeFilter === 'all' 
                ? 'bg-white/5 text-emerald-400 border border-white/10 shadow-sm' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span>All Stops</span>
            <span className="bg-[#0a0a0b] border border-white/5 px-1.5 py-0.5 rounded text-[10px] text-gray-400">{stops.length}</span>
          </button>
          
          <button 
            id="filter-high"
            onClick={() => setActiveFilter('high')}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex justify-between items-center ${
              activeFilter === 'high' 
                ? 'bg-white/5 text-rose-400 border border-white/10 shadow-sm' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Urgent
            </span>
            <span className="bg-[#0a0a0b] border border-white/5 px-1.5 py-0.5 rounded text-[10px] text-gray-400">{stops.filter(s => s.priority === 'high').length}</span>
          </button>

          <button 
            id="filter-incomplete"
            onClick={() => setActiveFilter('incomplete')}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex justify-between items-center ${
              activeFilter === 'incomplete' 
                ? 'bg-white/5 text-cyan-400 border border-white/10 shadow-sm' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span>Active Walk / Incomplete</span>
            <span className="bg-[#0a0a0b] border border-white/5 px-1.5 py-0.5 rounded text-[10px] text-gray-400">
              {stops.filter(s => !s.items.every(i => i.checked)).length}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
