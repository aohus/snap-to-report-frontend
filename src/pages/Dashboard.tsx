import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { AuthService } from '@/lib/auth';
import { Job, Site } from '@/types';
import { 
  Plus, Loader2, LayoutGrid, LogOut, 
  User, Folder as FolderIcon, FolderPlus, MoreHorizontal, Menu
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-2 px-2 pt-4">
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            현장 관리
            </h2>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/5 rounded-md transition-all" onClick={() => setIsAddingSite(true)}>
            <FolderPlus className="w-3.5 h-3.5" />
            </Button>
        </div>

        <nav className="space-y-0.5 overflow-y-auto pr-1 custom-scrollbar flex-1 pb-4">
            <Button
            variant="ghost"
            className={cn(
                "w-full justify-start text-sm font-semibold h-9 rounded-md px-3 transition-all",
                selectedSiteId === null 
                ? "bg-primary text-primary-foreground shadow-subtle hover:bg-primary/95" 
                : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
            )}
            onClick={() => { setSelectedSiteId(null); setMobileMenuOpen(false); }}
            >
            <LayoutGrid className={cn("w-4 h-4 mr-2.5", selectedSiteId === null ? "opacity-100" : "opacity-50")} />
            전체 보기
            </Button>

            <Button
            variant="ghost"
            className={cn(
                "w-full justify-start text-sm font-semibold h-9 rounded-md px-3 transition-all",
                selectedSiteId === 'unclassified' 
                ? "bg-primary text-primary-foreground shadow-subtle hover:bg-primary/95" 
                : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
            )}
            onClick={() => { setSelectedSiteId('unclassified'); setMobileMenuOpen(false); }}
            >
            <FolderIcon className={cn("w-4 h-4 mr-2.5", selectedSiteId === 'unclassified' ? "opacity-100" : "opacity-50")} />
            <span className="truncate flex-1 text-left">미분류</span>
            <Badge variant="secondary" className={cn(
                "ml-auto text-[10px] px-1.5 py-0 rounded-md font-bold",
                selectedSiteId === 'unclassified' 
                ? "bg-white/20 text-white" 
                : "bg-slate-100 text-slate-500"
            )}>
                {jobs.filter(job => !job.site_id || !sites.some(s => s.id === job.site_id)).length}
            </Badge>
            </Button>

            <div className="px-3 mb-1 mt-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">현장별 폴더</span>
            </div>

            {sites.map((site) => (
            <div key={site.id} className="group relative">
                <Button
                variant="ghost"
                className={cn(
                    "w-full justify-start text-sm font-medium h-9 rounded-md px-3 transition-all pr-8",
                    selectedSiteId === site.id 
                    ? "bg-slate-900 text-white shadow-subtle" 
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                )}
                onClick={() => { setSelectedSiteId(site.id); setMobileMenuOpen(false); }}
                >
                <FolderIcon className={cn(
                    "w-4 h-4 mr-2.5 transition-colors", 
                    selectedSiteId === site.id ? "text-white/80" : "text-slate-400"
                )} />
                <span className="truncate flex-1 text-left">{site.name}</span>
                </Button>
                
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute right-1 top-0.5 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity rounded-md text-slate-400 hover:text-slate-600">
                    <MoreHorizontal className="w-4 h-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-md shadow-elevated border-slate-100 p-1 min-w-[120px]">
                    <DropdownMenuItem onClick={() => handleUpdateSite(site.id, site.name)} className="text-xs font-semibold rounded-md cursor-pointer py-1.5">이름 수정</DropdownMenuItem>
                    <DropdownMenuItem className="text-xs text-red-600 font-semibold rounded-md cursor-pointer py-1.5" onClick={() => handleDeleteSite(site.id)}>삭제</DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
            ))}
            
            {isAddingSite && (
                <div className="px-2 mt-2">
                    <Input 
                        autoFocus
                        value={newSiteName}
                        onChange={(e) => setNewSiteName(e.target.value)}
                        onBlur={() => { if(!newSiteName.trim()) setIsAddingSite(false); }}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter') handleAddSite();
                            if(e.key === 'Escape') setIsAddingSite(false);
                        }}
                        placeholder="새 현장 이름"
                        className="h-8 text-sm"
                    />
                </div>
            )}
        </nav>
    </div>
  );

  if (loading) return <div data-testid="loader" className="h-screen flex items-center justify-center bg-surface-2"><Loader2 className="w-12 h-12 animate-spin text-primary/20" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-primary/10 selection:text-primary">
      <header className="bg-white/90 border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-30 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-slate-500">
                    <Menu className="w-6 h-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 pt-10">
                <SidebarContent />
            </SheetContent>
          </Sheet>

          <div className="p-2 bg-primary rounded-xl shadow-emphasis shadow-primary/20 hidden md:block">
            <LayoutGrid className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Field Note</h1>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest hidden md:inline-block">Construction Intelligence</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="text-base text-slate-600 hover:text-primary font-black rounded-xl h-11 px-3 md:px-5 transition-all">
             <User className="w-5 h-5 md:mr-2 opacity-70" />
             <span className="hidden md:inline">내 정보</span>
          </Button>
          <div className="w-px h-5 bg-slate-200 mx-2 hidden md:block" />
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-base text-slate-400 hover:text-red-600 font-black rounded-xl h-11 px-3 md:px-5 transition-all">
            <LogOut className="w-5 h-5 md:mr-2 opacity-70" />
            <span className="hidden md:inline">로그아웃</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex w-full overflow-hidden">
        {/* Desktop Sidebar - Hidden on mobile, visible on md and up */}
        <aside className="hidden md:flex w-64 flex-col shrink-0 border-r border-slate-200 bg-white/50 backdrop-blur-sm sticky top-[73px] h-[calc(100vh-73px)]">
           <SidebarContent />
        </aside>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight leading-tight">대시보드</h2>
                <p className="text-slate-500 font-medium text-sm hidden md:block">현장 데이터를 한눈에 관리하세요.</p>
              </div>
              <Button 
                onClick={handleCreateJob} 
                className="h-10 px-4 md:px-5 font-bold rounded-md shadow-emphasis shadow-primary/10 transition-all text-sm md:text-base" 
                disabled={creating}
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2 stroke-[2.5]" />}
                새 작업
              </Button>
            </div>

            <DashboardStats jobs={jobs} sites={sites} />

            <div className="mt-10">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-lg md:text-xl font-semibold text-slate-900 tracking-tight">
                  {selectedSiteId === null ? "전체 작업" : selectedSiteId === 'unclassified' ? "미분류" : sites.find(s => s.id === selectedSiteId)?.name}
                </h2>
                <Badge variant="outline" className="text-slate-500 font-semibold px-2 py-0.5 text-[11px] rounded-md">
                  {getTargetJobs().length} 건
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
