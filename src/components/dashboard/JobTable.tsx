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
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-bold">완료</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">실패</Badge>;
      case 'PROCESSING':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none animate-pulse font-bold">진행중</Badge>;
      case 'UPLOADING':
        return <Badge variant="outline" className="text-slate-500 font-bold">대기중</Badge>;
      default:
        return <Badge variant="secondary" className="font-bold">빈 작업</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <Input 
            placeholder="작업명, 시행처, 공종 검색..." 
            className="pl-10 h-11 bg-white border-slate-200 focus:border-blue-600 focus:ring-blue-600 rounded-xl transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 rounded-xl gap-2 border-slate-200 hover:bg-slate-50">
                <Filter className="w-4 h-4" />
                상태: {statusFilter === 'all' ? '전체' : statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl">
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>전체</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('COMPLETED')}>완료</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('PROCESSING')}>진행중</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('CREATED')}>대기중</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-professional overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead 
                className="w-[40%] cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-2">
                  작업 정보
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell">공종 / 시행처</TableHead>
              <TableHead 
                className="cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => handleSort('work_date')}
              >
                <div className="flex items-center gap-2">
                  작업일
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Search size={40} className="mb-4 opacity-20" />
                    <p className="text-lg font-bold">검색 결과가 없습니다.</p>
                    <p className="text-sm">다른 키워드로 검색해보세요.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedJobs.map((job) => (
                <TableRow 
                  key={job.id} 
                  className="group cursor-pointer hover:bg-blue-50/30 border-slate-100 transition-colors"
                  onClick={() => onNavigate(job.id)}
                >
                  <TableCell className="py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        ID: {job.id.slice(0, 8)}...
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 hidden md:table-cell">
                    <div className="flex flex-col gap-1 text-sm font-medium text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Hammer className="w-3.5 h-3.5 text-slate-400" />
                        <span>{job.construction_type || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{job.company_name || '-'}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {job.work_date ? format(new Date(job.work_date), 'yyyy.MM.dd') : '-'}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    {getStatusBadge(job.status)}
                  </TableCell>
                  <TableCell className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
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
