# Specification: UI Modernization & Dashboard Renewal

## 1. Overview
사용자 경험(UX)을 전문가 수준으로 끌어올리기 위해 전반적인 디자인 테마를 **"Professional & Trusted"** 컨셉으로 고도화합니다. 핵심은 **명확한 디자인 시스템(Design System)을 정의**하여 모든 페이지에 일관되게 적용하고, 이를 바탕으로 **대시보드(Dashboard)**를 전면 개편하는 것입니다.

## 2. Functional Requirements

### A. Design System & Global Rules (Foundation)
*   **Design Tokens Definition:**
    *   `tailwind.config.ts` 및 `index.css`에 시맨틱 컬러(Semantic Colors)를 재정의합니다.
    *   **Primary:** 신뢰감을 주는 Deep Navy/Slate 계열.
    *   **Surface:** 배경색은 계층 구조에 따라 White -> Gray-50 -> Gray-100으로 단계적으로 적용.
    *   **Border:** 얇고 정교한 Gray-200/300.
*   **Typography Rules:**
    *   **Headings:** 명확한 계층 구조 (H1 ~ H4) 정의 및 Letter-spacing 조정.
    *   **Body:** 가독성을 위한 Line-height(1.5~1.6) 및 폰트 컬러(Gray-700/500) 표준화.
*   **Component Consistency:**
    *   모든 페이지(`Login`, `Dashboard`, `JobList`, `Editor`)에서 버튼, 인풋, 카드, 모달의 스타일(Shadow, Radius)을 통일합니다.

### B. Dashboard Renewal (Layout & Features)
*   **Data Visualization (Widgets):**
    *   상단에 **Bento Grid 스타일의 요약 카드** 배치 (총 작업, 최근 활동, 완료율 등).
    *   숫자와 라벨의 대비를 높여 정보 전달력 강화.
*   **Advanced Job List (Data Grid):**
    *   **테이블 뷰:** 단순 리스트를 정보 밀도가 높은 테이블 형태로 변경.
    *   **Smart Filter/Sort:** 상태별, 날짜별 필터링 및 정렬 UI 고도화.
    *   **Search:** 즉각적인 피드백을 주는 검색 인터페이스.
*   **Visual Hierarchy & Actions:**
    *   **Status Badges:** 작업 상태를 직관적인 컬러 배지로 표시 (예: 완료=Green, 진행중=Blue).
    *   **Primary Actions:** '새 작업 생성' 버튼을 강조하고 접근성 높은 위치에 배치.

## 3. Tech Stack
*   **UI Framework:** Tailwind CSS, shadcn-ui
*   **Icons:** Lucide React
*   **Animation:** Framer Motion (부드러운 전환 효과)

## 4. Success Criteria
*   [ ] `tailwind.config.ts`에 새로운 디자인 토큰(Color, Typography)이 정의되고 적용되어야 함.
*   [ ] 모든 페이지의 버튼, 인풋 등 기본 컴포넌트 스타일이 일관되어야 함.
*   [ ] 대시보드 리뉴얼 후, 사용자가 원하는 작업을 3초 이내에 찾을 수 있어야 함 (가독성/검색).
*   [ ] 모바일/데스크탑 반응형 레이아웃이 완벽하게 동작해야 함.
