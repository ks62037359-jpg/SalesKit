# Source Index

SalesKit AI 제작에 참고할 만한 공개 GitHub Markdown 자료입니다. 원문을 그대로 복사하지 않고, 제품 설계에 필요한 관찰과 적용 포인트만 정리했습니다.

## Email HTML / Template

### ColorlibHQ/email-templates

- URL: https://github.com/ColorlibHQ/email-templates
- 핵심 포인트:
  - 이메일 클라이언트 호환성을 고려한 HTML 템플릿 모음
  - 버튼/CTA는 table 기반 구조가 안전함
  - CSS inlining과 실제 메일 클라이언트 테스트가 중요함
- SalesKit 적용:
  - 생성 HTML은 외부 CSS 없이 inline style 중심으로 유지
  - 이미지 없이도 읽히는 구조를 우선
  - 복사 결과는 Gmail, 네이버메일, 다음메일 작성창 붙여넣기를 기준으로 테스트

## Cold Email / Outreach Automation

### PaulleDemon/Email-automation

- URL: https://github.com/PaulleDemon/Email-automation
- 핵심 포인트:
  - 변수 기반 이메일 템플릿
  - 후속메일과 발송 규칙
  - Gmail/Yahoo 같은 개인 메일 자동화 사용 시 제약과 리스크 언급
- SalesKit 적용:
  - 발송 자동화보다 "작성 도구"로 먼저 포지셔닝
  - `{{company}}`, `{{recipient}}`, `{{offer}}` 같은 변수 치환 구조를 나중에 추가
  - 후속메일은 1차 MVP부터 유지

### bcharleson/instantly-cli

- URL: https://github.com/bcharleson/instantly-cli
- 핵심 포인트:
  - 캠페인, 리드, 이메일 템플릿, deliverability를 분리된 객체로 관리
  - AI 프롬프트 템플릿과 이메일 템플릿을 별도 관리
- SalesKit 적용:
  - "메일 생성"과 "템플릿 관리"를 분리
  - 추후 생성 이력, 템플릿 저장, 후속메일 버전을 따로 관리

## Sales / SDR Agents

### filip-michalsky/SalesGPT

- URL: https://github.com/filip-michalsky/SalesGPT
- 핵심 포인트:
  - 영업 대화 단계에 따라 다른 행동을 하는 context-aware sales agent
  - 제품 지식 기반을 통해 환각을 줄이는 방향
- SalesKit 적용:
  - 콜드메일 생성 시 "현재 영업 단계" 필드를 추가할 수 있음
  - 제품/서비스 설명을 knowledge block으로 저장해 재사용

### brightdata/ai-sdr-bdr-agent

- URL: https://github.com/brightdata/ai-sdr-bdr-agent
- 핵심 포인트:
  - 회사 탐색, 트리거 탐지, 연락처 조사, 메시지 생성, 파이프라인 관리를 에이전트로 분리
- SalesKit 적용:
  - 지금은 메시지 생성만 MVP로 유지
  - 이후 URL 분석, 구매 신호 탐지, 리드 스코어링을 별도 모듈로 확장

## Marketing / GTM Agent Markdown

### msitarzewski/agency-agents

- URL: https://github.com/msitarzewski/agency-agents
- 핵심 포인트:
  - Outbound Strategist, Proposal Strategist, Sales Outreach 등 역할 기반 에이전트 구분
  - 마케팅, 세일즈, 제안서 작성 역할을 분리
- SalesKit 적용:
  - 하나의 AI가 모든 걸 처리하기보다 "URL 분석가", "메일 카피라이터", "편집자" 역할로 프롬프트를 나눌 수 있음

### gtmagents/gtm-agents

- URL: https://github.com/gtmagents/gtm-agents
- 핵심 포인트:
  - GTM, sales, marketing, revenue operations 관련 에이전트/스킬을 Markdown으로 관리
  - `agents`, `commands`, `skills`로 역할을 나눔
- SalesKit 적용:
  - SalesKit 내부 프롬프트도 `agents`, `templates`, `rules`로 분리해 관리

### coreyhaines31/marketingskills

- URL: https://github.com/coreyhaines31/marketingskills
- 핵심 포인트:
  - cold-email, copy-editing, ai-seo, competitor-profiling 등 마케팅 스킬 구분
- SalesKit 적용:
  - MVP 스킬은 cold-email, copy-editing, competitor/URL profiling 세 가지에 집중

