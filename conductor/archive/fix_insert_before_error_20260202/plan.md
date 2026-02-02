# Implementation Plan - Fix InsertBefore NotFoundError

## Phase 1: Diagnosis & Reproduction
- [x] Task: 사용자로부터 문제가 발생하는 특정 브라우저 정보 확인 및 로컬 환경에서 재현 시도
- [x] Task: `JobList.tsx` 및 데이터 갱신 로직(`TanStack Query` 캐시 업데이트 등) 분석하여 DOM 불일치 원인 파악
- [x] Task: 문제의 원인이 되는 코드 패턴(예: 잘못된 Fragment 사용, key 중복, 조건부 렌더링 등) 식별
- [x] Task: Conductor - User Manual Verification 'Diagnosis & Reproduction' (Protocol in workflow.md)

## Phase 2: Implementation (Fix) [checkpoint: 3f0623a]
- [x] Task: `src/pages/JobList.test.tsx`에 리스트 갱신 시나리오에 대한 테스트 케이스 추가 (TDD Red)
    - *참고: 브라우저 엔진 특화 버그일 경우 JSDOM에서 재현되지 않을 수 있으므로, 로직 검증에 집중합니다.*
- [x] Task: 식별된 DOM 불일치 원인 수정 및 안전한 렌더링 구조로 변경 (TDD Green)
    - [x] Sub-task: navigate 타이밍 및 Dialog 상태 관리 수정
    - [x] Sub-task: 번역기 방지를 위해 주요 텍스트 노드를 <span>으로 감싸기
- [x] Task: Dashboard 사진 업로드 완료 직후 White Screen 버그 수정
    - [x] Sub-task: 업로드 완료 로직 및 DOM 조작 분석
    - [x] Sub-task: 안전한 상태 업데이트 및 렌더링 구조 적용
- [x] Task: `ErrorBoundary` 등을 활용하여 유사한 DOM 에러 발생 시 앱 크래시 방지 처리 (Optional)
- [x] Task: 전체 테스트 슈트 실행 (`npm run test`) 및 코드 커버리지 확인
- [x] Task: Conductor - User Manual Verification 'Implementation' (Protocol in workflow.md)

## Phase 3: Documentation
- [x] Task: 버그 원인 및 해결 방법 문서화 (`conductor/docs/fix_insert_before_error_20260202/report.md`)
- [x] Task: Conductor - User Manual Verification 'Documentation' (Protocol in workflow.md)
