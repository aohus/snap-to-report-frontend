import { useState, useMemo } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Job, Site } from '@/types';
import { 
  Search, MoreHorizontal, FileDown, Pencil, Trash2, 
  ArrowUpDown, Building2, Hammer, Calendar, Filter, 
  FolderInput, ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface JobTableProps {
  jobs: Job[];
  sites: Site[];
  onNavigate: (jobId: string) => void;
  onEdit: (job: Job) => void;
  onDelete: (jobId: string) => void;
  onDownload: (jobId: string) => void;
  onMove: (jobId: string, siteId: string | null) => void;
}

export function JobTable({ 
  jobs, 
  sites, 
  onNavigate, 
  onEdit, 
  onDelete, 
  onDownload,
  onMove
}: JobTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | 'all'>('all');
  const [sortField, setSortField] = useState<keyof Job | 'work_date'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof Job | 'work_date') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedJobs = useMemo(() => {
    return jobs
      .filter(job => {
        const matchesSearch = 
          job.title.toLowerCase().includes(search.toLowerCase()) ||
          job.company_name?.toLowerCase().includes(search.toLowerCase()) ||
          job.construction_type?.toLowerCase().includes(search.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let aValue = a[sortField as keyof Job];
        let bValue = b[sortField as keyof Job];

        if (sortField === 'work_date') {
          aValue = a.work_date || '';
          bValue = b.work_date || '';
        }

        if (!aValue) return 1;
        if (!bValue) return -1;

        const comparison = String(aValue).localeCompare(String(bValue), undefined, { numeric: true });
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [jobs, search, statusFilter, sortField, sortOrder]);

  const getStatusBadge = (status: Job['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success" className="font-black">완료</Badge>;
      case 'FAILED':
        return <Badge variant="destructive" className="font-black">실패</Badge>;
      case 'PROCESSING':
        return <Badge variant="info" className="animate-pulse font-black">진행중</Badge>;
      case 'UPLOADING':
        return <Badge variant="outline" className="text-slate-400 font-black">대기중</Badge>;
      default:
        return <Badge variant="secondary" className="font-black text-slate-400 border-none bg-slate-50">빈 작업</Badge>;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="작업명, 시행처 검색..." 
            className="pl-9 h-10 bg-white/50 border-slate-200 focus:border-primary focus:ring-primary/10 rounded-xl transition-all text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 text-sm font-bold rounded-xl gap-2 border-slate-200 hover:bg-white hover:border-slate-300 shadow-sm transition-all">
                <Filter className="w-3.5 h-3.5 opacity-60" />
                상태: {statusFilter === 'all' ? '전체' : statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-elevated border-slate-100 p-1.5">
              <DropdownMenuItem onClick={() => setStatusFilter('all')} className="font-bold rounded-lg cursor-pointer">전체</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('COMPLETED')} className="font-bold rounded-lg cursor-pointer">완료</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('PROCESSING')} className="font-bold rounded-lg cursor-pointer">진행중</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('CREATED')} className="font-bold rounded-lg cursor-pointer">대기중</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-professional overflow-hidden">
        <Table className="text-base">
          <TableHeader className="bg-slate-50/80">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead 
                className="w-[45%] cursor-pointer hover:text-primary transition-colors text-[11px] font-black uppercase tracking-widest text-slate-400"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-2 pl-2">
                  작업 정보
                  <ArrowUpDown className="w-3 h-3 opacity-40" />
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell text-[11px] font-black uppercase tracking-widest text-slate-400">공종 / 시행처</TableHead>
              <TableHead 
                className="cursor-pointer hover:text-primary transition-colors text-[11px] font-black uppercase tracking-widest text-slate-400"
                onClick={() => handleSort('work_date')}
              >
                <div className="flex items-center gap-2">
                  작업일
                  <ArrowUpDown className="w-3 h-3 opacity-40" />
                </div>
              </TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400">상태</TableHead>
              <TableHead className="text-right text-[11px] font-black uppercase tracking-widest text-slate-400 pr-6">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center bg-slate-50/20">
                  <div className="flex flex-col items-center justify-center text-slate-300">
                    <Search size={32} className="mb-3 opacity-20" />
                    <p className="text-base font-black">결과가 없습니다.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedJobs.map((job) => (
                <TableRow 
                  key={job.id} 
                  className="group cursor-pointer hover:bg-slate-50/80 border-slate-100 transition-colors"
                  onClick={() => onNavigate(job.id)}
                >
                  <TableCell className="py-3 pl-6">
                    <div className="flex flex-col">
                      <span className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">
                        {job.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 hidden md:table-cell">
                    <div className="flex items-center gap-4 text-sm font-bold text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Hammer className="w-3.5 h-3.5 opacity-40" />
                        <span>{job.construction_type || '-'}</span>
                      </div>
                      <div className="w-px h-3 bg-slate-200" />
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 opacity-40" />
                        <span>{job.company_name || '-'}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                      <Calendar className="w-3.5 h-3.5 opacity-40" />
                      {job.work_date ? format(new Date(job.work_date), 'yyyy.MM.dd') : '-'}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    {getStatusBadge(job.status)}
                  </TableCell>
                  <TableCell className="py-3 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100">
                          <MoreHorizontal className="w-5 h-5 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-emphasis">
                        <DropdownMenuItem onClick={() => onNavigate(job.id)} className="gap-2 font-bold">
                          <ExternalLink className="w-4 h-4" /> 작업 열기
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(job)} className="gap-2 font-bold">
                          <Pencil className="w-4 h-4" /> 수정
                        </DropdownMenuItem>
                        {job.export_status === 'EXPORTED' && (
                          <DropdownMenuItem onClick={() => onDownload(job.id)} className="gap-2 font-bold text-green-600">
                            <FileDown className="w-4 h-4" /> PDF 다운로드
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenu>
                          <DropdownMenuTrigger className="flex w-full items-center px-2 py-1.5 text-sm font-bold outline-none hover:bg-slate-100">
                            <FolderInput className="w-4 h-4 mr-2" /> 현장 이동
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="left" className="w-48 rounded-xl shadow-emphasis">
                            <DropdownMenuItem onClick={() => onMove(job.id, null)} className="font-medium">
                              (미분류)
                            </DropdownMenuItem>
                            {sites.map(s => (
                              <DropdownMenuItem key={s.id} onClick={() => onMove(job.id, s.id)} className="font-medium">
                                {s.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600 gap-2 font-bold"
                          onClick={() => onDelete(job.id)}
                        >
                          <Trash2 className="w-4 h-4" /> 삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
