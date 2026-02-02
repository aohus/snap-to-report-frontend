# Specification: Fix InsertBefore NotFoundError on Job Creation

## Overview
`JobList` 페이지에서 새로운 작업을 생성(`CreateJob`)한 직후, `Uncaught NotFoundError: Failed to execute 'insertBefore' on 'Node'` 에러가 발생하며 화면이 흰색으로 변하는(White Screen) 치명적인 버그를 수정합니다. 이 문제는 페이지를 새로고침하면 해결되므로, 상태 업데이트나 라우팅 전환 시점의 DOM 불일치(Reconciliation issue)가 원인으로 추정됩니다. 특히 특정 브라우저에서만 발생하는 경향이 있습니다.

## Context
- **Error Message:** `Uncaught NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.`
- **Location:** `JobList` 컴포넌트 및 관련 데이터 갱신 로직
- **Trigger:** 작업 생성(Create Job) 완료 직후 `JobList`로 복귀 또는 갱신 시점
- **Specific Constraint:** 특정 브라우저 환경 의존성 존재

## Functional Requirements
1. **Crash Prevention:** 작업 생성 후 `JobList`로 이동하거나 데이터를 갱신할 때 애플리케이션이 크래시되지 않아야 합니다.
2. **Seamless Update:** 새로고침 없이도 생성된 작업이 리스트에 정상적으로 반영되어야 합니다.
3. **Error Handling:** 유사한 DOM 불일치 에러 발생 시 전체 앱이 멈추지 않도록 적절한 방어 코드가 적용되어야 합니다.

## Non-Functional Requirements
- **User Experience:** 사용자는 작업 생성 후 자연스럽게 리스트 화면을 볼 수 있어야 하며, 강제로 새로고침을 할 필요가 없어야 합니다.

## Out of Scope
- `CreateJob`의 비즈니스 로직 자체 변경 (데이터 저장 방식 등은 유지)
- 전체 UI 디자인 변경
