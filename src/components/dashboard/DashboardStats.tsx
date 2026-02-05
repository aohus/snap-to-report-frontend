import { Job, Site } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutGrid, CheckCircle2, Clock, FolderKanban } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStatsProps {
  jobs: Job[];
  sites: Site[];
  loading?: boolean;
}

export function DashboardStats({ jobs, sites, loading }: DashboardStatsProps) {
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(j => j.status === 'COMPLETED').length;
  const totalSites = sites.length;
  const recentJobs = jobs.filter(j => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(j.created_at) > sevenDaysAgo;
  }).length;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        <div className="md:col-span-2 h-48 bg-slate-100 animate-pulse rounded-3xl" />
        <div className="h-48 bg-slate-100 animate-pulse rounded-3xl" />
        <div className="h-48 bg-slate-100 animate-pulse rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
      {/* Primary Card: Total Jobs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="md:col-span-2"
      >
        <Card className="h-full border border-slate-200 shadow-emphasis bg-white overflow-hidden group relative">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] -mr-4 -mt-4 group-hover:scale-110 transition-transform duration-500 text-primary">
            <FolderKanban size={160} />
          </div>
          <CardContent className="p-5 flex flex-col h-full justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="bg-primary/10 p-1 rounded-lg">
                  <FolderKanban className="text-primary w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">전체 프로젝트</span>
              </div>
              <h3 className="text-6xl font-black text-slate-900 tracking-tighter leading-none py-1">
                {totalJobs}<span className="text-xl font-black text-slate-200 ml-2">jobs</span>
              </h3>
            </div>
            <div className="mt-2 flex items-center gap-8">
              <div className="space-y-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">진행 중</p>
                <p className="text-xl font-black text-slate-700 leading-none">{totalJobs - completedJobs}</p>
              </div>
              <div className="w-px h-6 bg-slate-100" />
              <div className="space-y-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">최근 7일</p>
                <p className="text-xl font-black text-blue-600 leading-none">+{recentJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Secondary Card: Completed Reports */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="h-full border border-emerald-100 shadow-professional bg-white overflow-hidden group relative">
          <div className="absolute inset-0 bg-emerald-50/20" />
          <CardContent className="p-5 flex flex-col h-full justify-between relative z-10">
            <div className="bg-emerald-500 text-white w-9 h-9 rounded-xl flex items-center justify-center mb-2 shadow-lg shadow-emerald-100 group-hover:rotate-6 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-0.5">보고서 완료</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-slate-900 leading-none">{completedJobs}</span>
                <span className="text-[11px] font-black text-slate-300">items</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tertiary Card: Total Sites */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="h-full border border-slate-200 shadow-professional bg-white overflow-hidden group relative">
          <div className="absolute inset-0 bg-slate-50/50" />
          <CardContent className="p-5 flex flex-col h-full justify-between relative z-10">
            <div className="bg-slate-800 text-white w-9 h-9 rounded-xl flex items-center justify-center mb-2 shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">등록 현장</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-slate-900 leading-none">{totalSites}</span>
                <span className="text-[11px] font-black text-slate-300">sites</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
