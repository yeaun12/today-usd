# 하루의 환율 — Vercel 이전판

파란 카드 디자인, ExchangeRate-API 일일 환율, 실제 기록과 오류 실험실을 유지한 Next.js 프로젝트입니다. 기존 서비스는 변경하지 않았습니다.

## 1. DB 준비 (Turso)

https://turso.tech 에 가입하고 **libSQL 데이터베이스**를 만드세요. 이 프로젝트는 `@libsql/client`를 사용합니다. 데이터베이스의 URL(libsql://...)과 인증 토큰을 발급받으세요. 토큰은 GitHub나 채팅에 올리지 마세요.

DB SQL 콘솔에서 `migration/import.sql` 파일 내용을 실행하세요. 테이블 생성과 백업 기록 3건 가져오기가 함께 들어 있습니다. 같은 SQL을 다시 실행해도 기존 같은 날짜 기록을 덮어쓰지 않습니다.

콘솔을 사용할 수 없다면 Node.js 22 이상인 PC에서 프로젝트 폴더를 열고 다음을 실행하세요.

```sh
npm ci
```

`.env.example`을 `.env.local`로 복사하고 DB URL과 토큰을 입력한 후:

```sh
npm run db:import
```

백업은 2026-09-16, 09-17, 09-20의 원자료·저장값·조회 시각을 보존합니다. 이 날짜를 새로운 조회 날짜로 바꾸지 않습니다. 사이트를 새로 열면 현재 한국 날짜의 기록이 추가될 수 있습니다.

## 2. GitHub에 소스 업로드

새 **공개 저장소**를 만드세요. 압축 해제한 프로젝트 폴더 안의 파일과 폴더를 모두 올리세요. 저장소 첫 화면에 `package.json`, `app`, `lib`, `migration`이 보여야 합니다. ZIP 자체를 올리는 방식은 아닙니다.

`.gitignore`도 포함하세요. `.env.local`, `node_modules`, `.next`는 절대 올리지 마세요. ZIP에는 이 항목들이 포함되지 않습니다. 백업은 공개 환율 데이터만 담고 있습니다.

## 3. Vercel 연결

Vercel에서 Add New → Project → 해당 GitHub 저장소 Import를 선택하세요.

- Framework Preset: Next.js
- Root Directory: package.json이 있는 위치 (위처럼 올렸으면 기본값)
- Node.js: 22.x 또는 지원되는 상위 버전
- Build Command: npm run build
- Install Command: npm ci
- Output Directory: 기본값

Environment Variables에 다음 값을 추가하세요.

| 이름 | 값 |
|---|---|
| TURSO_DATABASE_URL | 발급받은 libsql://... 주소 |
| TURSO_AUTH_TOKEN | 발급받은 인증 토큰 |
| SOURCE_COMMIT_URL | 아래에서 설명하는 GitHub 전체 커밋 주소 |

GitHub 저장소의 커밋 목록에서 최신 커밋을 클릭하고 주소를 복사하세요. `https://github.com/사용자/저장소/commit/40자리해시` 형태입니다. SOURCE_COMMIT_URL은 소스 안내 링크에 사용합니다. 이후 코드를 변경했다면 새 커밋 주소로 바꾸고 재배포하세요.

Deploy를 누르세요. 환경변수를 나중에 바꿨다면 Redeploy가 필요합니다.

## 4. 제출 전 확인

1. Vercel 사이트에서 기존 3일 기록과 원자료·저장값 상세가 보이는지 확인합니다.
2. 환율 새로 확인을 누르고 값·단위·출처·출처 시각·조회 시각·한국 시간대를 확인합니다. 제공처 갱신 전에는 값이 같을 수 있습니다.
3. 오류·복구 실험실의 9개 시나리오 검사와 개별 실패/복구 동작을 확인합니다.
4. 새 시크릿 창에서 Vercel 결과 URL과 GitHub 커밋 URL이 로그인 없이 열리는지 확인합니다. Vercel의 Deployment Protection으로 로그인 화면이 뜨면 공개 제출에 사용할 Production 배포의 보호 설정을 확인하세요.

제출 폼의 결과물 URL에는 Vercel 사이트 주소, 소스 저장소 URL에는 **40자리 전체 커밋 URL**을 넣습니다. GitHub 저장소 첫 화면 주소로 대체하지 마세요. 이 이전 작업만으로 과제 전체 기준을 통과했다고 단정하지는 않습니다.

## 이전 내용과 검증 범위

원본 기준 커밋: `a018ffa2b58c95f3eb040991626adeefb9085b22`.
Cloudflare 전용 DB 연결을 Turso 연결로 교체했습니다. 실제 일별 저장/업데이트 SQL과 일일 API 캐시 정책은 유지했습니다. 기존 source_cache는 가져오지 않으므로 새 배포의 첫 조회는 제공처에 요청합니다.

조회 기록은 `migration/readings-backup.json`, SQL 가져오기는 `migration/import.sql`입니다. 원본 서비스 DB를 수정하지 않았습니다. `npm test`는 임시 SQLite DB에서 원자료/정규화 기록의 정확한 복원과 반복 가져오기 시 기존 데이터 보존을 검사합니다. 실제 Turso 계정 연결과 Vercel 배포는 사용자가 환경변수를 설정한 뒤 확인해야 합니다.

로컬 개발: `npm run dev`. 배포 빌드 확인: `npm run build`.

공식 문서: https://vercel.com/docs/frameworks/full-stack/nextjs · https://docs.turso.tech/sdk/ts/reference

배포확인용
