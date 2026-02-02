import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { AuthService } from '@/lib/auth';
import { Job, Site } from '@/types';
import { 
  Plus, Loader2, LayoutGrid, Calendar, LogOut, FileDown, 
  Pencil, Building2, Hammer, MoreVertical, Trash2, 
  User, Folder as FolderIcon, FolderPlus, MoreHorizontal, 
  MoveRight, ChevronRight 
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function JobList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sortField, setSortField] = useState<'title' | 'created_at' | 'work_date'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Site Management State
  const [selectedSiteId, setSelectedSiteId] = useState<string | 'unclassified' | null>(null);
  const [newSiteName, setNewSiteName] = useState('');
  const [isAddingSite, setIsAddingSite] = useState(false);

  // Create Job State
  const [createJobDialogOpen, setCreateJobDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    work_date: '',
    company_name: '',
    construction_type: ''
  });

  // Edit State
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    work_date: '',
    company_name: '',
    construction_type: ''
  });

  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [jobsData, sitesData] = await Promise.all([
        api.getJobs(),
        api.getSites()
      ]);
      setJobs(jobsData);
      setSites(sitesData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    setEditingJob(job);
    setEditForm({
      title: job.title,
      work_date: job.work_date || '',
      company_name: job.company_name || '',
      construction_type: job.construction_type || ''
    });
  };

  const handleUpdateJob = async () => {
    if (!editingJob) return;
    try {
      await api.updateJob(editingJob.id, {
        title: editForm.title,
        work_date: editForm.work_date || undefined,
        company_name: editForm.company_name,
        construction_type: editForm.construction_type
      });
      toast.success('Job updated successfully');
      setEditingJob(null);
      loadData();
    } catch (error) {
      toast.error('Failed to update job');
    }
  };

  const handleCreateJob = () => {
    setCreateForm({
        title: '',
        work_date: '',
        company_name: '',
        construction_type: ''
    });
    setCreateJobDialogOpen(true);
  };

  const handleConfirmCreateJob = async () => {
    setCreating(true);
    try {
        const titleToUse = createForm.title.trim() || `작업 ${jobs.length + 1}`;
        // Automatically assign to selected site if it's a specific site (not null or unclassified)
        const siteIdToUse = (selectedSiteId && selectedSiteId !== 'unclassified') ? selectedSiteId : undefined;

        const newJob = await api.createJob(
            titleToUse, 
            createForm.construction_type, 
            createForm.company_name,
            siteIdToUse
        );
        if (createForm.work_date) {
            await api.updateJob(newJob.id, { work_date: createForm.work_date });
        }
        toast.success('Job created successfully');

        // Fix: Close dialog and reset state BEFORE navigation to prevent 'InsertBefore' error on Edge
        setCreateJobDialogOpen(false);
        setCreating(false);

        // Allow DOM to settle (dialog close animation) before navigating
        setTimeout(() => {
            navigate(`/jobs/${newJob.id}`);
        }, 100);
    } catch (error) {
        toast.error('Failed to create job');
        setCreating(false);
        setCreateJobDialogOpen(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await api.deleteJob(jobId);
      toast.success('Job deleted successfully');
    } catch (error) {
      toast.error('Failed to delete job');
    } finally {
      loadData();
    }
  };

  const handleDownload = async (jobId: string) => {
    try {
      const response = await api.getDownloadUrl(jobId);
      if (response.path) {
        window.open(response.path, '_blank');
      }
    } catch (error) {
      toast.error('Failed to download pdf');
    }
  }

  const handleLogout = async () => {
    try {
      await AuthService.logout();
    } finally {
      navigate('/login');
    }
  };

  const handleAddSite = async () => {
    if (newSiteName.trim()) {
      try {
        await api.createSite(newSiteName.trim());
        setNewSiteName('');
        setIsAddingSite(false);
        toast.success('새 현장이 생성되었습니다.');
        loadData();
      } catch (e) {
        toast.error('현장 생성 실패');
      }
    }
  };

  const handleUpdateSite = async (siteId: string, currentName: string) => {
    const newName = prompt('현장 이름을 수정하세요', currentName);
    if (newName && newName !== currentName) {
      try {
        await api.updateSite(siteId, { name: newName });
        toast.success('현장 이름이 수정되었습니다.');
        loadData();
      } catch (e) {
        toast.error('현장 수정 실패');
      }
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (confirm('현장을 삭제하시겠습니까? (작업은 삭제되지 않고 미분류로 이동됩니다)')) {
      try {
        await api.deleteSite(siteId);
        if (selectedSiteId === siteId) setSelectedSiteId(null);
        toast.success('현장이 삭제되었습니다.');
        loadData();
      } catch (e) {
        toast.error('현장 삭제 실패');
      }
    }
  };

  const handleMoveJob = async (jobId: string, targetSiteId: string | null) => {
    try {
      const job = jobs.find(j => j.id === jobId);
      if (!job) return;

      // Same location check
      if (job.site_id === targetSiteId || (job.site_id === null && targetSiteId === null)) return;

      if (targetSiteId) {
        // Move to a specific site
        await api.addJobsToSite(targetSiteId, [jobId]);
      } else {
        // Remove from current site (move to unclassified)
        if (job.site_id) {
            await api.removeJobFromSite(job.site_id, jobId);
        }
      }
      toast.success('작업이 이동되었습니다.');
      loadData();
    } catch (e) {
      toast.error('작업 이동 실패');
    }
  };

  const getTargetJobs = () => {
    if (selectedSiteId === null) {
      return jobs;
    }
    if (selectedSiteId === 'unclassified') {
      return jobs.filter(job => !job.site_id || !sites.some(s => s.id === job.site_id));
    }
    const site = sites.find(s => s.id === selectedSiteId);
    return site?.jobs || [];
  };

  const filteredJobs = getTargetJobs().sort((a, b) => {
    let compareResult: number;
    if (sortField === 'title') {
      compareResult = a.title.localeCompare(b.title);
    } else if (sortField === 'created_at') {
      compareResult = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    } else if (sortField === 'work_date') {
      const dateA = a.work_date ? new Date(a.work_date).getTime() : 0;
      const dateB = b.work_date ? new Date(b.work_date).getTime() : 0;
      compareResult = dateA - dateB;
    } else {
      compareResult = 0;
    }
    return sortOrder === 'asc' ? compareResult : -compareResult;
  });

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Field Note</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="text-gray-600 hover:text-blue-600">
             <User className="w-4 h-4 mr-2" />
             내 정보
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500 hover:text-red-600">
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </header>

      <div className="flex-1 flex max-w-[1600px] mx-auto w-full overflow-hidden">
        <aside className="w-72 bg-white border-r flex flex-col p-6 sticky top-[73px] h-[calc(100vh-73px)] shrink-0 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
              <FolderIcon className="w-5 h-5 text-blue-600" />
              현장별 폴더
            </h2>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => setIsAddingSite(true)}>
              <FolderPlus className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-2">
            <Button
              variant={selectedSiteId === null ? "default" : "ghost"}
              className={cn(
                "w-full justify-start text-lg font-bold h-12 rounded-xl",
                selectedSiteId === null ? "bg-blue-600 shadow-md text-white" : "text-gray-600"
              )}
              onClick={() => setSelectedSiteId(null)}
            >
              전체 보기
            </Button>

            <Button
              variant={selectedSiteId === 'unclassified' ? "default" : "ghost"}
              className={cn(
                "w-full justify-start text-lg font-bold h-12 rounded-xl",
                selectedSiteId === 'unclassified' ? "bg-blue-600 shadow-md text-white" : "text-gray-600"
              )}
              onClick={() => setSelectedSiteId('unclassified')}
            >
              <span className="truncate">미분류 작업</span>
              <span className="ml-auto text-xs opacity-60 font-medium">
                {jobs.filter(job => !job.site_id || !sites.some(s => s.id === job.site_id)).length}
              </span>
            </Button>

            <div className="my-2 border-t border-gray-100"></div>

            {sites.map((site) => (
              <div key={site.id} className="group relative">
                <Button
                  variant={selectedSiteId === site.id ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start text-lg font-bold h-12 rounded-xl pr-10",
                    selectedSiteId === site.id ? "bg-blue-600 shadow-md text-white" : "text-gray-600"
                  )}
                  onClick={() => setSelectedSiteId(site.id)}
                >
                  <span className="truncate">{site.name}</span>
                  {/* We can show count from sites data if reliable, or filter jobs */}
                  <span className="ml-auto text-xs opacity-60 font-medium">
                    {site.jobs ? site.jobs.length : jobs.filter(j => j.site_id === site.id).length}
                  </span>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleUpdateSite(site.id, site.name)}>이름 수정</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteSite(site.id)}>삭제</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}

            {isAddingSite && (
              <div className="pt-2 space-y-2">
                <Input
                  autoFocus
                  placeholder="현장명 입력"
                  className="h-10"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSite()}
                />
                <div className="flex gap-2">
                  <Button className="flex-1 h-9 bg-blue-600 text-white" onClick={handleAddSite}>추가</Button>
                  <Button variant="outline" className="flex-1 h-9" onClick={() => setIsAddingSite(false)}>취소</Button>
                </div>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto">
          <section className="bg-white rounded-2xl p-8 shadow-sm border-2 border-blue-50 flex flex-col items-center text-center mb-10">
            <h2 className="text-2xl font-black text-gray-800 mb-2">새로운 작업 시작하기</h2>
            <p className="text-gray-500 mb-6 font-medium">현장 사진을 올리고 보고서를 바로 만드세요.</p>
            <Button 
              onClick={handleCreateJob} 
              size="lg" 
              className="w-full md:w-auto text-xl h-16 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl transition-all active:scale-95" 
              disabled={creating}
            >
              {creating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-6 h-6 mr-2 font-black" />}
              작업 사진 올리기
            </Button>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                {selectedSiteId === null ? "전체 목록" : selectedSiteId === 'unclassified' ? "미분류 작업" : sites.find(s => s.id === selectedSiteId)?.name}
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {filteredJobs.length}건
                </span>
              </h2>
              <div className="flex gap-2">
                <Select value={sortField} onValueChange={(val: any) => setSortField(val)}>
                  <SelectTrigger className="w-[110px] h-9 text-sm">
                    <SelectValue placeholder="정렬 기준" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">등록순</SelectItem>
                    <SelectItem value="work_date">작업일자순</SelectItem>
                    <SelectItem value="title">이름순</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={(val: any) => setSortOrder(val)}>
                  <SelectTrigger className="w-[110px] h-9 text-sm">
                    <SelectValue placeholder="정렬 순서" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">오름차순</SelectItem>
                    <SelectItem value="desc">내림차순</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-500 font-bold text-lg">이 폴더에는 아직 작업이 없습니다.</p>
                <p className="text-gray-400 text-sm mt-1">작업을 이곳으로 옮기거나 새로운 작업을 만들어보세요.</p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="group bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between"
                  >
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                          {job.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-2">
                         <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            <span>{job.company_name || '시행처 미입력'}</span>
                         </div>
                         <div className="flex items-center gap-1">
                            <Hammer className="w-4 h-4" />
                            <span>{job.construction_type || '공종명 미입력'}</span>
                         </div>
                         <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{job.work_date ? format(new Date(job.work_date), 'yyyy.MM.dd') : '작업일 미입력'}</span>
                         </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                       <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                          job.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          job.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                          job.status === 'CREATED' ? 'bg-gray-100 text-gray-700' :
                          job.status === 'UPLOADING' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-50 text-orange-600'
                        }`}>
                          {job.status === 'COMPLETED' ? '완료' : job.status === 'FAILED' ? '실패' : job.status === 'UPLOADING' ? '대기' : job.status === 'CREATED' ? '빈 작업' : '작업중'}
                        </span>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full">
                            <MoreVertical className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={(e) => handleEditClick(e, job)}>
                            <Pencil className="w-4 h-4 mr-2" /> 수정
                          </DropdownMenuItem>
                          {job.export_status === 'EXPORTED' && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(job.id); }}>
                              <FileDown className="w-4 h-4 mr-2" /> PDF 다운로드
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenu>
                            <DropdownMenuTrigger className="flex w-full items-center px-2 py-1.5 text-sm outline-none hover:bg-slate-100">
                              <MoveRight className="w-4 h-4 mr-2" /> 현장으로 이동
                              <ChevronRight className="ml-auto w-4 h-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="left" className="w-48">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMoveJob(job.id, null); }}>
                                (미분류)
                              </DropdownMenuItem>
                              {sites.map(s => (
                                <DropdownMenuItem key={s.id} onClick={(e) => { e.stopPropagation(); handleMoveJob(job.id, s.id); }}>
                                  {s.name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600"
                            onClick={(e) => { e.stopPropagation(); setDeleteJobId(job.id); }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> 삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      <Dialog open={createJobDialogOpen} onOpenChange={setCreateJobDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 작업 만들기</DialogTitle>
            <DialogDescription>새로운 작업의 기본 정보를 입력해주세요.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create-title" className="text-right">작업명</Label>
              <Input id="create-title" value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} className="col-span-3" />
            </div>
            {/* ... (기타 입력 필드 동일) */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateJobDialogOpen(false)}>취소</Button>
            <Button type="submit" onClick={handleConfirmCreateJob} disabled={creating} className="bg-blue-600 text-white">생성</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingJob} onOpenChange={(open) => !open && setEditingJob(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>작업 수정</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">작업명</Label>
              <Input id="title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="col-span-3" />
            </div>
          </div>
          <DialogFooter><Button type="submit" onClick={handleUpdateJob} className="bg-blue-600 text-white">저장</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteJobId} onOpenChange={(open) => !open && setDeleteJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>이 작업은 되돌릴 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteJobId(null)}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteJobId) handleDeleteJob(deleteJobId); setDeleteJobId(null); }} className="bg-red-600 text-white hover:bg-red-700">삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}