import { ClusterBoard } from '@/components/ClusterBoard';
import { Cluster, Photo } from '@/types';
import { SelectedPhoto } from '@/hooks/useMultiSelection';

interface ClusterSectionProps {
  clusters: Cluster[];
  isClustering: boolean;
  selectedPhotos: { id: string; clusterId: string }[];
  onMovePhoto: (photoId: string, sourceClusterId: string, targetClusterId: string, newIndex: number) => void;
  onCreateCluster: (orderIndex: number, photosToMoveParam?: { id: string; clusterId: string }[]) => void;
  onDeleteCluster: (clusterId: string) => void;
  onMoveCluster: (clusterId: string, direction: 'up' | 'down') => void;
  onAddPhotosToExistingCluster: (targetClusterId: string, photosToMoveParam: { id: string; clusterId: string }[]) => void;
  onRenameCluster: (clusterId: string, newName: string) => void;
  onDeletePhoto: (photoId: string, clusterId: string) => void;
  onSelectPhoto: (photoId: string, clusterId: string, e?: React.MouseEvent) => void;
  onSetSelectedPhotos?: (photos: SelectedPhoto[]) => void;
  onPreviewPhoto?: (photo: Photo) => void;
  onEditLabels: (photoId: string) => void;
}

export function ClusterSection({
  clusters,
  isClustering,
  selectedPhotos,
  onMovePhoto,
  onCreateCluster,
  onDeleteCluster,
  onMoveCluster,
  onAddPhotosToExistingCluster,
  onRenameCluster,
  onDeletePhoto,
  onSelectPhoto,
  onSetSelectedPhotos,
  onPreviewPhoto,
  onEditLabels,
}: ClusterSectionProps) {
  return (
    <div
      className={`flex-1 overflow-hidden transition duration-200 ${
        isClustering ? "opacity-40 pointer-events-none" : ""
      }`}
      aria-disabled={isClustering}
    >
      <ClusterBoard
        clusters={clusters}
        onMovePhoto={onMovePhoto}
        onCreateCluster={onCreateCluster}
        onDeleteCluster={onDeleteCluster}
        onMoveCluster={onMoveCluster}
        onAddPhotosToExistingCluster={onAddPhotosToExistingCluster}
        onRenameCluster={onRenameCluster}
        onDeletePhoto={onDeletePhoto}
        selectedPhotos={selectedPhotos}
        onSelectPhoto={onSelectPhoto}
        onSetSelectedPhotos={onSetSelectedPhotos}
        onPreviewPhoto={onPreviewPhoto}
        onEditLabels={onEditLabels}
      />
    </div>
  );
}
