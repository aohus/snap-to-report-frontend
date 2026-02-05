# Implementation Plan - ui_balance_enhancement_20260205

## Phase 1: Foundation - Typography & Core Component Scaling
전문가용 도구의 시각적 위계와 정보 밀도를 정의하는 기초 작업을 진행합니다.

- [x] Task: Typography 위계 정의 및 Tailwind 설정 업데이트 d31862d
    - [ ] 텍스트 크기 및 굵기 대비(Contrast) 규칙 수립
    - [ ] `tailwind.config.ts`에 세밀한 폰트 스케일 반영
- [ ] Task: 공통 UI 컴포넌트 크기 표준화
    - [ ] 과하게 큰 버튼 및 입력창의 패딩/높이 축소 (Compact Scale 적용)
    - [ ] `src/components/ui/` 내 주요 컴포넌트(Button, Input 등) 스타일 조정
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Foundation' (Protocol in workflow.md)

## Phase 2: Dashboard - Layout Overhaul
사이드바와 메인 영역의 균형을 맞추고 공간 활용을 극대화합니다.

- [ ] Task: Dashboard 사이드바 구조 개선
    - [ ] 사이드바 너비 최적화 및 메인 콘텐츠와의 시각적 연결성 강화
    - [ ] 고밀도 대시보드 배치를 위한 `src/pages/Dashboard.tsx` 레이아웃 수정
- [ ] Task: 대시보드 카드 및 리스트 정렬 고도화
    - [ ] 엄격한 그리드 시스템 적용으로 선(Alignment) 맞춤
    - [ ] 그림자 및 보더 효과를 통한 세련된 패널 디자인 적용
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Dashboard' (Protocol in workflow.md)

## Phase 3: Job Editor - Density & Alignment Optimization
작업 편집기 내의 여백을 줄이고 사진 노출을 극대화합니다.

- [ ] Task: Job Editor 메인 레이아웃 여백 최소화
    - [ ] 불필요한 패딩/마진 제거 및 컴포넌트 배치 재구성
    - [ ] `src/pages/JobEditor.tsx` 및 관련 컨테이너 스타일 수정
- [ ] Task: Photo Grid 및 상세 정보 정렬 개선
    - [ ] 사진 그리드의 정보 밀도 향상
    - [ ] 텍스트 위계 조정을 통한 가독성 확보
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Job Editor' (Protocol in workflow.md)

## Phase 4: Final Polish & Visual Quality
전체적인 완성도를 높이기 위한 정교한 마감 작업을 진행합니다.

- [ ] Task: 전역 시각 효과(Elevation, Blur) 일관성 부여
- [ ] Task: 전체 페이지 반응형/균형 최종 점검
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Polish' (Protocol in workflow.md)
