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
    <header className="bg-white/90 border-b border-slate-200 px-4 py-3 md:px-6 flex items-center justify-between flex-shrink-0 z-40 backdrop-blur-xl sticky top-0 shadow-subtle">
      <div className="flex items-center gap-3 md:gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-md hover:bg-slate-100 h-9 w-9">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Button>
        <div className="p-1.5 bg-primary rounded-md shadow-subtle hidden md:block">
          <LayoutGrid className="w-4 h-4 text-primary-foreground" />
        </div>
        <div 
          className="group flex flex-col cursor-pointer hover:bg-slate-50 p-1 rounded-md transition-all"
          onClick={onEditJob}
        >
          <div className="flex items-center gap-2">
            <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight truncate max-w-[150px] md:max-w-none">
              {job.title}
            </h1>
            <Pencil className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">워크스페이스</span>
        </div>
      </div>
      {clusters.length > 0 && (
        <div className="flex items-center gap-2 md:gap-3 flex-1 justify-end">
          
          {/* Stats Chips */}
          <div className="hidden xl:flex items-center gap-1 mr-4 bg-slate-100/50 p-0.5 rounded-md border border-slate-100">
            <div className="bg-white text-orange-600 px-2.5 py-1 rounded-sm flex items-center gap-2 shadow-subtle border border-orange-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">미완</span>
                <span className="text-sm font-bold leading-none">{incompletePlaces}</span>
            </div>
            <div className="bg-white text-emerald-600 px-2.5 py-1 rounded-sm flex items-center gap-2 shadow-subtle border border-emerald-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">완성</span>
                <span className="text-sm font-bold leading-none">{completePlaces}</span>
            </div>
            {excessPlaces > 0 && (
                <div className="bg-white text-rose-600 px-2.5 py-1 rounded-sm flex items-center gap-2 shadow-subtle border border-rose-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">초과</span>
                    <span className="text-sm font-bold leading-none">{excessPlaces}</span>
                </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Re-cluster Button */}
            <Button 
                variant="ghost" 
                className="h-9 px-3 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-md gap-2 font-semibold transition-all"
                onClick={onStartClustering}
                disabled={isClustering}
            >
                <RefreshCw className={`w-3.5 h-3.5 ${isClustering ? 'animate-spin' : ''}`} />
                <span className="hidden lg:inline text-xs">재분류</span>
            </Button>

            <div className="w-px h-4 bg-slate-200 mx-1 hidden lg:block" />

            {/* Edit Labels Link */}
            <Button 
                variant="ghost" 
                className="h-9 px-3 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-md gap-2 font-semibold transition-all hidden md:flex"
                onClick={onEditLabels}
            >
                <Edit2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-xs">라벨 관리</span>
            </Button>
          </div>

          {/* PDF Actions */}
          <div className="flex items-center gap-2 ml-1">
            {/* If exported, allow download directly */}
            {job.export_status === 'EXPORTED' && (
              <Button 
                className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-subtle font-bold transition-all active:scale-95 text-xs"
                onClick={onDownloadPDF}
              >
                <FileDown className="w-3.5 h-3.5 mr-1.5" />
                <span className="hidden md:inline">PDF 다운로드</span>
              </Button>
            )}
            
            {/* Preview / Generate Button */}
            <Button 
              variant={job.export_status === 'EXPORTED' ? 'outline' : 'default'}
              className={cn(
                "h-9 px-4 rounded-md font-bold transition-all active:scale-95 text-xs",
                job.export_status === 'EXPORTED' 
                    ? "border border-primary text-primary hover:bg-primary/5 shadow-subtle" 
                    : "bg-primary text-primary-foreground shadow-emphasis shadow-primary/10 hover:bg-primary/95"
              )}
              onClick={onExport} 
              disabled={exporting || clusters.length === 0}
            >
              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (job.export_status === 'EXPORTED' ? <FileText className="w-3.5 h-3.5 mr-1.5" /> : <FileDown className="w-3.5 h-3.5 mr-1.5" />)}
              <span className="hidden md:inline">{job.export_status === 'EXPORTED' ? '리포트 미리보기' : 'PDF 리포트 생성'}</span>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
