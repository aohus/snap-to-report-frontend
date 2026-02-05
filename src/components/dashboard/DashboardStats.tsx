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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* Primary Card: Total Jobs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="md:col-span-2"
      >
        <Card className="h-full border border-slate-200 shadow-subtle bg-white overflow-hidden group relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-500 text-primary">
            <FolderKanban size={140} />
          </div>
          <CardContent className="p-6 flex flex-col h-full justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-primary/10 p-1.5 rounded-md">
                  <FolderKanban className="text-primary w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">전체 프로젝트</span>
              </div>
              <h3 className="text-5xl font-bold text-slate-900 tracking-tighter leading-none py-2">
                {totalJobs}<span className="text-lg font-medium text-slate-300 ml-2 italic">jobs</span>
              </h3>
            </div>
            <div className="mt-4 flex items-center gap-10">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">진행 중</p>
                <p className="text-2xl font-bold text-slate-700 leading-none">{totalJobs - completedJobs}</p>
              </div>
              <div className="w-px h-8 bg-slate-100" />
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">최근 7일</p>
                <p className="text-2xl font-bold text-blue-600 leading-none">+{recentJobs}</p>
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
      >
        <Card className="h-full border border-slate-200 shadow-subtle bg-white overflow-hidden group relative">
          <CardContent className="p-6 flex flex-col h-full justify-between relative z-10">
            <div className="bg-emerald-50 text-emerald-600 w-10 h-10 rounded-md flex items-center justify-center mb-4 group-hover:rotate-3 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">보고서 완료</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-bold text-slate-900 leading-none">{completedJobs}</span>
                <span className="text-xs font-medium text-slate-300">items</span>
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
      >
        <Card className="h-full border border-slate-200 shadow-subtle bg-white overflow-hidden group relative">
          <CardContent className="p-6 flex flex-col h-full justify-between relative z-10">
            <div className="bg-slate-50 text-slate-800 w-10 h-10 rounded-md flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">등록 현장</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-bold text-slate-900 leading-none">{totalSites}</span>
                <span className="text-xs font-medium text-slate-300">sites</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
