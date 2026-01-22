# Implementation Plan - 사진 업로드 성능 최적화 및 고속 업로드 UI 구현

이 계획은 사진 업로드 성능을 극한으로 끌어올리고, 사용자에게 친절한 업로드 경험을 제공하기 위한 단계별 로직을 담고 있습니다.

## Phase 1: 기반 로직 및 성능 측정 (Foundation & Measurement)
이미지 압축 및 업로드를 위한 핵심 엔진을 Web Worker로 분리하고 성능을 측정할 수 있는 기반을 마련합니다.

- [ ] Task: Web Worker 기반 이미지 압축 유틸리티 구현
    - [ ] 이미지 압축 로직 테스트 코드 작성 (해상도, 품질 확인)
    - [ ] `pica` 및 `browser-image-compression`을 활용한 Worker 스크립트 작성
    - [ ] EXIF 데이터 추출 및 보존 로직 구현 및 검증
- [ ] Task: 병렬 업로드 제어 큐(Queue) 구현
    - [ ] `p-limit` 기반의 동시 실행 제어 테스트 작성
    - [ ] 전역 상태(Zustand)를 통한 업로드 큐 및 개별 상태 관리 구현
- [ ] Task: Conductor - User Manual Verification 'Phase 1: 기반 로직 및 성능 측정' (Protocol in workflow.md)

## Phase 2: 고속 업로드 인터페이스 (High-Performance UI)
사용자에게 실시간 피드백을 제공하는 직관적인 UI 컴포넌트를 개발합니다.

- [ ] Task: 진행 상태 표시줄 및 상태 안내 컴포넌트 개발
    - [ ] UI 컴포넌트 단위 테스트 작성 (진행률 반영 확인)
    - [ ] 전체 진행률(Total Progress) 및 개별 상태 표시 UI 구현
    - [ ] 디지털 취약 계층을 위한 쉬운 문구(Copywriting) 적용
- [ ] Task: 낙관적 UI 적용 사진 그리드 구현
    - [ ] 사진 선택 즉시 렌더링 성능 테스트
    - [ ] 선택한 사진을 즉시 썸네일로 보여주는 그리드 컴포넌트 구현
- [ ] Task: Conductor - User Manual Verification 'Phase 2: 고속 업로드 인터페이스' (Protocol in workflow.md)

## Phase 3: 통합 및 예외 처리 (Integration & Robustness)
실제 API와 연동하고 다양한 네트워크 상황에 대응하는 안정성을 확보합니다.

- [ ] Task: Supabase Storage 연동 및 실제 업로드 통합
    - [ ] 통합 테스트 코드 작성 (Mock Supabase Client 활용)
    - [ ] 큐 시스템과 Supabase SDK 연동 구현
- [ ] Task: 오류 재시도 및 중단 처리 구현
    - [ ] 네트워크 오류 상황 시뮬레이션 및 재시도 로직 검증
    - [ ] 업로드 실패 항목에 대한 '다시 시도' 버튼 및 안내 UI 구현
- [ ] Task: Conductor - User Manual Verification 'Phase 3: 통합 및 예외 처리' (Protocol in workflow.md)

## Phase 4: 최종 검증 및 보고 (Finalization)
전체 흐름을 점검하고 성능 개선 결과를 리포트로 작성합니다.

- [ ] Task: 전체 사용자 시나리오(Wizard flow) 최종 테스트
    - [ ] 사진 선택 -> 업로드 -> 완료 안내로 이어지는 전체 흐름 검증
- [ ] Task: 성능 개선 결과 측정 및 리포트 작성
    - [ ] 기존 업로드 방식 대비 개선된 속도 벤치마킹 결과 정리
- [ ] Task: Conductor - User Manual Verification 'Phase 4: 최종 검증 및 보고' (Protocol in workflow.md)
