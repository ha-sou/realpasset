---
description: REAL.P 프로젝트를 GitHub에 Push하고 Netlify에 배포하는 방법
---

# 배포 워크플로우

## 전제조건
- 프로젝트 경로: `D:\realp`
- Git 로컬 브랜치: `master`
- Git 원격 브랜치: `main`
- GitHub 리포: `https://github.com/ha-sou/realpasset.git`
- Netlify: GitHub 연동 자동 배포

## 배포 단계

1. 모든 변경사항 스테이징
```bash
git add -A
```

2. 커밋 (PowerShell에서는 && 사용 불가, 명령을 분리해서 실행)
```bash
git commit -m "커밋 메시지"
```

3. Push (master → main 브랜치 매핑)
```bash
git push origin master:main
```

4. Netlify가 자동으로 빌드 및 배포 (약 30~60초 소요)

5. 배포 확인: https://realpasset.netlify.app

## Git 설정
- email: jju9120@naver.com
- name: hahahasou

## 주의사항
- **Push는 사용자가 요청할 때만 실행**
- PowerShell에서 `&&` 연산자 사용 불가 → 명령어를 분리해서 실행
- `skip_processing = true` 설정으로 Netlify 에셋 처리 비활성화됨
