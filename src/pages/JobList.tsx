import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { AuthService } from '@/lib/auth';
import { Job } from '@/types';
import { Plus, Loader2, LayoutGrid, Calendar, X, ArrowRight, LogOut, FileDown} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';


export default function JobList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
    // Form State
    const [newJobTitle, setNewJobTitle] = useState('');
    const [newJobConstructionType, setNewJobConstructionType] = useState('');
    const [newCompanyName, setNewCompanyName] = useState('');
  
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
  
    const handleCreateJob = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newJobTitle.trim()) return;
  
      setCreating(true);
      try {
        const job = await api.createJob(newJobTitle, newJobConstructionType, newCompanyName);
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

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Snap To Report</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500 hover:text-red-600">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Create Job Section */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">작업 등록하기</h2>
          
          <form onSubmit={handleCreateJob} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">작업명 (필수)</label>
              <Input 
                placeholder="예: 광교호수공원 제초" 
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                className="h-12 text-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">공종명 (선택)</label>
              <Input 
                placeholder="예: 제초 작업" 
                value={newJobConstructionType}
                onChange={(e) => setNewJobConstructionType(e.target.value)}
                className="h-10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시행처 (선택)</label>
              <Input 
                placeholder="예: 튼튼나무병원" 
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="md:col-span-2 mt-2 flex justify-end">
              <Button type="submit" size="lg" className="w-full md:w-auto text-lg h-12 px-8 bg-blue-600 hover:bg-blue-700" disabled={creating || !newJobTitle.trim()}>
                {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 mr-2" />}
                작업 등록
              </Button>
            </div>
          </form>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">작업 목록</h2>
          
          {jobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">등록된 작업이 없습니다. 새로운 작업을 등록하고 작업 도우미를 경험하세요.</p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1">
              {jobs.map((job) => (
                <div 
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="group bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex items-center justify-between"
                >
                  {/* Left: Title, Status, Date */}
                  <div className="flex flex-col gap-1">
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
                    <div className="flex items-center text-gray-400 text-xs flex-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        {job.created_at ? format(new Date(job.created_at), 'yyyy-MM-dd HH:mm') : '-'}
                        <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all text-blue-600" />
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-3">
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
                        PDF 다운로드
                      </Button>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('정말 삭제하시겠습니까?')) {
                          handleDeleteJob(job.id);
                        }
                      }}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}