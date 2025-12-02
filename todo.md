# Photo Clustering Service Frontend Plan

## Requirements
1. Authentication (Login/Signup)
2. Photo Upload (Max 1000 photos)
3. Clustering Dashboard (View, Drag & Drop, Rename)
4. PDF Export

## Tech Stack
- React + Vite + TypeScript
- Shadcn UI + Tailwind CSS
- Drag & Drop: @hello-pangea/dnd
- PDF Generation: jspdf + html2canvas

## File Structure & Tasks

### 1. Setup & Dependencies
- [ ] Install dependencies: `pnpm add @hello-pangea/dnd jspdf html2canvas lucide-react`
- [ ] Create `src/lib/api.ts`: Mock API or Real API client based on docs.
- [ ] Create `src/types/index.ts`: Define interfaces (User, Photo, Cluster).

### 2. Authentication
- [ ] `src/pages/Login.tsx`: Login form.
- [ ] `src/pages/Signup.tsx`: Signup form.

### 3. Main Application
- [ ] `src/pages/Dashboard.tsx`: Main container.
- [ ] `src/components/PhotoUploader.tsx`: File input, progress bar.
- [ ] `src/components/ClusterBoard.tsx`: Drag and drop context, list of places.
- [ ] `src/components/PlaceColumn.tsx`: Individual place column with photos.
- [ ] `src/components/PhotoCard.tsx`: Individual photo item.

### 4. Export
- [ ] Implement PDF export logic in `src/pages/Dashboard.tsx` or a utility `src/lib/pdf.ts`.

### 5. Routing
- [ ] Update `src/App.tsx` with routes.