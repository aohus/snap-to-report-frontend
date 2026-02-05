# Specification: UI/UX Modernization & Design System Standardization

## 1. Overview
사용자 경험(UX)을 전문가 수준으로 끌어올리기 위해 전반적인 디자인 테마를 **"Clean & Professional"** 컨셉으로 고도화합니다. 단순히 시각적 변경을 넘어, 대시보드부터 워크스페이스까지 모든 화면에 일관된 디자인 시스템(Design System)을 적용하고, 전문가용 도구에 적합한 높은 정보 밀도(Compact Layout)를 제공하는 것을 목표로 합니다.

## 2. Functional Requirements

### A. Design System Foundation (Global Styles)
*   **Refined Design Tokens:**
    *   **Color Palette:** 신뢰감을 주는 Professional Navy/Slate를 기반으로 시맨틱 컬러(Primary, Surface, Border) 재정의.
    *   **Typography:** 가독성 중심의 텍스트 계층 구조(Heading, Body, Caption) 정의 및 폰트 크기 최적화.
    *   **Surface System:** 일관된 카드 스타일, 그림자(Shadow), 모서리 곡률(Radius) 값 표준화.
*   **Component Standardization:**
    *   버튼, 입력 필드, 모달(Dialog), 배지(Badge) 등 모든 UI 원자(Atoms) 요소의 스타일을 `shadcn-ui` 기반으로 통일.

### B. High-Density Dashboard (Renewal)
*   **Bento Grid Layout:** 요약 위젯과 활동 내역을 효율적으로 배치하는 그리드 시스템 도입.
*   **Compact Widgets:** 여백을 최적화하여 한 화면에 더 많은 지표와 상태 정보를 노출.

### C. Professional Job List (Renewal)
*   **Data Grid Optimization:** 테이블 행 높이를 조절하여 더 많은 리스트를 한눈에 파악.
*   **Integrated Action Bar:** 검색 및 필터링 UI를 더 작고 정교하게 리팩토링.

### D. Workspace & Clustering Board (UI Polish)
*   **Refined PhotoCard:** 사진 카드의 정보 노출 방식을 개선하고, 리스트 밀도를 높임.
*   **Consistent Surfaces:** 워크스페이스 내의 패널과 배경에 디자인 시스템의 계층(Surface Levels) 적용.

## 3. Non-Functional Requirements
*   **Consistency:** 모든 페이지에서 동일한 버튼 크기, 폰트, 색상이 예외 없이 사용되어야 함.
*   **Performance:** 스타일 변경으로 인한 레이아웃 시프트(CLS) 최소화.
*   **Data Density:** 전문가용 도구로서의 사용성을 위해 정보 누락 없이 'Compact'한 레이아웃 유지.

## 4. Acceptance Criteria
*   [ ] `tailwind.config.ts` 및 `index.css`에 정의된 새로운 디자인 시스템이 전역에 적용됨.
*   [ ] Dashboard, Job List, Workspace 화면이 새로운 디자인 컨셉으로 통일됨.
*   [ ] 모든 상호작용 요소(버튼, 인풋 등)가 표준화된 스타일을 따름.
*   [ ] 화면 가로 너비 1440px 기준, 이전보다 약 20% 더 많은 데이터가 한 화면에 표시됨(Compact 기준 충족).

## 5. Out of Scope
*   백엔드 API 및 데이터 스키마 변경.
*   보고서 생성 로직의 기능적 변경(UI 스타일링만 포함).
