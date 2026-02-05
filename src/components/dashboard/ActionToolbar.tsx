import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LayoutGrid, ArrowLeft, Pencil, RefreshCw, Edit2, FileDown, FileText, Loader2 } from 'lucide-react';
import { Job, Cluster } from '@/types';
import { cn } from '@/lib/utils';

interface ActionToolbarProps {
  job: Job;
  clusters: Cluster[];
  isClustering: boolean;
  exporting: boolean;
  onEditJob: () => void;
  onStartClustering: () => void;
  onEditLabels: () => void;
  onDownloadPDF: () => void;
  onExport: () => void;
}

export function ActionToolbar({
  job,
  clusters,
  isClustering,
  exporting,
  onEditJob,
  onStartClustering,
  onEditLabels,
  onDownloadPDF,
  onExport,
}: ActionToolbarProps) {
  const navigate = useNavigate();

  const incompletePlaces = clusters.filter(c => c.name !== 'reserve' && c.photos.length < 3).length;
  const completePlaces = clusters.filter(c => c.name !== 'reserve' && c.photos.length === 3).length;
  const excessPlaces = clusters.filter(c => c.name !== 'reserve' && c.photos.length > 3).length;

  return (
    <header className="bg-white/90 border-b border-slate-200/60 px-4 py-3 md:px-8 md:py-4 flex items-center justify-between flex-shrink-0 z-30 backdrop-blur-xl sticky top-0 shadow-sm">
      <div className="flex items-center gap-3 md:gap-5">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full hover:bg-slate-100">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Button>
        <div className="p-2 bg-primary rounded-xl shadow-emphasis shadow-primary/20 hidden md:block">
          <LayoutGrid className="w-5 h-5 text-primary-foreground" />
        </div>
        <div 
          className="group flex flex-col cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-all"
          onClick={onEditJob}
        >
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tighter truncate max-w-[150px] md:max-w-none">
              {job.title}
            </h1>
            <Pencil className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-0.5">Workspace</span>
        </div>
      </div>
      {clusters.length > 0 && (
        <div className="flex items-center gap-2 md:gap-3 flex-1 justify-end">
          
          {/* Stats Chips */}
          <div className="hidden xl:flex items-center gap-1.5 mr-6 bg-slate-50 p-1 rounded-2xl border border-slate-100 shadow-inner">
            <div className="bg-white text-orange-600 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">미완</span>
                <span className="text-base font-black leading-none">{incompletePlaces}</span>
            </div>
            <div className="bg-white text-emerald-600 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">완성</span>
                <span className="text-base font-black leading-none">{completePlaces}</span>
            </div>
            {excessPlaces > 0 && (
                <div className="bg-white text-rose-600 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">초과</span>
                    <span className="text-base font-black leading-none">{excessPlaces}</span>
                </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Re-cluster Button */}
            <Button 
                variant="ghost" 
                className="h-10 px-4 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-xl gap-2 font-bold transition-all"
                onClick={onStartClustering}
                disabled={isClustering}
            >
                <RefreshCw className={`w-4 h-4 ${isClustering ? 'animate-spin' : ''}`} />
                <span className="hidden lg:inline">재분류</span>
            </Button>

            <div className="w-px h-4 bg-slate-200 mx-1 hidden lg:block" />

            {/* Edit Labels Link */}
            <Button 
                variant="ghost" 
                className="h-10 px-4 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-xl gap-2 font-bold transition-all hidden md:flex"
                onClick={onEditLabels}
            >
                <Edit2 className="w-4 h-4" />
                <span className="hidden lg:inline">라벨 관리</span>
            </Button>
          </div>

          {/* PDF Actions */}
          <div className="flex items-center gap-2 ml-2">
            {/* If exported, allow download directly */}
            {job.export_status === 'EXPORTED' && (
              <Button 
                className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-100 font-black transition-all active:scale-95"
                onClick={onDownloadPDF}
              >
                <FileDown className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">PDF 받기</span>
              </Button>
            )}
            
            {/* Preview / Generate Button */}
            <Button 
              variant={job.export_status === 'EXPORTED' ? 'outline' : 'default'}
              className={cn(
                "h-10 px-6 rounded-xl font-black transition-all active:scale-95",
                job.export_status === 'EXPORTED' 
                    ? "border-2 border-primary text-primary hover:bg-primary/5" 
                    : "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
              )}
              onClick={onExport} 
              disabled={exporting || clusters.length === 0}
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : (job.export_status === 'EXPORTED' ? <FileText className="w-4 h-4 md:mr-2" /> : <FileDown className="w-4 h-4 md:mr-2" />)}
              <span className="hidden md:inline">{job.export_status === 'EXPORTED' ? '보고서 미리보기' : 'PDF 리포트 생성'}</span>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
