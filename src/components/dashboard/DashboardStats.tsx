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

  const stats = [
    {
      title: '전체 작업',
      value: totalJobs,
      icon: FolderKanban,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: '진행 중인 모든 프로젝트',
    },
    {
      title: '완료된 보고서',
      value: completedJobs,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: '최종 검토 완료',
    },
    {
      title: '현장 목록',
      value: totalSites,
      icon: LayoutGrid,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      description: '등록된 공사 현장',
    },
    {
      title: '최근 활동',
      value: recentJobs,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: '최근 7일간 추가된 작업',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse border-none shadow-professional">
            <CardContent className="p-6">
              <div className="h-12 w-12 bg-slate-100 rounded-lg mb-4" />
              <div className="h-4 w-24 bg-slate-100 rounded mb-2" />
              <div className="h-8 w-12 bg-slate-100 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="border-none shadow-professional hover:shadow-emphasis transition-all duration-200 overflow-hidden group">
            <CardContent className="p-6 relative">
              <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity`}>
                <stat.icon size={80} />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className={`${stat.bgColor} p-3 rounded-xl`}>
                  <stat.icon className={`${stat.color} w-6 h-6`} />
                </div>
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  {stat.title}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {stat.value}
                </span>
                <span className="text-sm font-medium text-slate-400">
                  건
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
