GitHub Pages 배포

1. GitHub에서 공개 저장소를 만들고, 이 프로젝트를 main 브랜치에 올립니다. `.github/workflows/pages.yml`, `scripts`, `data` 폴더도 포함합니다.
2. `.admin-auth.json`, `.env`, `.image-moderation.json`, `_site`는 올리지 않습니다. Git으로 올리면 .gitignore가 제외하지만, 웹에서 수동 업로드할 때는 직접 제외해야 합니다.
3. 저장소 Settings → Pages → Build and deployment → Source를 GitHub Actions로 선택합니다.
4. Actions → Collect and publish → Run workflow로 실행합니다. 완료 후 Settings → Pages에 접속 주소가 표시됩니다.

매시 17분·47분에 세 X 계정과 세 YouTube 채널을 조회합니다. 사진 주소와 게시물 정보는 data/photos.json에 중복 없이 누적됩니다. 사진 파일 자체를 저장하지 않으므로 원본이 삭제되면 사진이 표시되지 않을 수 있습니다. 영상은 각 채널 피드에서 제공하는 최신 항목을 반영합니다.

방문자는 공용 JSON 목록을 읽으며, 사진 목록은 페이지를 열어둔 동안 5분마다, 영상 목록은 15분마다 다시 읽습니다. 실제 새 게시물 수집은 GitHub Actions 실행 시 이루어집니다. 예약 실행은 지연되거나 실패할 수 있고, 공개 저장소에 60일 동안 활동이 없으면 예약 작업이 중지될 수 있습니다. Actions 실행 결과를 확인하세요.

GitHub Pages는 정적 호스팅이므로 관리자 로그인과 서버 숨김·복원 기능은 배포판에서 제공하지 않습니다. 로컬 npm start 서버의 관리자 기능은 그대로 유지합니다. 로컬 숨김 상태는 이 공개 목록에 자동 반영되지 않습니다.

배포 파일은 scripts/build-pages.mjs가 허용 목록에 있는 파일만 _site 폴더로 복사합니다. 서버 코드, 관리자 계정 해시, 설정 파일은 배포하지 않습니다.

설린 Objekt도 data/objekts.json에 저장됩니다. teamreflex/cosmo-web의 데이터 구조를 참고해 Apollo 공개 설린 인덱스(https://apollo.cafe/?member=Sullin&artist=tripleS)에서 최신 60종의 앞면 이미지를 읽습니다. 매 수집 시 기존 목록과 합칩니다. 전체 361종 등의 과거 목록을 모두 수집한 것은 아닙니다. 로그인이나 비공개 COSMO API는 사용하지 않습니다. 원본 카드 이미지는 COSMO CDN에서 표시하고 클릭 시 Apollo의 해당 Objekt로 연결합니다. 공개 페이지 구조 변경 시 수집이 실패할 수 있으며 이전 데이터는 보존합니다.
