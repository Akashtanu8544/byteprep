import React, { useState, useEffect } from 'react';
import { ContentCampaign, NormalizedQuestion, GeneratedContentPack } from '../../types';
import { QuestionLoader } from '../../services/questionLoader';
import { IndexedDbService } from '../../services/indexedDbService';
import {
  Megaphone,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Target,
  Sparkles,
  TrendingUp,
  BarChart2,
  Layers,
  ArrowLeft,
  Trash2,
  Play,
} from 'lucide-react';

interface CampaignManagerViewProps {
  onBack?: () => void;
  onOpenContentPack?: (question: NormalizedQuestion) => void;
}

const STORAGE_CAMPAIGNS_KEY = 'BYTEPREP_CREATOR_CAMPAIGNS';

const DEFAULT_CAMPAIGNS: ContentCampaign[] = [
  {
    campaignId: 'camp_dsssb_30day',
    name: 'DSSSB 30 Day CS Revision Challenge',
    description: '30 high-yield past year questions covering DBMS, Networks, OS, and Data Structures.',
    startDate: '2026-08-01',
    endDate: '2026-08-30',
    targetPlatform: 'all',
    targetExam: 'DSSSB TGT CS',
    topics: ['DBMS', 'Computer Networks', 'Operating Systems', 'Data Structures'],
    contentGoal: 'Drive 500+ Play Store installs before the DSSSB exam notification',
    targetPosts: 30,
    status: 'active',
    createdAt: '2026-08-01T00:00:00.000Z',
    contentItemIds: [],
  },
  {
    campaignId: 'camp_dbms_mastery',
    name: '100 DBMS PYQs Marathon',
    description: 'Deep dive into SQL queries, normalization, ACID properties, and relational algebra.',
    startDate: '2026-08-10',
    endDate: '2026-09-10',
    targetPlatform: 'youtube',
    targetExam: 'KVS / DSSSB PGT CS',
    topics: ['Database Management Systems', 'SQL', 'Normalization'],
    contentGoal: 'Establish BytePrep as the authority for DBMS exam prep',
    targetPosts: 25,
    status: 'active',
    createdAt: '2026-08-10T00:00:00.000Z',
    contentItemIds: [],
  },
];

