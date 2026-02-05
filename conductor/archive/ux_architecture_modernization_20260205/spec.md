# Specification: Architecture & UX Modernization

## 1. Overview
현재의 `Dashboard` 및 주요 컴포넌트들을 구조적으로 리팩토링하여 유지보수성을 높이고, 대량 데이터 처리를 위한 성능 최적화(가상화)를 수행합니다. 또한, 최신 디자인 트렌드를 반영하되, **주요 사용자층(현장 전문가, 어른들)을 고려하여 직관적이고 전문적인 도구 느낌**으로 UI/UX를 고도화합니다.

## 2. Functional Requirements

### A. Architecture & Refactoring (Priority: High)
1.  **Dashboard Component Decomposition:**
    *   `Dashboard.tsx`의 거대한 로직을 분리합니다.
    *   `ClusterDialog`, `JobExportPopover`, `PhotoGridSection` 등으로 컴포넌트 단위 분리.
    *   복잡한 상태 로직(Cluster 이동, 생성 등)을 `useJobActions` Custom Hook으로 추출.
2.  **Runtime Type Validation:**
    *   `zod`를 도입하여 API 응답 데이터(`Job`, `Photo`, `Cluster` 등)의 런타임 검증 로직 추가.
3.  **Error Handling Strategy:**
    *   `react-error-boundary` 도입.
    *   섹션별(Grid, Board) 에러 격리 및 "Retry" UI 제공.

### B. Performance Optimization (Priority: High)
1.  **Virtualization:**
    *   `@tanstack/react-virtual` 도입.
    *   수백 장 이상의 사진이 있는 `PhotoGrid`와 `ClusterBoard`에 가상 스크롤 적용하여 DOM 노드 수 관리.
2.  **Rendering Optimization:**
    *   주요 컴포넌트 `React.memo` 적용 및 불필요한 리렌더링 방지.

### C. UX & UI Modernization (Priority: Medium) - "Professional Tool" Theme
1.  **Design Philosophy:**
    *   **Professional & Clean:** 화려한 장식보다는 **데이터의 가독성**과 **작업의 효율성**에 집중합니다. (예: Linear, Notion, Excel의 장점 결합)
    *   **Intuitive for Professionals:** 숨겨진 제스처보다는 **명시적인 버튼**을 선호합니다. 아이콘만 있는 버튼보다는 **텍스트 라벨**을 병기하여 의미 전달을 명확히 합니다.
    *   **High Accessibility:** **높은 명암비**와 **충분한 폰트 크기(15px+)**를 확보하여 어른들도 눈이 편안하게 작업할 수 있도록 합니다.

2.  **Specific UI Elements:**
    *   **Explicit Action Toolbar:** 아이콘과 함께 "이동", "삭제" 등의 텍스트가 명확히 보이는 툴바를 제공합니다.
    *   **Mobile Experience:**
        *   복잡한 드래그 앤 드롭 대신, **"선택 모드(Select Mode)"**를 도입합니다.
        *   선택 후 하단에서 올라오는 **Large Action Drawer**를 통해 명확한 버튼으로 폴더 이동/삭제 등을 처리합니다.
    *   **Solid Feedback:** 작업 완료 시 미세한 애니메이션보다는 **크고 명확한 체크마크/토스트**로 피드백을 줍니다.
    *   **Information Density:**
        *   **Bento Grid Layout:** 상단 통계(전체, 분류됨, 미분류)를 카드 형태로 정리하여 한눈에 현황을 파악하도록 합니다.
        *   **Table/List View Option:** 그리드 뷰 외에 파일명 위주의 **리스트 뷰** 옵션을 고려하여 전문적인 파일 관리 느낌을 줍니다.

3.  **Visual Details:**
    *   **Colors:** 차분한 무채색(Slate/Gray) 베이스에 신뢰감을 주는 **Deep Blue/Navy**를 포인트 컬러로 사용합니다.
    *   **Typography:** 가독성이 뛰어난 **Inter** 또는 **Pretendard** 폰트를 사용하며, 가늘지 않은 굵기(Medium/SemiBold)를 적극 활용합니다.

## 3. Tech Stack
- **Virtualization:** `@tanstack/react-virtual`
- **Validation:** `zod`
- **Error Handling:** `react-error-boundary`
- **UI/Animation:** `shadcn-ui` (Base), `framer-motion` (Micro-interactions)

## 4. Success Criteria
- [ ] `Dashboard.tsx`의 코드 라인 수가 300줄 이하로 감소해야 함.
- [ ] 500장 이상의 사진 로드 시 프레임 드랍 없이 스크롤이 부드러워야 함.
- [ ] 모바일에서 드래그 없이 "버튼 클릭"만으로 사진 이동이 가능해야 함.
- [ ] 주요 액션 버튼(이동, 삭제 등)은 텍스트 라벨을 포함해야 함.