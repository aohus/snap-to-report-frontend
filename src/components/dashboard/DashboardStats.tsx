import { Job, Site } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutGrid, CheckCircle2, Clock, Activity, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStatsProps {
  jobs: Job[];
  sites: Site[];
  loading?: boolean;
}

export function DashboardStats({ jobs, sites, loading }: DashboardStatsProps) {
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(j => j.status === 'COMPLETED').length;
  const activeJobs = totalJobs - completedJobs;
  const totalSites = sites.length;
  const recentJobs = jobs.filter(j => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(j.created_at) > sevenDaysAgo;
  }).length;
  
  const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {/* 1. Active Jobs (Focus) */}
      <StatCard 
        icon={<Activity className="w-5 h-5 text-blue-600" />}
        iconBg="bg-blue-50"
        label="진행 중인 작업"
        value={activeJobs}
        subValue="Jobs"
      />

      {/* 2. Recent Activity (Velocity) */}
      <StatCard 
        icon={<Clock className="w-5 h-5 text-orange-600" />}
        iconBg="bg-orange-50"
        label="최근 7일 생성"
        value={`+${recentJobs}`}
        subValue="New"
        highlight
      />

      {/* 3. Completion Rate (Status) */}
      <StatCard 
        icon={<PieChart className="w-5 h-5 text-emerald-600" />}
        iconBg="bg-emerald-50"
        label="작업 완료율"
        value={`${completionRate}%`}
        subValue={`${completedJobs}/${totalJobs}`}
      />

      {/* 4. Sites (Context) */}
      <StatCard 
        icon={<LayoutGrid className="w-5 h-5 text-slate-600" />}
        iconBg="bg-slate-100"
        label="등록 현장"
        value={totalSites}
        subValue="Sites"
      />
    </div>
  );
}

function StatCard({ icon, iconBg, label, value, subValue, highlight = false }: { 
  icon: React.ReactNode; 
  iconBg: string; 
  label: string; 
  value: string | number; 
  subValue: string;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <Card className="h-full border border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4 flex items-center gap-4">
          <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>
            {icon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">{label}</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-black tracking-tight leading-none ${highlight ? 'text-blue-600' : 'text-slate-900'}`}>
                {value}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 truncate">{subValue}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
