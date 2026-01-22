import { useUploadStore } from '@/lib/uploadStore';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useParams } from 'react-router-dom';

export const UploadProgress: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { queue, totalProgress, isUploading, retryFailed } = useUploadStore();

  if (queue.length === 0) return null;

  const completedCount = queue.filter((item) => item.status === 'completed').length;
  const failedCount = queue.filter((item) => item.status === 'failed').length;
  const totalCount = queue.length;

  const handleRetry = async (id: string) => {
    if (!jobId) return;
    retryFailed(id);
    // Note: In a real app, you might want a specialized retry function in api.ts
    // For now, we trigger the main upload logic which picks up 'pending' items
    await api.uploadPhotos(jobId, []); 
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border-2 border-blue-100 rounded-xl shadow-2xl p-5 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black text-gray-900">
          {isUploading ? (
            <span className="flex items-center gap-2 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              사진 전송 중...
            </span>
          ) : failedCount > 0 ? (
            <span className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="w-5 h-5" />
              일부 실패했어요
            </span>
          ) : completedCount === totalCount ? (
            <span className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              전송 완료!
            </span>
          ) : (
            "대기 중"
          )}
        </h3>
        <span className="text-sm font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">
          {completedCount} / {totalCount}
        </span>
      </div>

      <Progress value={totalProgress} className="h-4 mb-4 bg-gray-100" />

      <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {queue.map((item) => (
          <div key={item.id} className={cn(
            "flex items-center justify-between p-2 rounded-lg border text-sm transition-colors",
            item.status === 'failed' ? "bg-red-50 border-red-100" : "bg-white border-gray-50"
          )}>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="truncate font-medium text-gray-700">{item.fileName}</span>
              {item.status === 'failed' && (
                <span className="text-[10px] text-red-500 truncate">{item.error || '연결 오류'}</span>
              )}
            </div>
            
            <div className="flex items-center gap-2 shrink-0 ml-3">
              {item.status === 'compressing' && (
                <span className="text-[11px] text-blue-500 font-bold animate-pulse">압축 중</span>
              )}
              {item.status === 'uploading' && (
                <span className="text-[11px] text-blue-500 font-black">{item.progress}%</span>
              )}
              {item.status === 'completed' && (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
              {item.status === 'failed' && (
                <button 
                  onClick={() => handleRetry(item.id)}
                  className="p-1.5 bg-white border border-red-200 rounded-full text-red-500 hover:bg-red-50 transition-colors"
                  title="다시 시도"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isUploading && (
        <button
          onClick={() => useUploadStore.getState().clearQueue()}
          className="w-full mt-5 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-black text-lg transition-all shadow-lg active:scale-95"
        >
          확인
        </button>
      )}
    </div>
  );
};
