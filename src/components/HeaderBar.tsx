import React, { useState } from 'react';
import { PropertyStop } from '../types';
import { downloadTextReport, encodeWalkthroughState } from '../utils';
import { 
  Download, 
  Share2, 
  RefreshCw, 
  Plus, 
  User, 
  CheckCircle, 
  MapPin, 
  Award,
  ExternalLink,
  GitBranch,
  Github
} from 'lucide-react';

interface HeaderBarProps {
  stops: PropertyStop[];
  inspectorName: string;
  setInspectorName: (name: string) => void;
  onOpenAddStop: () => void;
  onResetWalk: () => void;
  syncState: 'idle' | 'syncing' | 'synced';
  lastSyncTime: string;
}

export default function HeaderBar({ 
  stops, 
  inspectorName, 
  setInspectorName, 
  onOpenAddStop, 
  onResetWalk,
  syncState = 'synced',
  lastSyncTime = 'Active'
}: HeaderBarProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Download Action
  const handleDownload = () => {
    downloadTextReport(stops, inspectorName);
  };

  // Generate Compressed URL and Share
  const handleShare = async () => {
    try {
      const stateToEncode = { stops, inspector: inspectorName };
      const encoded = encodeWalkthroughState(stateToEncode);
      
      // Build the shareable link using the window location
      const shareUrl = `${window.location.origin}${window.location.pathname}?state=${encoded}`;

      if (navigator.share) {
        await navigator.share({
          title: 'Tooensure LLC Property Walkthrough Checklist',
          text: `Checkout Shawn's property walkthrough report with active notes & checklists!`,
          url: shareUrl,
        });
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2500);
      }
    } catch (err) {
      console.error('Error sharing walkthrough state:', err);
      // Fallback
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0f0f12] border-b border-white/10 p-4 md:py-4 md:px-8 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.4)]">
            <div className="w-4 h-4 border-2 border-black rotate-45"></div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-white italic">
                TOOENSURE <span className="text-emerald-500 font-medium not-italic text-sm ml-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15">LLC</span>
              </span>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ml-1" title="System Ready Offline"></span>
            </div>
            <p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase mt-0.5">
              Field Walkthrough Checklist & Photos
            </p>
          </div>
        </div>

        {/* Middle Area: Custom Inspector Name */}
        <div className="flex items-center gap-2.5 bg-black/40 px-3.5 py-1.5 rounded-lg border border-white/10 self-start md:self-auto w-full md:w-auto">
          <User className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <div className="flex flex-col w-full md:w-auto">
            <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold leading-none">
              WALK DISPATCH AGENT
            </span>
            <input
              id="inspector-name-input"
              type="text"
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              placeholder="Shawn"
              className="bg-transparent border-none text-white text-xs font-bold focus:outline-none focus:ring-0 p-0 m-0 w-24 md:w-28 leading-normal mt-0.5"
            />
          </div>
        </div>

        {/* GitHub Repository Connector Status */}
        <div className="flex items-center gap-2.5 bg-black/40 px-3.5 py-1.5 rounded-lg border border-white/10 self-start md:self-auto w-full md:w-auto">
          <Github className={`w-4 h-4 flex-shrink-0 transition-colors ${syncState === 'syncing' ? 'text-cyan-400' : 'text-gray-400'}`} />
          <div className="flex flex-col w-full md:w-auto">
            <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold leading-none flex items-center gap-1.5">
              {syncState === 'syncing' ? (
                <>
                  <span className="text-cyan-400 font-bold animate-pulse">SYNCING TO GITHUB...</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                </>
              ) : (
                <>
                  <span>GITHUB SYNCED {lastSyncTime && `(${lastSyncTime})`}</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </>
              )}
            </span>
            <a 
              href="https://github.com/ShawnDelaineBellazanLoop/Property-Preservation"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold font-mono tracking-tight mt-0.5 flex items-center gap-1 hover:underline truncate max-w-[200px]"
              title="Click to visit repo"
            >
              <GitBranch className={`w-3 h-3 text-emerald-500 flex-shrink-0 ${syncState === 'syncing' ? 'animate-spin' : ''}`} />
              <span className="truncate">Property-Preservation</span>
            </a>
          </div>
        </div>

        {/* Action Button cluster */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 self-end md:self-auto w-full md:w-auto">
          
          {/* Add Stop Button */}
          <button
            id="header-add-stop-btn"
            onClick={onOpenAddStop}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg text-xs font-semibold tracking-wide transition-all grow md:grow-0 hover:text-emerald-400 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-500" /> Stop Address
          </button>

          {/* Download Text Report */}
          <button
            id="download-report-btn"
            onClick={handleDownload}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg text-xs font-semibold tracking-wide transition-all grow md:grow-0 hover:text-cyan-400 cursor-pointer"
          >
            <Download className="w-4 h-4 text-cyan-400" /> Export Walk
          </button>

          {/* Share Walk */}
          <button
            id="share-walk-btn"
            onClick={handleShare}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all grow md:grow-0 cursor-pointer ${
              copiedUrl 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/5 border border-white/10 hover:bg-white/10 text-white hover:text-amber-400'
            }`}
          >
            <Share2 className={`w-4 h-4 ${copiedUrl ? 'text-emerald-400' : 'text-amber-500'}`} />
            {copiedUrl ? 'Link Copied!' : 'Share Walk'}
          </button>

          {/* Reset Walk state */}
          <button
            id="reset-walk-btn"
            onClick={() => {
              if (window.confirm("A clean reset will wipe custom comments and photo attachment logs. Confirm?")) {
                onResetWalk();
              }
            }}
            className="p-2 border border-white/10 hover:border-rose-500/30 bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
            title="Reset walk to default templates"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

        </div>

      </div>
    </header>
  );
}
