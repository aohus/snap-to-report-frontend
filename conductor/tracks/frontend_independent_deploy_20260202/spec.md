# Specification: Frontend Independent Deployment Pipeline

## Overview
프론트엔드 저장소의 코드가 `main` 브랜치에 반영될 때, 백엔드 서비스의 중단 없이 프론트엔드(web) 서비스만 서버(GCE)에 자동으로 배포하는 GitHub Actions 워크플로우를 구축합니다.

## Context
- **Target Service:** `docker-compose.prod.yml` 내의 `web` 서비스
- **Image:** `asia-northeast3-docker.pkg.dev/snap-2-report/snap-2-report-repo/s2r-web:latest`
- **Environment:** Google Compute Engine (GCE), Docker Compose
- **Trigger:** `main` 브랜치 push 발생 시

## Functional Requirements
1. **Docker Build & Push:**
   - 프론트엔드 `Dockerfile`을 사용하여 배포용 이미지를 빌드합니다.
   - 빌드된 이미지를 Google Artifact Registry(GAR)의 `s2r-web:latest` 태그로 푸시합니다.
2. **Independent Deployment:**
   - GCE 서버에 SSH로 접속합니다.
   - `docker compose pull web` 명령으로 프론트엔드 이미지만 새로 가져옵니다.
   - `docker compose up -d web` 명령을 실행하여 **백엔드(api, postgres)를 건드리지 않고 프론트엔드 컨테이너만 재시작**합니다.
3. **Resource Optimization:**
   - 배포 완료 후 `docker image prune -f`를 실행하여 서버 내의 불필요한 이전 이미지들을 정리합니다.

## Non-Functional Requirements
- **Zero Downtime for Backend:** 프론트엔드 배포 중에도 백엔드 API 서비스는 정상 동작해야 합니다.
- **Security:** 모든 민감한 정보(GCP 키, SSH 키, 호스트 IP 등)는 GitHub Secrets를 통해 관리합니다.

## Acceptance Criteria
- 프론트엔드 코드 수정 후 push 시 GitHub Actions 워크플로우가 성공적으로 완료되어야 합니다.
- 서버에서 `docker ps` 실행 시 `prod-s2r-web` 컨테이너만 최신 상태로 갱신되어야 합니다.
- 배포 과정 중 백엔드 API 호출 시 중단 없이 응답해야 합니다.

## Out of Scope
- 백엔드 서비스(`api`, `postgres`)의 업데이트 및 재시작
- SSL 인증서(`Certbot`)의 신규 발급 및 갱신 로직 (기존 볼륨 활용)
