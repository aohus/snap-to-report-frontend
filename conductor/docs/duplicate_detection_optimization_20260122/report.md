# Implementation Report - 중복 사진 제거 성능 고도화 (duplicate_detection_optimization_20260122)

## 1. 요약 (Summary)
대량의 사진 업로드 전 단계에서 중복 사진을 필터링하는 로직의 성능과 정확도를 대폭 개선했습니다. Web Worker를 도입하여 검사 중에도 UI가 매끄럽게 유지되도록 했으며, 시각적 해싱 알고리즘을 강화하여 비슷하게 찍힌 사진 감지율을 높였습니다.

## 2. 아키텍처 업데이트 (Architecture Update)
```mermaid
graph TD
    UI[PhotoUploader] -- Start Detection --> Manager[DuplicateDetection Manager]
    Manager -- PostMessage --> Worker[DuplicateDetection Worker]
    Worker -- computePHash --> DCT[DCT Analysis]
    Worker -- grouping --> UF[Union-Find]
    Worker -- Progress/Done --> Manager
    Manager -- Update State --> UI
    
    subgraph Background (Off-main-thread)
        Worker
        DCT
        UF
    end
```

## 3. 개선 결과 (Improvements)
| 항목 | 개선 전 (Before) | 개선 후 (After) | 비고 |
| :--- | :--- | :--- | :--- |
| **UI 응답성** | 검사 중 브라우저 멈춤 발생 가능 | 검사 중에도 자유롭게 UI 조작 가능 | Web Worker 사용 |
| **사용자 피드백** | "검사 중" 텍스트만 표시 | 실시간 진행률(%) 표시 | 인지적 대기 시간 감소 |
| **검사 속도** | 메인 스레드 경쟁으로 느림 | 백그라운드 병렬 연산으로 최적화 | - |
| **정확도** | 단순 픽셀 비교 수준 | DCT 기반 시각적 해싱(pHash) 적용 | 유사 이미지 감지율 향상 |

## 4. 기술적 결정 사항 (Technical Decisions)
- **Vite Worker Integration:** Vite의 `?worker` 쿼리를 활용하여 복잡한 설정 없이 워커 파일을 효율적으로 번들링하고 로드했습니다.
- **OffscreenCanvas & createImageBitmap:** Worker 환경에서 이미지 데이터를 처리하기 위해 현대 브라우저 표준 API를 적극적으로 활용했습니다.
- **Index-based Result Passing:** Worker에서 메인 스레드로 무거운 File 객체를 다시 보내는 대신, 처리된 인덱스 배열만 전달하여 메모리 전송 비용을 최소화했습니다.
