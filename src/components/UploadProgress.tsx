import { useUploadStore } from '@/lib/uploadStore';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Loader2, AlertCircle, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useParams } from 'react-router-dom';

export const UploadProgress: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { items, itemIds, totalProgress, isUploading, retryFailed } = useUploadStore();

  if (itemIds.length === 0) return null;

  const totalCount = itemIds.length;
  const completedCount = itemIds.filter(id => items[id].status === 'completed').length;
  const failedCount = itemIds.filter(id => items[id].status === 'failed').length;

  const handleRetry = async (id: string) => {
    if (!jobId) return;
    retryFailed(id);
    await api.uploadPhotos(jobId, []); 
  };

  return (
    <div className="fixed bottom-8 right-8 w-[22rem] bg-white/95 border border-slate-200/60 rounded-3xl shadow-elevated p-6 z-50 backdrop-blur-xl animate-in slide-in-from-bottom-10 duration-500 ring-1 ring-black/5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black text-slate-900 tracking-tighter uppercase flex items-center gap-2">
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Processing...
            </>
          ) : failedCount > 0 ? (
            <>
              <AlertCircle className="w-4 h-4 text-rose-500" />
              Failed
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Finished
            </>
          )}
        </h3>
        <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-full tracking-widest shadow-sm">
          {completedCount}/{totalCount}
        </span>
      </div>

      <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-6 shadow-inner ring-1 ring-slate-200/50">
        <div 
            className="absolute top-0 left-0 h-full bg-primary transition-all duration-700 ease-out shadow-[0_0_10px_rgba(16,42,67,0.2)]"
            style={{ width: `${totalProgress}%` }}
        />
      </div>

      <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar -mx-1 px-1">
        {itemIds.map((id) => {
          const item = items[id];
          return (
            <div key={id} className={cn(
              "flex items-center justify-between p-3 rounded-2xl border transition-all text-xs font-bold",
              item.status === 'failed' ? "bg-rose-50/50 border-rose-100 text-rose-700" : "bg-white border-slate-100 text-slate-600 hover:border-primary/20"
            )}>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate tracking-tight">{item.fileName}</span>
                {item.status === 'failed' && (
                  <span className="text-[9px] font-black uppercase opacity-60 mt-0.5">Error occurred</span>
                )}
              </div>
              
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {item.status === 'compressing' && (
                  <span className="text-[9px] font-black text-primary animate-pulse uppercase tracking-wider">Wait</span>
                )}
                {item.status === 'uploading' && (
                  <span className="text-[9px] font-black text-primary tabular-nums tracking-widest">{item.progress}%</span>
                )}
                {item.status === 'completed' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
                {item.status === 'failed' && (
                  <button 
                    onClick={() => handleRetry(id)}
                    className="p-1.5 bg-white border border-rose-200 rounded-full text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                    title="다시 시도"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isUploading && (
        <Button
          onClick={() => useUploadStore.getState().clearQueue()}
          className="w-full mt-6 h-12 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-base transition-all shadow-lg active:scale-95"
        >
          Confirm
        </Button>
      )}
    </div>
  );
};