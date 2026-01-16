import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { AuthService } from '@/lib/auth';
import { Job } from '@/types';
import { Plus, Loader2, LayoutGrid, Calendar, X, LogOut, FileDown, Pencil, Building2, Hammer, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
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


export default function JobList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sortField, setSortField] = useState<'title' | 'created_at' | 'work_date'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Edit State
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    work_date: '',
    company_name: '',
    construction_type: ''
  });

  const handleEditClick = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation(); // Prevent navigation
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
      loadJobs();
    } catch (error) {
      toast.error('Failed to update job');
    }
  };

  const sortedJobs = [...jobs].sort((a, b) => {
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
      compareResult = 0; // Should not happen
    }
    
    return sortOrder === 'asc' ? compareResult : -compareResult;
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const data = await api.getJobs();
      setJobs(data);
    } catch (error) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    setCreating(true);
    const title = `작업 ${jobs.length + 1}`;
    try {
      const job = await api.createJob(title, '', '');
      toast.success('Job created successfully');
      navigate(`/jobs/${job.id}`);
    } catch (error) {
      toast.error('Failed to create job');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await api.deleteJob(jobId);
      toast.success('Job deleted successfully');
    } catch (error) {
      toast.error('Failed to delete job');
    } finally {
      loadJobs();
    }
  };

  const handleDownload = async (jobId: string) => {
    try {
      const response = await api.getDownloadUrl(jobId);
      if (response.path) {
        const link = document.createElement('a');
        link.href = response.path;
        link.setAttribute('download', response.filename || 'download');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      toast.error('Failed to download pdf');
    }
  }

  const handleLogout = async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      toast.error('Failed to get pdf');
    } finally {
      navigate('/login');
    }
  };

  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Field Note</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500 hover:text-red-600">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Create Job Section */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">새로운 작업 시작하기</h2>
          <p className="text-gray-500 mb-6">현장 사진을 업로드하고 간편하게 보고서를 만드세요.</p>
          
          <Button 
            onClick={handleCreateJob} 
            size="lg" 
            className="w-full md:w-auto text-lg h-14 px-8 bg-blue-600 hover:bg-blue-700 rounded-xl" 
            disabled={creating}
          >
            {creating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
            작업 사진 올리기
          </Button>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">작업 목록</h2>
            <div className="flex gap-2">
              <Select value={sortField} onValueChange={(val: 'title' | 'created_at' | 'work_date') => setSortField(val)}>
                <SelectTrigger className="w-[110px] h-9 text-sm">
                  <SelectValue placeholder="정렬 기준" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">등록순</SelectItem>
                  <SelectItem value="work_date">작업일자순</SelectItem>
                  <SelectItem value="title">이름순</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(val: 'asc' | 'desc') => setSortOrder(val)}>
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

          {jobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">등록된 작업이 없습니다. 새로운 작업을 등록하고 작업 도우미를 경험하세요.</p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1">
              {sortedJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer overflow-hidden"
                >
                  <div className="p-5 flex flex-col md:flex-row gap-4 justify-between">
                    {/* Left: Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {job.title}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          job.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          job.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {job.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-2 gap-x-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Hammer className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-500">공종:</span>
                          <span className="font-medium text-gray-900">{job.construction_type || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-500">시행처:</span>
                          <span className="font-medium text-gray-900">{job.company_name || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-500">작업일:</span>
                          <span className="font-medium text-gray-900">
                            {job.work_date ? format(new Date(job.work_date), 'yyyy.MM.dd') : '-'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-500">등록일:</span>
                          <span className="font-medium text-gray-900">
                            {job.created_at ? format(new Date(job.created_at), 'yy.MM.dd') : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center justify-end gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                      {job.export_status === 'EXPORTED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(job.id);
                          }}
                        >
                          <FileDown className="w-4 h-4 mr-2" />
                          다운로드
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        onClick={(e) => handleEditClick(e, job)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteJobId(job.id);
                        }}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Edit Job Dialog */}
      <Dialog open={!!editingJob} onOpenChange={(open) => !open && setEditingJob(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>작업 수정</DialogTitle>
            <DialogDescription>
              작업 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                작업명
              </Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="work_date" className="text-right">
                작업일자
              </Label>
              <Input
                id="work_date"
                type="date"
                value={editForm.work_date}
                onChange={(e) => setEditForm({ ...editForm, work_date: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company_name" className="text-right">
                시행처
              </Label>
              <Input
                id="company_name"
                value={editForm.company_name}
                onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="construction_type" className="text-right">
                공종명
              </Label>
              <Input
                id="construction_type"
                value={editForm.construction_type}
                onChange={(e) => setEditForm({ ...editForm, construction_type: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleUpdateJob}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteJobId} onOpenChange={(open) => !open && setDeleteJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 관련된 모든 데이터가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteJobId(null)}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteJobId) handleDeleteJob(deleteJobId);
                setDeleteJobId(null);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}