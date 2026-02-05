import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { AuthService } from '@/lib/auth';
import { Job, Site } from '@/types';
import { 
  Plus, Loader2, LayoutGrid, LogOut, 
  User, Folder as FolderIcon, FolderPlus, MoreHorizontal, 
} from 'lucide-react';
import { toast } from 'sonner';
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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { JobTable } from '@/components/dashboard/JobTable';

export default function Dashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

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

  const handleEditClick = (job: Job) => {
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
        setCreateJobDialogOpen(false);
        setCreating(false);
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
      if (job.site_id === targetSiteId || (job.site_id === null && targetSiteId === null)) return;

      if (targetSiteId) {
        await api.addJobsToSite(targetSiteId, [jobId]);
      } else {
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
    if (selectedSiteId === null) return jobs;
    if (selectedSiteId === 'unclassified') {
      return jobs.filter(job => !job.site_id || !sites.some(s => s.id === job.site_id));
    }
    const site = sites.find(s => s.id === selectedSiteId);
    return site?.jobs || [];
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-primary/10 selection:text-primary">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/80">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-xl shadow-md">
            <LayoutGrid className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Field Note</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="text-slate-600 hover:text-primary font-bold rounded-xl h-10 px-4">
             <User className="w-4 h-4 mr-2" />
             내 정보
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-red-600 font-bold rounded-xl h-10 px-4">
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </header>

      <div className="flex-1 flex max-w-[1600px] mx-auto w-full">
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col p-6 sticky top-[73px] h-[calc(100vh-73px)] shrink-0">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              현장 목록
            </h2>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg" onClick={() => setIsAddingSite(true)}>
              <FolderPlus className="w-5 h-5" />
            </Button>
          </div>

          <nav className="space-y-1 overflow-y-auto pr-2 custom-scrollbar flex-1">
            <Button
              variant={selectedSiteId === null ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start text-base font-bold h-12 rounded-xl px-4 transition-all mb-1",
                selectedSiteId === null 
                  ? "bg-primary text-primary-foreground hover:bg-primary shadow-md shadow-primary/20" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
              onClick={() => setSelectedSiteId(null)}
            >
              <LayoutGrid className="w-5 h-5 mr-3 opacity-70" />
              전체 보기
            </Button>

            <Button
              variant={selectedSiteId === 'unclassified' ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start text-base font-bold h-12 rounded-xl px-4 transition-all mb-4",
                selectedSiteId === 'unclassified' 
                  ? "bg-primary text-primary-foreground hover:bg-primary shadow-md shadow-primary/20" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
              onClick={() => setSelectedSiteId('unclassified')}
            >
              <FolderIcon className="w-5 h-5 mr-3 opacity-70" />
              <span className="truncate flex-1 text-left">미분류 작업</span>
              <span className={cn(
                "ml-auto text-xs px-2 py-0.5 rounded-md font-black min-w-[24px] text-center",
                selectedSiteId === 'unclassified' 
                  ? "bg-white/20 text-white" 
                  : "bg-slate-100 text-slate-500"
              )}>
                {jobs.filter(job => !job.site_id || !sites.some(s => s.id === job.site_id)).length}
              </span>
            </Button>

            <div className="px-2 mb-2 mt-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Folders</span>
            </div>

            {sites.map((site) => (
              <div key={site.id} className="group relative">
                <Button
                  variant={selectedSiteId === site.id ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-base font-medium h-11 rounded-xl px-4 transition-all pr-10",
                    selectedSiteId === site.id 
                      ? "bg-slate-100 text-slate-900 font-bold" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                  onClick={() => setSelectedSiteId(site.id)}
                >
                  <FolderIcon className={cn(
                    "w-5 h-5 mr-3 transition-colors", 
                    selectedSiteId === site.id ? "text-primary fill-primary/20" : "text-slate-400"
                  )} />
                  <span className="truncate flex-1 text-left">{site.name}</span>
                  <span className={cn(
                    "ml-auto text-xs px-2 py-0.5 rounded-md min-w-[24px] text-center transition-colors",
                    selectedSiteId === site.id 
                      ? "bg-white text-slate-900 shadow-sm" 
                      : "text-slate-400 group-hover:text-slate-600"
                  )}>
                    {site.jobs ? site.jobs.length : jobs.filter(j => j.site_id === site.id).length}
                  </span>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-slate-400 hover:text-slate-600">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl shadow-emphasis">
                    <DropdownMenuItem onClick={() => handleUpdateSite(site.id, site.name)} className="font-bold">이름 수정</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600 font-bold" onClick={() => handleDeleteSite(site.id)}>삭제</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}

            {isAddingSite && (
              <div className="pt-2 space-y-2 px-1">
                <Input
                  autoFocus
                  placeholder="새 현장 이름"
                  className="h-11 rounded-xl border-primary ring-2 ring-primary/20"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSite()}
                />
                <div className="flex gap-2">
                  <Button className="flex-1 h-9 rounded-lg font-bold" onClick={handleAddSite}>확인</Button>
                  <Button variant="ghost" className="flex-1 h-9 rounded-lg font-bold text-slate-500" onClick={() => setIsAddingSite(false)}>취소</Button>
                </div>
              </div>
            )}
          </nav>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">대시보드</h2>
              <p className="text-slate-500 font-medium mt-1">프로젝트 현황을 한눈에 확인하세요.</p>
            </div>
            <Button 
              onClick={handleCreateJob} 
              size="lg" 
              className="text-lg h-12 px-6 font-black rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95" 
              disabled={creating}
            >
              {creating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2 stroke-[3]" />}
              새 작업 추가
            </Button>
          </div>

          <DashboardStats jobs={jobs} sites={sites} />

          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {selectedSiteId === null ? "전체 작업" : selectedSiteId === 'unclassified' ? "미분류 작업" : sites.find(s => s.id === selectedSiteId)?.name}
              </h2>
              <Badge className="bg-primary text-primary-foreground hover:bg-primary border-none font-black px-3 py-1 text-sm rounded-full">
                {getTargetJobs().length}
              </Badge>
            </div>

            <JobTable 
              jobs={getTargetJobs()}
              sites={sites}
              onNavigate={(id) => navigate(`/jobs/${id}`)}
              onEdit={handleEditClick}
              onDelete={setDeleteJobId}
              onDownload={handleDownload}
              onMove={handleMoveJob}
            />
          </div>
        </main>
      </div>

      <Dialog open={createJobDialogOpen} onOpenChange={setCreateJobDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">새 작업 만들기</DialogTitle>
            <DialogDescription className="font-medium text-slate-500 text-base">새로운 작업의 기본 정보를 입력해주세요.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="create-title" className="text-sm font-bold text-slate-700 ml-1">작업명</Label>
              <Input id="create-title" placeholder="예: 거실 천장 도배 공사" value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} className="h-12 rounded-xl border-slate-200" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-date" className="text-sm font-bold text-slate-700 ml-1">작업일자</Label>
                <Input id="create-date" type="date" value={createForm.work_date} onChange={(e) => setCreateForm({ ...createForm, work_date: e.target.value })} className="h-12 rounded-xl border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-type" className="text-sm font-bold text-slate-700 ml-1">공종명</Label>
                <Input id="create-type" placeholder="예: 목공사" value={createForm.construction_type} onChange={(e) => setCreateForm({ ...createForm, construction_type: e.target.value })} className="h-12 rounded-xl border-slate-200" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-company" className="text-sm font-bold text-slate-700 ml-1">시행처</Label>
              <Input id="create-company" placeholder="예: (주)필드노트" value={createForm.company_name} onChange={(e) => setCreateForm({ ...createForm, company_name: e.target.value })} className="h-12 rounded-xl border-slate-200" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateJobDialogOpen(false)} className="h-12 rounded-xl font-bold flex-1">취소</Button>
            <Button type="submit" onClick={handleConfirmCreateJob} disabled={creating} className="h-12 rounded-xl font-black flex-1 shadow-lg shadow-primary/20">
              {creating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "작업 생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingJob} onOpenChange={(open) => !open && setEditingJob(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="text-2xl font-black">작업 정보 수정</DialogTitle></DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-sm font-bold text-slate-700 ml-1">작업명</Label>
              <Input id="edit-title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="h-12 rounded-xl border-slate-200" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date" className="text-sm font-bold text-slate-700 ml-1">작업일자</Label>
                <Input id="edit-date" type="date" value={editForm.work_date} onChange={(e) => setEditForm({ ...editForm, work_date: e.target.value })} className="h-12 rounded-xl border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type" className="text-sm font-bold text-slate-700 ml-1">공종명</Label>
                <Input id="edit-type" value={editForm.construction_type} onChange={(e) => setEditForm({ ...editForm, construction_type: e.target.value })} className="h-12 rounded-xl border-slate-200" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company" className="text-sm font-bold text-slate-700 ml-1">시행처</Label>
              <Input id="edit-company" value={editForm.company_name} onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })} className="h-12 rounded-xl border-slate-200" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingJob(null)} className="h-12 rounded-xl font-bold flex-1">취소</Button>
            <Button type="submit" onClick={handleUpdateJob} className="h-12 rounded-xl font-black flex-1 shadow-lg shadow-primary/20">저장하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteJobId} onOpenChange={(open) => !open && setDeleteJobId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-slate-500 text-base">
              이 작업과 포함된 모든 사진 데이터는 영구적으로 삭제되며, 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel onClick={() => setDeleteJobId(null)} className="h-12 rounded-xl font-bold flex-1">취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteJobId) handleDeleteJob(deleteJobId); setDeleteJobId(null); }} className="h-12 rounded-xl font-black flex-1 bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-100">
              삭제하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
