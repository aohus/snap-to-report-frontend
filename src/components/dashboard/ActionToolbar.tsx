import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LayoutGrid, ArrowLeft, Pencil, RefreshCw, Edit2, FileDown, FileText, Loader2 } from 'lucide-react';
import { Job, Cluster } from '@/types';

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
    <header className="bg-white border-b shadow-sm px-4 py-3 md:px-6 md:py-4 flex items-center justify-between flex-shrink-0 z-30">
      <div className="flex items-center gap-3 md:gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Button>
        <div className="p-2 bg-primary rounded-lg shadow-md hidden md:block">
          <LayoutGrid className="w-6 h-6 text-primary-foreground" />
        </div>
        <div 
          className="group flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded-md transition-colors"
          onClick={onEditJob}
        >
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900 tracking-tight truncate max-w-[150px] md:max-w-none flex items-center gap-2">
              {job.title}
              <Pencil className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h1>
          </div>
        </div>
      </div>
      {clusters.length > 0 && (
        <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end">
          
          {/* Stats */}
          <div className="hidden xl:flex items-center gap-2 mr-4">
            <div className="bg-orange-50 border border-orange-100 text-orange-700 px-3 py-1 rounded-md flex flex-col items-center min-w-[60px] shadow-sm">
                <span className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider">미완성</span>
                <span className="text-lg font-black leading-none">{incompletePlaces}</span>
            </div>
            <div className="bg-green-50 border border-green-100 text-green-700 px-3 py-1 rounded-md flex flex-col items-center min-w-[60px] shadow-sm">
                <span className="text-[10px] font-semibold text-green-500 uppercase tracking-wider">완성</span>
                <span className="text-lg font-black leading-none">{completePlaces}</span>
            </div>
            {excessPlaces > 0 && (
                <div className="bg-red-50 border border-red-100 text-red-700 px-3 py-1 rounded-md flex flex-col items-center min-w-[60px] shadow-sm">
                    <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wider">초과</span>
                    <span className="text-lg font-black leading-none">{excessPlaces}</span>
                </div>
            )}
          </div>

          {/* Re-cluster Button */}
          <Button 
            variant="outline" 
            className="h-10 px-3 text-primary border-slate-200 hover:bg-slate-50 gap-2"
            onClick={onStartClustering}
            disabled={isClustering}
            title="사진 분류 다시하기"
          >
            <RefreshCw className={`w-4 h-4 ${isClustering ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">재분류</span>
          </Button>

          {/* Edit Labels Link */}
          <Button 
            variant="outline" 
            className="h-10 hidden md:flex"
            onClick={onEditLabels}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            라벨 수정
          </Button>

          {/* PDF Actions */}
          <div className="flex items-center gap-2">
            {/* If exported, allow download directly */}
            {job.export_status === 'EXPORTED' && (
              <Button 
                className="h-10 bg-green-600 hover:bg-green-700 text-white"
                onClick={onDownloadPDF}
              >
                <FileDown className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">다운로드</span>
              </Button>
            )}
            
            {/* Preview / Generate Button */}
            <Button 
              variant={job.export_status === 'EXPORTED' ? 'outline' : 'default'}
              className={`h-10 px-4 ${job.export_status !== 'EXPORTED' ? 'bg-primary hover:bg-primary/90' : ''}`}
              onClick={onExport} 
              disabled={exporting || clusters.length === 0}
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : (job.export_status === 'EXPORTED' ? <FileText className="w-4 h-4 md:mr-2" /> : <FileDown className="w-4 h-4 md:mr-2" />)}
              <span className="hidden md:inline">{job.export_status === 'EXPORTED' ? '미리보기' : 'PDF 생성'}</span>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
