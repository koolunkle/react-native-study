# react-native-study

> 습관 인증 서비스 — 종이 다이어리에 스티커 붙이듯, 복잡한 문법 없이 단순하게 습관을 기록하는 앱

React Native/Expo 학습을 겸해 만든 개인 토이 프로젝트입니다. 자세한 제품 요구사항은 [PRD.md](./PRD.md), 디자인 시스템 참고 자료는 [DESIGN.md](./DESIGN.md)를 확인하세요.

## 기술 스택

| 항목 | 내용 |
| --- | --- |
| 프레임워크 | [Expo](https://expo.dev) (managed workflow) + React Native + TypeScript |
| 라우팅 | [Expo Router](https://docs.expo.dev/router/introduction/) (파일 기반) |
| 로컬 저장소 | SQLite ([expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/)) — 웹은 WASM(wa-sqlite) 백엔드 |
| 알림 | [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) |
| 사진 인증 | [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) (선택/촬영) + [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/) (네이티브 영구 저장, 웹은 SQLite에 data: URI로 저장) |
| OTA 업데이트 | EAS Update (학습 목적 적용) |
| 플랫폼 | Android 주력, iOS 병행, 웹(react-native-web) 동시 지원 |

## 시작하기

```bash
npm install

npx expo start          # 개발 서버 (QR로 기기 접속)
npx expo start --android
npx expo start --ios    # macOS 필요
npx expo start --web
```

### 웹 실행 참고

`expo-sqlite`의 웹 백엔드가 `.wasm` 모듈을 요구하기 때문에, [`metro.config.js`](./metro.config.js)에 wasm 에셋 처리와 `SharedArrayBuffer`용 COOP/COEP 헤더가 설정되어 있습니다. 웹 버전은 브라우저 저장소 기반이라 데이터가 기기/브라우저별로 분리됩니다 (PRD.md 8절 참고).

웹 SQLite는 OPFS(Origin Private File System)의 SyncAccessHandle을 쓰는데, **같은 오리진에서 DB 파일은 탭 하나만 열 수 있습니다.** 같은 앱을 새 탭으로 하나 더 열면(같은 포트) 파일 잠금 충돌로 먼저 연 탭이 멈추거나 나중 탭이 에러를 냅니다 — 웹으로 테스트할 땐 탭을 하나만 유지하세요.

## 프로젝트 구조

```text
app/
  _layout.tsx              루트 스택 + SQLiteProvider(DB 초기화) + 폰트 로딩 + 다크모드 테마
  (tabs)/                  하단 탭: 홈 · 캘린더 · 통계 · 설정
  habit/new.tsx            습관 등록 (모달)
  habit/[id]/edit.tsx      습관 수정 · 그만두기
  habit/manage.tsx         습관 관리 목록
  habit/archive.tsx        보관함(완전 삭제)
  calendar/[date].tsx      캘린더 날짜별 상세
  log/[habitId]/[date].tsx 인증 기록(사진/메모) 편집 (모달)
db/
  schema.ts                SQLite 테이블 정의 (habits, habit_logs, app_settings)
  client.ts                SQLiteProvider용 마이그레이션 함수
  habits.ts                습관 등록/수정/보관/삭제
  habitLogs.ts             날짜별 체크·인증 기록, 캘린더 그리드/리스트 집계
  stats.ts                 통계 집계 쿼리 (기간별 달성률·요일별·히트맵)
  settings.ts              알림/습관 개수 제한 설정
lib/
  date.ts                  로컬 날짜 키/포맷 유틸
  notifications.ts         로컬 알림 예약·취소 (플랫폼별 분기)
  photos.ts                인증 사진 영구 저장(네이티브)/data: URI 저장(웹)
constants/
  Colors.ts                파스텔 팔레트 (light/dark)
  Layout.ts                spacing/radius 스케일
  Fonts.ts                 폰트 패밀리 상수
  HabitOptions.ts          아이콘/카테고리/개수 제한 단계 사전 정의값
components/               테마 적용 Text/View, 체크 애니메이션, 통계 차트 등 공통 컴포넌트
assets/fonts/              배민 한나체 Pro · 온글잎 박다현체 · Pretendard
```

각 화면 파일 상단 주석에 관련 PRD 절 번호를 남겨뒀습니다.

## 디자인

- 톤: 파스텔(민트/라벤더/살구/크림) + 손그림 느낌, 다크모드 지원(저채도 팔레트)
- PRD.md에 명시된 값이 우선이며, 스페이싱/라운드 등 세부 값은 DESIGN.md 토큰을 참고해 이식했습니다.
- 폰트는 [눈누](https://noonnu.cc)에서 상업적 이용이 가능한 배민 한나체 Pro, 온글잎 박다현체를 사용합니다.

## 현재 상태

PRD.md 6절에 명시된 MVP 기능이 모두 구현되어 있습니다.

- **6-1 습관 등록/관리**: 이름/아이콘/카테고리/메모, 반복 주기, 단계별 개수 제한, 그만두기(보관)·완전 삭제 2단계 구조
- **6-2 오늘 습관 체크**: 토글 체크 + 체크 애니메이션, 진행률 프로그레스 바, 체크 완료 시 인증 기록 선택 팝업
- **6-3 캘린더/히스토리**: 월별 그리드 + 리스트(타임라인) 뷰 전환, 습관별 필터링, 지난 기록 수정("수정됨" 표시)
- **6-4 알림/리마인더**: 습관별 개별 알림 시간, 미완료 리마인더, 전체/개별 on-off
- **6-5 통계**: 도넛(전체 평균) + 막대(습관별·요일별) + 히트맵(누적 기록), 주간/월간/전체 기간 선택
- **6-6 인증 기록**: 사진(갤러리/카메라) + 텍스트 메모, 캘린더 상세·리스트 뷰에서 조회

PRD "향후 고려사항"(스트릭, 인증 기록 갤러리, 백업/복원, 다국어 등)은 의도적으로 MVP 범위 밖입니다.