export const CampaignManagerView: React.FC<CampaignManagerViewProps> = ({
  onBack,
  onOpenContentPack,
}) => {
  const [campaigns, setCampaigns] = useState<ContentCampaign[]>([]);
  const [contentPacks, setContentPacks] = useState<GeneratedContentPack[]>([]);
  const [isCreatingModal, setIsCreatingModal] = useState<boolean>(false);
  const [activeCampaignId, setActiveCampaignId] = useState<string>('');

  // Form State for Create Campaign
  const [formName, setFormName] = useState<string>('DSSSB 15-Day PYQ Sprint');
  const [formDesc, setFormDesc] = useState<string>('Daily 10-second CS challenges for upcoming DSSSB exam.');
  const [formDurationDays, setFormDurationDays] = useState<number>(15);
  const [formExam, setFormExam] = useState<string>('DSSSB TGT CS');
  const [formSubject, setFormSubject] = useState<string>('All');
  const [formGoal, setFormGoal] = useState<string>('Boost app downloads on Play Store');

  const allQuestions = QuestionLoader.getAllQuestions();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_CAMPAIGNS_KEY);
      if (raw) {
        setCampaigns(JSON.parse(raw));
      } else {
        setCampaigns(DEFAULT_CAMPAIGNS);
        localStorage.setItem(STORAGE_CAMPAIGNS_KEY, JSON.stringify(DEFAULT_CAMPAIGNS));
      }
    } catch {
      setCampaigns(DEFAULT_CAMPAIGNS);
    }

    IndexedDbService.getAllContentPacks().then(packs => {
      setContentPacks(packs);
    });
  }, []);

  const saveCampaignsList = (updated: ContentCampaign[]) => {
    setCampaigns(updated);
    try {
      localStorage.setItem(STORAGE_CAMPAIGNS_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleCreateCampaign = () => {
    const startDate = new Date().toISOString().split('T')[0];
    const end = new Date();
    end.setDate(end.getDate() + formDurationDays);
    const endDate = end.toISOString().split('T')[0];

    const newCampaign: ContentCampaign = {
      campaignId: `camp_${Date.now()}`,
      name: formName,
      description: formDesc,
      startDate,
      endDate,
      targetPlatform: 'all',
      targetExam: formExam,
      topics: formSubject === 'All' ? ['General CS'] : [formSubject],
      contentGoal: formGoal,
      targetPosts: formDurationDays,
      status: 'active',
      createdAt: new Date().toISOString(),
      contentItemIds: [],
    };

    const updated = [newCampaign, ...campaigns];
    saveCampaignsList(updated);
    setIsCreatingModal(false);
    setActiveCampaignId(newCampaign.campaignId);
  };

  const handleDeleteCampaign = (id: string) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      const updated = campaigns.filter(c => c.campaignId !== id);
      saveCampaignsList(updated);
      if (activeCampaignId === id) setActiveCampaignId('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5" />
              <span>MARKETING CAMPAIGN ENGINE</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Campaign Manager & Content Planner
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Organize multi-day marketing challenges (e.g. "30 Days of DBMS", "DSSSB PYQ Sprint") and track progress.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Campaigns Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.map(camp => {
          // Calculate stats for this campaign
          const campPacks = contentPacks.filter(
            p => p.campaignId === camp.campaignId || p.question.exam.includes(camp.targetExam)
          );
          const generatedCount = Math.min(camp.targetPosts, campPacks.length);
          const postedCount = campPacks.filter(p => p.status === 'POSTED' || p.postedAt).length;
          const remaining = Math.max(0, camp.targetPosts - postedCount);
          const completionPct = Math.min(
            100,
            Math.round((postedCount / (camp.targetPosts || 1)) * 100)
          );

          return (
            <div
              key={camp.campaignId}
              className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-md text-[10px] font-black uppercase">
                        {camp.targetExam}
                      </span>
                      <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>
                          {camp.startDate} to {camp.endDate}
                        </span>
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white">{camp.name}</h3>
                  </div>

                  <button
                    onClick={() => handleDeleteCampaign(camp.campaignId)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Delete Campaign"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {camp.description}
                </p>

                {/* Progress Stats */}
                <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                    <div className="text-sm font-black text-white">{camp.targetPosts}</div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase">Target</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                    <div className="text-sm font-black text-sky-400">{generatedCount}</div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase">Generated</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                    <div className="text-sm font-black text-emerald-400">{postedCount}</div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase">Posted</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                    <div className="text-sm font-black text-amber-400">{remaining}</div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase">Remaining</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400">Campaign Completion</span>
                    <span className="text-sky-400">{completionPct}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-amber-400 transition-all duration-500"
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 italic">
                  🎯 Goal: {camp.contentGoal.slice(0, 38)}...
                </span>

                {onOpenContentPack && (
                  <button
                    onClick={() => {
                      const q = QuestionLoader.getRandomQuestion({ subject: camp.topics[0] });
                      onOpenContentPack(q);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Next Day</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Campaign Modal */}
      {isCreatingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <span>Create Marketing Campaign</span>
              </h2>
              <button
                onClick={() => setIsCreatingModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold mb-1 block">Campaign Title</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold mb-1 block">Description & Focus</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold mb-1 block">Target Exam</label>
                  <input
                    type="text"
                    value={formExam}
                    onChange={e => setFormExam(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold mb-1 block">Duration (Days / Posts)</label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={formDurationDays}
                    onChange={e => setFormDurationDays(parseInt(e.target.value, 10) || 15)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold mb-1 block">Marketing / App Goal</label>
                <input
                  type="text"
                  value={formGoal}
                  onChange={e => setFormGoal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsCreatingModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Launch Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
