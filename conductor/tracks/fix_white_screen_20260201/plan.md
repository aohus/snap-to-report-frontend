# Implementation Plan: Fix White Screen on Job Creation & Upload Completion

이 트랙은 Job 생성 및 사진 업로드 후 발생하는 데이터 로딩 누락 문제를 해결하여 흰 화면(White Screen)을 방지하고 매끄러운 UX를 제공하는 것을 목표로 합니다.

## Phase 1: 조사 및 재현 테스트 작성 (Investigation & Reproduction)
- [x] Task: 현재 Job 상세 정보 조회 로직 및 React Query 구조 분석
- [x] Task: Job 생성 및 사진 업로드 후 쿼리 무효화(Invalidation) 로직 점검
- [x] Task: `JobEditor` 컴포넌트의 데이터 로딩 상태 처리(Fallback UI) 코드 확인
- [x] Task: (Red Phase) 데이터 로딩 실패 또는 지연 시 흰 화면이 발생하는 상황을 재현하는 단위 테스트 작성
- [x] Task: Conductor - User Manual Verification 'Phase 1: 조사 및 재현 테스트 작성' (Protocol in workflow.md) [checkpoint: 1520e08]

## Phase 2: 데이터 동기화 및 로딩 로직 수정 (Implementation)
- [x] Task: Job 생성 성공 시 `queryClient.invalidateQueries` 호출 보장 및 데이터 동기화 최적화
- [x] Task: 사진 업로드 완료 콜백에서 Job 상세 정보를 즉시 갱신하도록 수정
- [x] Task: `JobEditor` 컴포넌트에 로딩 상태(Skeleton 또는 Spinner) 및 데이터 부재 시 예외 처리 추가
- [x] Task: (Green Phase) 작성한 테스트가 통과하도록 코드 수정 및 리팩토링
- [x] Task: Conductor - User Manual Verification 'Phase 2: 데이터 동기화 및 로딩 로직 수정' (Protocol in workflow.md) [checkpoint: edff40c]

## Phase 3: 최종 검증 및 문서화 (Verification & Documentation)
- [ ] Task: 전체 테스트 모음(Test Suite) 실행 및 커버리지 확인
- [ ] Task: Job 생성부터 업로드 완료, 분류 시작까지의 전체 흐름 수동 검증
- [ ] Task: `conductor/docs/` 내에 구현 리포트 작성
- [ ] Task: Conductor - User Manual Verification 'Phase 3: 최종 검증 및 문서화' (Protocol in workflow.md)
