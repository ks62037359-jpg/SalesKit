# Marketing and Sales Agent Patterns

공개 GitHub의 마케팅/영업 에이전트 자료에서 SalesKit AI에 적용할 수 있는 패턴을 정리합니다.

## 1. 역할 분리

하나의 AI에게 모든 일을 맡기기보다 역할을 나누는 것이 좋다.

SalesKit 적용:

- URL Analyst: 업체 URL과 공개 정보를 분석
- Sales Copywriter: 제안형 콜드메일 작성
- AI Editor: 사용자의 수정 요청 반영
- HTML Formatter: 메일 클라이언트 호환 HTML로 변환

## 2. 영업 단계 인식

SalesGPT류 자료에서 중요한 점은 대화 단계에 따라 다른 행동을 한다는 것이다.

SalesKit 적용:

- 첫 접촉
- 후속 연락
- 미팅 확정
- 제안서 전달
- 재접촉

현재 MVP는 "첫 접촉"과 "후속 연락"에 집중한다.

## 3. 개인화와 변수

콜드메일 자동화 도구들은 변수 기반 템플릿을 많이 사용한다.

SalesKit 적용 후보:

```text
{{company}}
{{recipient}}
{{industry}}
{{offer}}
{{cta}}
{{sender_name}}
{{sender_phone}}
```

## 4. Deliverability는 나중 단계

발송 자동화 도구들은 deliverability, warmup, inbox placement를 중요하게 본다.

하지만 SalesKit MVP는 발송 도구가 아니므로 지금은 아래에 집중한다.

- 본문 품질
- 붙여넣기 호환성
- 수정 UX
- 답장 유도 문장

발송 자동화는 나중에 붙인다.

## 5. 마케팅 스킬 분리

marketingskills류 자료에서 유용한 분류:

- cold-email
- copy-editing
- ai-seo
- competitor-profiling
- co-marketing

SalesKit MVP 적용:

- cold-email: 기본 생성 엔진
- copy-editing: AI 수정 요청
- competitor-profiling: 추후 URL 분석 고도화

## 6. 제안서 기능은 후순위

Proposal Strategist 계열 기능은 유용하지만 MVP에 넣으면 범위가 커진다.

현재 우선순위:

1. 영업용 메일 생성
2. 사용자가 직접 수정
3. AI 편집
4. 메일 플랫폼 붙여넣기
5. 생성 이력 저장

PPT 제안서는 메일 생성이 검증된 뒤 Pro 기능으로 확장한다.

