# Track Specification: Fix White Screen on Job Creation & Upload Completion

## Overview
Job 생성 직후 또는 사진 업로드 완료 직후, Job 상세 페이지로 진입하거나 머무를 때 데이터가 로드되지 않아 화면이 하얗게 표시되는(White Screen) 버그를 수정합니다. 사용자가 페이지를 새로고침하면 정상적으로 로드되므로, 이는 페이지 이동 또는 상태 변경 시점의 데이터 페칭(Data Fetching) 및 상태 동기화 누락이 원인으로 보입니다.

## Problem Statement
- **증상:**
    - Job 생성 후 상세 페이지로 자동 이동 시 화면이 하얗게 나옴.
    - 사진 업로드 완료 후 화면 갱신이 안 되거나 하얗게 변함 (분류 시작 버튼이 안 뜸).
    - URL에 Job ID는 정상적으로 포함되어 있음.
    - 브라우저 새로고침(F5) 시 정상적으로 화면이 렌더링됨.
- **원인 추정:**
    - `JobEditor` 또는 관련 페이지 컴포넌트 진입 시 `Job Details`를 가져오는 쿼리가 즉시 트리거되지 않음.
    - React Query의 캐시 무효화(Invalidation)가 적절한 시점에 이루어지지 않아 이전 상태(데이터 없음)를 유지하고 있음.
    - `site` 정보 로딩과 `job details` 로딩 간의 의존성 문제로 인한 레이스 컨디션 가능성.

## Goals
1. Job 생성 직후 상세 페이지로 이동했을 때, 즉시 Job 정보를 불러와 화면을 정상 렌더링한다.
2. 사진 업로드 완료 후, 별도의 새로고침 없이 Job 정보를 갱신하여 '분류 시작' 버튼 등 최신 상태를 반영한다.
3. 데이터 로딩 중일 때 흰 화면 대신 적절한 로딩 인디케이터(Skeleton 또는 Spinner)를 표시하여 UX를 개선한다.

## Implementation Details
- **Focus Area:**
    - `src/pages/JobEditor.tsx` (또는 해당 뷰를 담당하는 컴포넌트)
    - `src/hooks/useJob.ts` (또는 Job 관련 React Query 훅)
    - `src/components/PhotoUploader.tsx` (업로드 완료 후 콜백 처리)
- **Key Changes:**
    - Job 생성 성공(`onSuccess`) 시 `queryClient.invalidateQueries`를 통해 Job 관련 쿼리 즉시 갱신 보장.
    - 사진 업로드 완료 시점에도 동일하게 Job 상세 정보를 재조회하도록 로직 추가/수정.
    - `JobEditor` 컴포넌트에서 데이터 `isLoading` 또는 `data`가 `undefined`일 때의 방어 코드를 추가하여 흰 화면 방지.

## Acceptance Criteria
- [ ] Job을 새로 생성한 직후, 자동으로 이동된 상세 페이지에서 Job 정보가 즉시 표시되어야 한다 (흰 화면 없음).
- [ ] 사진 업로드가 완료되면 자동으로 화면이 갱신되어, 업로드된 사진 정보가 반영되거나 '분류 시작' 버튼이 나타나야 한다 (새로고침 불필요).
- [ ] 데이터 로딩 중에는 빈 화면이 아닌 로딩 UI가 표시되어야 한다.
