# Technology Stack - snap-2-report (Frontend)

## 핵심 프레임워크 및 언어
- **Framework:** React 19 (Vite 기반)
- **Language:** TypeScript
- **Build Tool:** Vite

## UI 및 스타일링
- **Styling:** Tailwind CSS
- **UI Components:** shadcn-ui (Radix UI 기반)
- **Icons:** Lucide React
- **Animation:** Framer Motion

## 상태 관리 및 데이터 페칭
- **Server State:** TanStack Query (React Query) v5
- **Client State:** Zustand
- **Routing:** React Router DOM

## 이미지 처리 (핵심 로직)
- **Image Compression:** browser-image-compression, pica
- **Metadata Handling:** exif-js, exif-ts, piexifjs

## 유틸리티 및 검증
- **Form Management:** react-hook-form
- **Validation:** Zod
- **API Client:** Supabase JavaScript SDK (외부 서비스 연동)
- **Utility:** date-fns, uuid, p-limit (병렬 처리 제어)

## 개발 및 테스트
- **Testing:** Vitest
- **Linting:** ESLint
- **Package Manager:** pnpm