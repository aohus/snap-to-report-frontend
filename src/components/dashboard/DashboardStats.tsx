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
    <div className="flex flex-nowrap overflow-x-auto md:grid md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8 pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 custom-scrollbar md:overflow-visible snap-x snap-mandatory">
      {/* Primary Card: Total Jobs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="md:col-span-2 min-w-[280px] md:min-w-0 snap-center"
      >
        <Card className="h-full border border-slate-200 shadow-subtle bg-white overflow-hidden group relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-500 text-primary">
            <FolderKanban size={140} />
          </div>
          <CardContent className="p-4 md:p-6 flex flex-col h-full justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                <div className="bg-primary/10 p-1 md:p-1.5 rounded-md">
                  <FolderKanban className="text-primary w-3.5 h-3.5 md:w-4 md:h-4" />
                </div>
                <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">전체 프로젝트</span>
              </div>
              <h3 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tighter leading-none py-1 md:py-2">
                {totalJobs}<span className="text-sm md:text-lg font-medium text-slate-300 ml-1.5 md:ml-2 italic">jobs</span>
              </h3>
            </div>
            <div className="mt-3 md:mt-4 flex items-center gap-6 md:gap-10">
              <div className="space-y-0.5 md:space-y-1">
                <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest">진행 중</p>
                <p className="text-lg md:text-2xl font-bold text-slate-700 leading-none">{totalJobs - completedJobs}</p>
              </div>
              <div className="w-px h-6 md:h-8 bg-slate-100" />
              <div className="space-y-0.5 md:space-y-1">
                <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest">최근 7일</p>
                <p className="text-lg md:text-2xl font-bold text-blue-600 leading-none">+{recentJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Secondary Card: Completed Reports */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="min-w-[200px] md:min-w-0 snap-center"
      >
        <Card className="h-full border border-slate-200 shadow-subtle bg-white overflow-hidden group relative">
          <CardContent className="p-4 md:p-6 flex flex-col h-full justify-between relative z-10">
            <div className="bg-emerald-50 text-emerald-600 w-8 h-8 md:w-10 md:h-10 rounded-md flex items-center justify-center mb-3 md:mb-4 group-hover:rotate-3 transition-transform">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">보고서 완료</p>
              <div className="flex items-baseline gap-1 md:gap-1.5">
                <span className="text-2xl md:text-4xl font-bold text-slate-900 leading-none">{completedJobs}</span>
                <span className="text-[10px] md:text-xs font-medium text-slate-300">items</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tertiary Card: Total Sites */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="min-w-[200px] md:min-w-0 snap-center"
      >
        <Card className="h-full border border-slate-200 shadow-subtle bg-white overflow-hidden group relative">
          <CardContent className="p-4 md:p-6 flex flex-col h-full justify-between relative z-10">
            <div className="bg-slate-50 text-slate-800 w-8 h-8 md:w-10 md:h-10 rounded-md flex items-center justify-center mb-3 md:mb-4 group-hover:scale-105 transition-transform">
              <LayoutGrid className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">등록 현장</p>
              <div className="flex items-baseline gap-1 md:gap-1.5">
                <span className="text-2xl md:text-4xl font-bold text-slate-900 leading-none">{totalSites}</span>
                <span className="text-[10px] md:text-xs font-medium text-slate-300">sites</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
