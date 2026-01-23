# Implementation Plan - 중복 사진 제거 성능 고도화

## Phase 1: 로직 고도화 및 Worker 이식 (Logic & Worker)
중복 검사 핵심 알고리즘을 개선하고 Web Worker 환경으로 옮깁니다.

- [ ] Task: 중복 검사 전용 Web Worker 구현
    - [ ] `duplicateDetection.worker.ts` 작성 (해싱 및 그룹화 로직)
    - [ ] `createImageBitmap`을 활용한 픽셀 데이터 추출 최적화
    - [ ] 단위 테스트 작성 (Worker 통신 및 해싱 정확도)
- [ ] Task: 시각적 해싱(Perceptual Hash) 알고리즘 강화
    - [ ] 색상 평균 또는 DCT 기반 해시 도입으로 유사도 검사 정확도 향상
- [ ] Task: Conductor - User Manual Verification 'Phase 1: 로직 고도화 및 Worker 이식' (Protocol in workflow.md)

## Phase 2: UI/UX 통합 및 피드백 (UI & Feedback)
사용자가 검사 과정을 인지하고 결과를 쉽게 관리할 수 있도록 UI를 개선합니다.

- [ ] Task: 검사 상태 표시 기능 추가
    - [ ] `PhotoUploader`에 검사 진행률 표시 (예: "비슷한 사진을 찾는 중... 40%")
- [ ] Task: 결과 UI 최적화
    - [ ] 중복 그룹 렌더링 성능 개선 (대량 발생 시 대응)
- [ ] Task: Conductor - User Manual Verification 'Phase 2: UI/UX 통합 및 피드백' (Protocol in workflow.md)

## Phase 3: 최종 성능 검증 (Verification)
실제 대량 데이터를 활용하여 개선 결과를 측정합니다.

- [ ] Task: 성능 벤치마킹 및 리포트
    - [ ] 100장, 500장 단위 검사 소요 시간 측정
- [ ] Task: Conductor - User Manual Verification 'Phase 3: 최종 성능 검증' (Protocol in workflow.md)
