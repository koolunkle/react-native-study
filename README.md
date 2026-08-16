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
| 사진 인증 | [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) |
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
  _layout.tsx           루트 스택 + SQLiteProvider(DB 초기화) + 폰트 로딩 + 다크모드 테마
  (tabs)/                하단 탭: 홈 · 캘린더 · 통계 · 설정
  habit/new.tsx           습관 등록 (모달)
  habit/[id]/edit.tsx      습관 수정
  calendar/[date].tsx      캘린더 날짜별 상세
db/
  schema.ts               SQLite 테이블 정의 (habits, habit_logs)
  client.ts                SQLiteProvider용 마이그레이션 함수
constants/
  Colors.ts                파스텔 팔레트 (light/dark)
  Layout.ts                 spacing/radius 스케일
  Fonts.ts                   폰트 패밀리 상수
components/               테마 적용 Text/View 등 공통 컴포넌트
assets/fonts/              배민 한나체 Pro · 온글잎 박다현체 · Pretendard
```

각 화면 파일 상단 주석에 관련 PRD 절 번호와 TODO를 남겨뒀습니다 — 아직 UI 뼈대만 있고 기능은 구현 전입니다.

## 디자인

- 톤: 파스텔(민트/라벤더/살구/크림) + 손그림 느낌, 다크모드 지원(저채도 팔레트)
- PRD.md에 명시된 값이 우선이며, 스페이싱/라운드 등 세부 값은 DESIGN.md 토큰을 참고해 이식했습니다.
- 폰트는 [눈누](https://noonnu.cc)에서 상업적 이용이 가능한 배민 한나체 Pro, 온글잎 박다현체를 사용합니다.

## 현재 상태

초기 프로젝트 구조 단계입니다. 4개 탭과 습관 등록/캘린더 상세 스택 라우팅, SQLite 스키마, 테마/폰트가 구성되어 있으며, 화면별 실제 기능(체크, 인증 기록, 통계 시각화 등)은 PRD.md 6절 명세에 따라 구현 예정입니다.
