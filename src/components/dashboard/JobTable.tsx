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
        return <Badge variant="success" className="font-semibold">완료</Badge>;
      case 'FAILED':
        return <Badge variant="destructive" className="font-semibold">실패</Badge>;
      case 'PROCESSING':
        return <Badge variant="info" className="animate-pulse font-semibold">진행중</Badge>;
      case 'UPLOADING':
        return <Badge variant="outline" className="text-slate-500 font-semibold border-slate-200">대기중</Badge>;
      default:
        return <Badge variant="secondary" className="font-semibold text-slate-400 border-none bg-slate-100/50">빈 작업</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="작업명, 시행처, 공종 검색..." 
            className="pl-10 h-10 bg-white border-slate-200 focus:border-primary focus:ring-primary/5 rounded-md transition-all text-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 text-sm font-semibold rounded-md gap-2 border-slate-200 hover:bg-white hover:border-slate-300 shadow-subtle transition-all">
                <Filter className="w-4 h-4 text-slate-400" />
                상태: {statusFilter === 'all' ? '전체' : statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-md shadow-elevated border-slate-100 p-1">
              <DropdownMenuItem onClick={() => setStatusFilter('all')} className="font-semibold rounded-md cursor-pointer">전체</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('COMPLETED')} className="font-semibold rounded-md cursor-pointer">완료</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('PROCESSING')} className="font-semibold rounded-md cursor-pointer">진행중</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('CREATED')} className="font-semibold rounded-md cursor-pointer">대기중</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="bg-white rounded-md border border-slate-200 shadow-subtle overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-200">
              <TableHead 
                className="w-[40%] cursor-pointer hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider text-slate-500 py-3 whitespace-nowrap"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-2 pl-2">
                  작업 정보
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell text-xs font-bold uppercase tracking-wider text-slate-500 py-3 whitespace-nowrap">공종 / 시행처</TableHead>
              <TableHead 
                className="cursor-pointer hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider text-slate-500 py-3 whitespace-nowrap"
                onClick={() => handleSort('work_date')}
              >
                <div className="flex items-center gap-2">
                  작업일
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                </div>
              </TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 py-3 whitespace-nowrap">상태</TableHead>
              <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-500 py-3 pr-6 whitespace-nowrap">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center bg-white">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <div className="bg-slate-50 p-4 rounded-full mb-4">
                      <Search size={32} className="opacity-20" />
                    </div>
                    <p className="text-sm font-semibold">검색 결과가 없습니다.</p>
                    <p className="text-xs text-slate-400 mt-1">다른 검색어나 필터를 사용해 보세요.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedJobs.map((job) => (
                <TableRow 
                  key={job.id} 
                  className="group cursor-pointer hover:bg-slate-50/50 border-slate-100 transition-colors"
                  onClick={() => onNavigate(job.id)}
                >
                  <TableCell className="py-4 pl-6 whitespace-nowrap md:whitespace-normal">
                    <div className="flex flex-col">
                      <span className="text-[15px] font-semibold text-slate-900 group-hover:text-primary transition-colors leading-snug">
                        {job.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 hidden md:table-cell whitespace-nowrap">
                    <div className="flex items-center gap-3 text-[13px] font-medium text-slate-500">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100">
                        <Hammer className="w-3 h-3 opacity-40" />
                        <span>{job.construction_type || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 opacity-30" />
                        <span>{job.company_name || '-'}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <Calendar className="w-3.5 h-3.5 opacity-40 text-slate-400" />
                      {job.work_date ? format(new Date(job.work_date), 'yyyy.MM.dd') : '-'}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 whitespace-nowrap">
                    {getStatusBadge(job.status)}
                  </TableCell>
                  <TableCell className="py-4 text-right pr-6 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 rounded-md shadow-elevated border-slate-100 p-1">
                        <DropdownMenuItem onClick={() => onNavigate(job.id)} className="gap-2 font-semibold rounded-md py-2">
                          <ExternalLink className="w-4 h-4 opacity-50" /> 작업 열기
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(job)} className="gap-2 font-semibold rounded-md py-2">
                          <Pencil className="w-4 h-4 opacity-50" /> 정보 수정
                        </DropdownMenuItem>
                        {job.export_status === 'EXPORTED' && (
                          <DropdownMenuItem onClick={() => onDownload(job.id)} className="gap-2 font-semibold text-green-600 rounded-md py-2">
                            <FileDown className="w-4 h-4" /> PDF 다운로드
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="my-1 bg-slate-100" />
                        <DropdownMenu>
                          <DropdownMenuTrigger className="flex w-full items-center px-2 py-2 text-sm font-semibold outline-none hover:bg-slate-100 rounded-md cursor-default">
                            <FolderInput className="w-4 h-4 mr-2 opacity-50" /> 현장 이동
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="left" className="w-48 rounded-md shadow-elevated p-1">
                            <DropdownMenuItem onClick={() => onMove(job.id, null)} className="font-medium rounded-md">
                              (미분류)
                            </DropdownMenuItem>
                            {sites.map(s => (
                              <DropdownMenuItem key={s.id} onClick={() => onMove(job.id, s.id)} className="font-medium rounded-md">
                                {s.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenuSeparator className="my-1 bg-slate-100" />
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600 gap-2 font-semibold rounded-md py-2"
                          onClick={() => onDelete(job.id)}
                        >
                          <Trash2 className="w-4 h-4 opacity-70" /> 삭제하기
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
