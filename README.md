# 키다리샘 점검표

기초학력 보충 프로그램(키다리샘) 지도일지를 점검하는 웹 애플리케이션입니다.

## 기능

- 📄 **지도일지 분석**: HWP, HWPX, PDF 파일 지원 (Upstage Document Parse API)
- 📅 **일정 충돌 확인**: 근무상황/출장 목록과 비교
- ⏱️ **시간 점검**: 40분 미만 수업, 연차시 80분 미만 체크
- 📥 **PDF 리포트**: 점검 결과 PDF 다운로드

## 로컬 실행

```bash
npm install
npm run dev
```

## Vercel 배포

1. Vercel에 프로젝트 연결
2. 환경 변수 설정:
   - `UPSTAGE_API_KEY`: Upstage API 키

```bash
vercel
```

## 환경 변수

| 변수명 | 설명 |
|--------|------|
| `UPSTAGE_API_KEY` | Upstage API 키 |

## 기술 스택

- React + Vite
- Upstage Document Parse API
- Upstage Solar Pro2
- SheetJS (Excel 파싱)
- jsPDF (PDF 생성)
"# kidari-checker" 
