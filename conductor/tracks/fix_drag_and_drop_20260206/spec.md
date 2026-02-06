# Track Specification: Fix ClusterBoard Drag and Drop Failure

## 1. Overview
`ClusterBoard` 컴포넌트 내에서 사진 분류 및 정렬을 위한 드래그 앤 드롭 기능이 작동하지 않는 심각한 버그를 수정합니다. 사용자가 사진을 드롭하면 변경 사항이 반영되지 않고 원래 위치로 되돌아가며, 브라우저 콘솔에 `Invariant failed` 에러가 발생합니다.

## 2. Problem Description
- **증상:**
  - 미분류(Unclassified) 영역에서 그룹(Cluster)으로 이동 불가
  - 그룹 간 사진 이동 불가
  - 그룹 내 순서 변경 불가
  - 드롭 시각적 피드백 후 사진이 제자리로 복귀
- **에러 로그:** `Invariant failed at Z ... at Object.l [as getById]`
  - 이는 DnD 라이브러리가 드래그 또는 드롭 대상의 ID를 찾지 못하거나, 중복된 ID가 존재할 때 주로 발생합니다.
- **발생 시점:** UI 고도화(UI Modernization) 작업 이후 발생. 컴포넌트 구조 변경이나 스타일링 적용 과정에서 `ref` 전달이나 ID 관리에 문제가 생긴 것으로 추정됩니다.

## 3. Scope & Goals
- **목표:**
  1. `Invariant failed` 에러 원인 파악 및 해결
  2. `ClusterBoard` 내 모든 드래그 앤 드롭 시나리오(Unclassified <-> Cluster, Cluster <-> Cluster, Reordering) 정상화
- **범위:**
  - `src/components/ClusterBoard.tsx` 및 관련 하위 컴포넌트 (`PhotoCard`, `PlaceColumn` 등 DnD 관련 컴포넌트)
  - 드래그 앤 드롭 관련 로직 및 상태 관리 부분

## 4. Hypothesis & Investigation Points
1. **Ref Forwarding Issue:** UI 컴포넌트(Shadcn UI 등) 도입 또는 커스텀 스타일링 래퍼 추가로 인해 DnD 라이브러리의 `innerRef`가 실제 DOM 요소에 제대로 전달되지 않았을 가능성.
2. **Duplicate/Invalid IDs:** 렌더링 최적화나 리스트 렌더링 과정에서 `Draggable` 또는 `Droppable` ID가 중복되거나 비정상적으로 생성되었을 가능성.
3. **React.StrictMode:** React 18+ 환경에서의 StrictMode 호환성 문제 (단, 기존에 잘 동작했다면 가능성 낮음).

## 5. Acceptance Criteria
- [ ] 미분류 영역에서 임의의 클러스터로 사진을 드래그하여 이동할 수 있어야 한다.
- [ ] 클러스터 간에 사진을 이동할 수 있어야 한다.
- [ ] 클러스터 내에서 사진의 순서를 변경할 수 있어야 한다.
- [ ] 드래그 앤 드롭 수행 시 콘솔에 `Invariant failed` 에러가 발생하지 않아야 한다.
