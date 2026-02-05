import { ClusterBoard } from '@/components/ClusterBoard';
import { Cluster, Photo } from '@/types';

interface ClusterSectionProps {
  clusters: Cluster[];
  isClustering: boolean;
  selectedPhotos: { id: string; clusterId: string }[];
  onMovePhoto: (photoId: string, sourceClusterId: string, targetClusterId: string, newIndex: number) => Promise<void>;
  onCreateCluster: (orderIndex: number, photosToMoveParam?: { id: string; clusterId: string }[]) => Promise<void>;
  onDeleteCluster: (clusterId: string) => Promise<void>;
  onMoveCluster: (clusterId: string, direction: 'up' | 'down') => Promise<void>;
  onAddPhotosToExistingCluster: (targetClusterId: string, photosToMoveParam: { id: string; clusterId: string }[]) => Promise<void>;
  onRenameCluster: (clusterId: string, newName: string) => Promise<void>;
  onDeletePhoto: (photoId: string, clusterId: string) => Promise<void>;
  onSelectPhoto: (photoId: string, clusterId: string) => void;
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
        onEditLabels={onEditLabels}
      />
    </div>
  );
}
