# Specification: Clustering Board Enhancement

## 1. Overview
사진 분류 보드(Clustering Board)의 UI/UX를 전면 개편하여, 분류 결과 확인(Review)과 오분류 수정(Correction) 작업의 효율성을 극대화합니다. 특히 노트북 화면에서의 가독성을 높이고, "임시 보관함(Reserve Box)"과 "추가 버튼"의 사용성을 개선합니다.

## 2. Functional Requirements

### A. Layout & UX (Review-Centric)
*   **Vertical Grid Layout:**
    *   기존의 가로 스크롤(Horizontal Scroll)을 제거합니다.
    *   그룹(Cluster)들을 카드 형태로 시각화하고, 화면 너비에 따라 반응형 그리드(한 줄에 2~4개)로 배치합니다.
    *   한눈에 많은 그룹을 파악할 수 있도록 밀도(Density)를 조절합니다.
*   **Pinned Sidebar (Reserve Box):**
    *   "임시 보관함"을 화면 좌측(또는 우측) 사이드바에 고정(Sticky) 배치합니다.
    *   메인 영역이 스크롤되어도 임시 보관함은 항상 접근 가능해야 합니다.
    *   잘못 분류된 사진을 사이드바로 드래그하여 임시 저장하고, 다시 메인 영역의 올바른 그룹으로 드래그 앤 드롭 할 수 있습니다.

### B. Interaction Improvements
*   **On-Demand Drop Zones:**
    *   각 그룹 박스의 '사진 추가(+)' 버튼을 평소에는 숨깁니다.
    *   사용자가 사진을 드래그하기 시작하면(OnDragStart), 모든 그룹 카드에 **Drop Zone**이 시각적으로 활성화됩니다.
*   **Bulk Actions:**
    *   Shift/Ctrl 키를 이용한 **다중 선택**을 지원합니다.
    *   다중 선택된 사진들을 한 번에 다른 그룹이나 임시 보관함으로 이동할 수 있습니다.
*   **Quick Preview (Lightbox):**
    *   사진 썸네일을 클릭하면 고해상도 이미지를 볼 수 있는 모달(Lightbox)을 띄웁니다.
    *   Lightbox 내에서도 키보드 좌우 키로 이전/다음 사진 탐색이 가능해야 합니다.

### C. Performance
*   **Virtualization:**
    *   수백 개의 그룹과 사진이 있을 때를 대비하여, 화면에 보이는 영역만 렌더링하는 **Windowing/Virtualization** 기법을 적용합니다. (React Virtualized 등 활용)

## 3. Tech Stack
*   **UI Library:** Tailwind CSS, shadcn-ui
*   **DnD:** @hello-pangea/dnd (기존 유지)
*   **State Management:** Zustand (기존 유지)
*   **Virtualization:** @tanstack/react-virtual

## 4. Success Criteria
*   [ ] 노트북 화면(13~15인치)에서 가로 스크롤 없이 모든 분류 그룹을 탐색할 수 있어야 한다.
*   [ ] 스크롤 위치와 관계없이 임시 보관함에 사진을 넣거나 뺄 수 있어야 한다.
*   [ ] 사진 추가 버튼이 평소에는 보이지 않다가 드래그 시에만 나타나야 한다.
*   [ ] 1000장 이상의 사진이 있어도 스크롤 버벅임이 없어야 한다.
