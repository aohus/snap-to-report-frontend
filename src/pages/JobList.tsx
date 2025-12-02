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
  const [newJobTitle, setNewJobTitle] = useState('');

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
      const job = await api.createJob(newJobTitle);
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
      await api.getDownloadUrl(jobId);
    } catch (error) {
      toast.error('Failed to get pdf');
    } finally {
      loadJobs();
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
          <h1 className="text-xl font-bold text-gray-900">Photo Organizer</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500 hover:text-red-600">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Create Job Section */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">작업 등록하기</h2>
          {/* <p className="text-gray-500 mb-6">새로운 작업을 등록하고 사진을 업로드 하세요.</p> */}
          <form onSubmit={handleCreateJob} className="flex gap-4 max-w-xl">
            <Input 
              placeholder="작업 이름을 입력하세요. (예: 광교호수공원 제초)" 
              value={newJobTitle}
              onChange={(e) => setNewJobTitle(e.target.value)}
              className="h-12 text-2xl"
            />
            <Button type="submit" size="lg" className="text-lg h-12 px-8 bg-blue-600 hover:bg-blue-700" disabled={creating || !newJobTitle.trim()}>
              {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 mr-2" />}
              등록
            </Button>
          </form>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">작업 목록</h2>
          
          {jobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">등록된 작업이 없습니다. 새로운 작업을 등록하고 작업 도우미를 경험하세요.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              {jobs.map((job) => (
                <div 
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="group bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col"
                >
                  <div className="flex items-start justify-between">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 border-2 border-red-600 transition-opacity shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent drag start and selection
                        handleDeleteJob(job.id);
                      }}
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </Button>
                    <div flex items-start>
                      <h3 className="p-2 text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </h3>
                      <span className={`px-2 py-1 gap-4 rounded-full text-sm font-medium ${
                        job.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    <div>
                      {job.export_status === 'FAILED' ? (
                        <Button 
                          variant="default" 
                          size="lg" 
                          className="text-lg bg-red-600 hover:bg-red-700 shadow-md"
                          disabled={true}
                        >
                          PDF 생성 실패
                        </Button>
                      ) : (
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="text-lg border-indigo-600 hover:bg-indigo-200 shadow-md"
                        onClick={handleDownload}
                        disabled={job.export_status !== 'EXPORTED'}
                      >
                        {/* <FileDown className="w-5 h-5 mr-2" /> */}
                        PDF 다운로드
                      </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center text-gray-500 text-sm mt-auto pt-4">
                    <Calendar className="w-4 h-4 mr-2" />
                    {job.created_at ? format(new Date(job.created_at), 'MMM d, yyyy') : 'Unknown date'}
                    <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all text-blue-600" />
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