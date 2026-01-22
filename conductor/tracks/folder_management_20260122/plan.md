# Implementation Plan - 작업 및 현장별 폴더 관리 시스템 구축

## Phase 1: 기반 로직 및 데이터 연동 (Foundation)
폴더 데이터를 관리할 상태 저장소와 API 연동 로직을 구축합니다.

- [ ] Task: 폴더 관리를 위한 Zustand 스토어(`folderStore.ts`) 구현
    - [ ] 폴더 목록 및 현재 선택된 폴더 상태 관리 테스트 작성
    - [ ] CRUD 함수 구현
- [ ] Task: API 연동 및 Mock 데이터 설정
    - [ ] 백엔드 폴더 API 호출 함수 추가 (`api.ts`)
- [ ] Task: Conductor - User Manual Verification 'Phase 1: 기반 로직 및 데이터 연동' (Protocol in workflow.md)

## Phase 2: 폴더 UI 및 사이드바 내비게이션 (UI & Navigation)
작업 목록 페이지(`JobList.tsx`)에 폴더를 관리하고 탐색할 수 있는 사이드바를 추가합니다.

- [ ] Task: 폴더 사이드바 컴포넌트 개발
    - [ ] 폴더 목록 렌더링 및 선택 로직 구현
    - [ ] 폴더 생성 및 이름 변경을 위한 다이얼로그 추가
- [ ] Task: 작업 목록 필터링 연동
    - [ ] 선택된 폴더에 따라 `JobList` 필터링 로직 구현
- [ ] Task: Conductor - User Manual Verification 'Phase 2: 폴더 UI 및 사이드바 내비게이션' (Protocol in workflow.md)

## Phase 3: 작업 이동 기능 (Move Functionality)
작업을 폴더로 이동시키는 기능을 고도화합니다.

- [ ] Task: 작업 이동 메뉴 및 드래그 앤 드롭 구현
    - [ ] 개별 작업 카드의 컨텍스트 메뉴에 '폴더로 이동' 추가
    - [ ] 폴더 간 이동 기능 검증
- [ ] Task: Conductor - User Manual Verification 'Phase 3: 작업 이동 기능' (Protocol in workflow.md)
