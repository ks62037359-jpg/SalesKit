const templates = {
  problem: {
    name: "문제제기형",
    description: "상대가 놓치고 있을 리스크와 기회를 먼저 짚고 대화를 여는 구조입니다.",
    points: ["발신 배경", "진단 결과", "핵심 솔루션", "기대 효과", "미팅 제안"],
    subject: (company) => `[${company}] 검색 노출 구조 진단 및 개선 제안`,
  },
  diagnosis: {
    name: "진단 리포트형",
    description: "점수, 관찰, 개선 방향을 리포트처럼 제시해 전문성을 만드는 구조입니다.",
    points: ["발신 배경", "진단 결과", "핵심 솔루션", "기대 효과", "미팅 제안"],
    subject: (company) => `[${company}] 사전 진단 결과 기반 제안드립니다`,
  },
  partnership: {
    name: "제휴 제안형",
    description: "상호 이익과 작은 테스트를 앞세워 부담 없는 첫 접점을 만드는 구조입니다.",
    points: ["발신 배경", "협업 가능성", "핵심 제안", "기대 효과", "미팅 제안"],
    subject: (company) => `[${company}] 협업 가능성 관련 짧은 제안`,
  },
  short: {
    name: "대표자용 요약형",
    description: "바쁜 의사결정권자에게 인사·핵심 제안·CTA를 세 줄로 전달하는 구조입니다.",
    points: ["인사", "핵심 제안", "CTA", "명함"],
    subject: (company) => `[${company}] 대표님께 짧은 개선 제안드립니다`,
  },
  consulting: {
    name: "컨설팅 제안형",
    description: "문제 정의부터 실행 지원까지 연결해 고가 제안에 어울리는 구조입니다.",
    points: ["발신 배경", "진단 결과", "실행 방향", "기대 효과", "미팅 제안"],
    subject: (company) => `[${company}] 맞춤 개선 방향 및 실행 지원 제안`,
  },
};

const state = {
  emailHtml: "",
  plain: "",
  followup: "",
};

const bannedPhrases = ["성과 보장", "무조건", "최저가", "100% 개선", "반드시 1위"];

const IS_LOCAL = ["localhost", "127.0.0.1"].includes(location.hostname);

const SENDER_STORAGE_KEY = "saleskit-sender";
const SENDER_FIELDS = ["sender-name", "sender-company", "sender-phone", "sender-email", "sender-extra"];

function saveSenderInfo() {
  const info = {};
  SENDER_FIELDS.forEach((id) => { info[id] = $(`#${id}`)?.value || ""; });
  localStorage.setItem(SENDER_STORAGE_KEY, JSON.stringify(info));
}

function loadSenderInfo() {
  try {
    const saved = JSON.parse(localStorage.getItem(SENDER_STORAGE_KEY) || "null");
    if (!saved) return;
    SENDER_FIELDS.forEach((id) => {
      const el = $(`#${id}`);
      if (el && saved[id] != null) el.value = saved[id];
    });
  } catch {
    // Ignore parse errors.
  }
}

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function valueOf(selector, fallback = "") {
  return $(selector)?.value?.trim() || fallback;
}

function parseCompanyName(urlValue) {
  try {
    const host = new URL(urlValue).hostname.replace(/^www\./, "");
    const name = host.split(".")[0] || "업체명";
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  } catch {
    return "업체명";
  }
}

function inferIndustry(offer) {
  const value = offer.toLowerCase();
  if (value.includes("채용") || value.includes("hr")) return "채용/HR";
  if (value.includes("홈페이지") || value.includes("웹")) return "웹사이트/디지털 전환";
  if (value.includes("crm") || value.includes("saas")) return "B2B SaaS";
  if (value.includes("광고") || value.includes("검색") || value.includes("마케팅")) return "검색/마케팅";
  if (value.includes("영상") || value.includes("콘텐츠")) return "콘텐츠 제작";
  return "B2B 서비스";
}

function objectParticle(text) {
  const last = [...text.trim()].pop();
  if (!last) return "를";
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return "를";
  return (code - 0xac00) % 28 === 0 ? "를" : "을";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getFormData() {
  const recipient = valueOf("#recipient", "담당자");
  const data = {
    url: valueOf("#target-url", "https://example.co.kr"),
    offer: valueOf("#offer", "B2B 영업팀을 위한 CRM 자동화 솔루션"),
    recipient: recipient === "직접 입력" ? valueOf("#custom-recipient", "담당자") : recipient,
    tone: valueOf("#tone", "정중한"),
    templateId: valueOf("#template", "problem"),
    cta: valueOf("#cta", "15분 미팅 제안"),
    avoid: valueOf("#avoid", "성과 보장, 최저가, 무조건"),
    salesStage: valueOf("#sales-stage", "첫 접촉"),
    persona: valueOf("#persona", "의사결정권자"),
    senderName: valueOf("#sender-name", "박경섭 대리"),
    senderCompany: valueOf("#sender-company", "프로그레스미디어 | AE"),
    senderPhone: valueOf("#sender-phone", "02-851-8922 | 010-2974-6203"),
    senderEmail: valueOf("#sender-email", "pks1130@progress-media.co.kr"),
    senderExtra: valueOf("#sender-extra", "서울 구로구 디지털로26길 43"),
  };
  data.company = parseCompanyName(data.url);
  data.industry = inferIndustry(data.offer);
  return data;
}

function buildProposal(data, template) {
  return {
    title: template.subject(data.company, data.offer),
    contents: ["01 발신 배경", "02 진단 결과", "03 핵심 솔루션", "04 기대 효과", "05 미팅 제안"],
    intro: [
      `안녕하세요, ${data.recipient}님.`,
      `${data.company}의 공개된 웹사이트와 제안 가능 포인트를 기준으로 간단히 살펴본 결과, 공유드릴 만한 개선 방향이 있어 연락드립니다.`,
      `이번 메일은 ${data.offer} 관점에서 ${data.salesStage} 단계에 맞춰 바로 확인하실 수 있도록 핵심만 목차 형태로 정리했습니다.`,
    ],
    sections: [
      {
        no: "01",
        title: "발신 배경",
        body: [
          "최근 B2B 영업에서는 단순한 소개 메일보다, 상대 업체의 현재 상황을 반영한 맞춤형 제안이 더 중요해지고 있습니다.",
          `${data.company} 역시 ${data.industry} 관점에서 ${data.persona}가 확인할 메시지, 신뢰 요소, 후속 전환 흐름을 더 선명하게 만들 여지가 있어 보였습니다.`,
        ],
      },
      {
        no: "02",
        title: "진단 결과",
        body: [
          `사전 진단 기준: ${data.url || "타깃 URL"}`,
          `관찰된 개선 여지: ${data.company}의 웹사이트에서 ${data.persona}가 확인할 핵심 메시지 구조와 다음 행동 유도 포인트가 더 정리되면 좋을 것으로 보입니다.`,
        ],
      },
      {
        no: "03",
        title: "핵심 솔루션",
        body: [
          `${data.offer}${objectParticle(data.offer)} 활용해 문제 정의 → 제안 메시지 정리 → 후속 연락까지 하나의 흐름으로 구성하는 방향을 제안드립니다.`,
          "처음부터 큰 도입보다, 특정 고객군이나 캠페인 한 가지를 기준으로 작은 테스트를 진행하면 부담 없이 효과를 확인할 수 있습니다.",
        ],
      },
      {
        no: "04",
        title: "기대 효과",
        body: [
          "반복적인 영업 준비 시간을 줄이고, 타깃 업체별로 다른 제안 논리를 빠르게 만들 수 있습니다.",
          "영업 담당자는 자료 작성보다 실제 대화와 전환 관리에 더 많은 시간을 쓸 수 있습니다.",
        ],
      },
      {
        no: "05",
        title: "미팅 제안",
        body: [
          `${data.cta} 형태로 짧게 이야기 나누고, ${data.company}에 적용 가능한 방향을 공유드리고 싶습니다.`,
          "편하신 일정 회신 주시면 맞춰서 간단히 설명드리겠습니다.",
        ],
      },
    ],
  };
}

async function postJson(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "API 요청에 실패했습니다.");
  }
  return response.json();
}

function buildContentsHtml(contents) {
  return contents
    .map(
      (item) => `
        <tr>
          <td style="padding:5px 0;font-family:Arial,'Malgun Gothic',sans-serif;font-size:14px;line-height:1.5;color:#33413d;">
            ${escapeHtml(item)}
          </td>
        </tr>`
    )
    .join("");
}

function buildIntroHtml(intro) {
  return intro
    .map(
      (line) => `
        <tr>
          <td style="padding:0 0 12px 0;font-family:Arial,'Malgun Gothic',sans-serif;font-size:15px;line-height:1.7;color:#22312c;">
            ${escapeHtml(line)}
          </td>
        </tr>`
    )
    .join("");
}

function buildSectionsHtml(sections) {
  return sections
    .map(
      (section) => `
        <tr>
          <td style="padding:20px 0 0 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
              <tr>
                <td style="width:44px;vertical-align:top;padding:0 12px 0 0;font-family:Arial,'Malgun Gothic',sans-serif;font-size:20px;line-height:1.2;font-weight:bold;color:#0f7b68;">${escapeHtml(section.no)}</td>
                <td style="vertical-align:top;padding:0 0 8px 0;font-family:Arial,'Malgun Gothic',sans-serif;font-size:18px;line-height:1.35;font-weight:bold;color:#17352e;">${escapeHtml(section.title)}</td>
              </tr>
              ${section.body
                .map(
                  (line) => `
                    <tr>
                      <td></td>
                      <td style="padding:0 0 9px 0;font-family:Arial,'Malgun Gothic',sans-serif;font-size:14px;line-height:1.7;color:#33413d;">${escapeHtml(line)}</td>
                    </tr>`
                )
                .join("")}
            </table>
          </td>
        </tr>`
    )
    .join("");
}

function buildSignatureHtml(data) {
  return `
    <tr>
      <td style="padding:22px 0 0 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border-top:1px solid #d8e0dc;">
          <tr>
            <td style="padding:18px 0 0 0;font-family:Arial,'Malgun Gothic',sans-serif;color:#22312c;">
              <div style="font-size:16px;line-height:1.4;font-weight:bold;color:#17352e;">${escapeHtml(data.senderName)}</div>
              <div style="padding-top:3px;font-size:13px;line-height:1.5;color:#586762;">${escapeHtml(data.senderCompany)}</div>
              <div style="padding-top:10px;font-size:13px;line-height:1.6;color:#33413d;">t ${escapeHtml(data.senderPhone)}</div>
              <div style="font-size:13px;line-height:1.6;color:#33413d;">e ${escapeHtml(data.senderEmail)}</div>
              <div style="padding-top:8px;font-size:12px;line-height:1.6;color:#66736e;">${escapeHtml(data.senderExtra)}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function buildShortEmailHtml(data, template) {
  const greeting = `안녕하세요, ${data.recipient}님. ${data.senderName}입니다.`;
  const pitch = `${data.company}에 ${data.offer}${objectParticle(data.offer)} 적용해 ${data.persona}가 바로 확인할 수 있는 개선 포인트가 있어 짧게 공유드립니다.`;
  const ctaLine = `${data.cta} 가능하신지 짧게 회신 부탁드립니다.`;
  const title = template.subject(data.company, data.offer);
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:#f4f7f5;margin:0;padding:0;">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;max-width:660px;background-color:#ffffff;border:1px solid #d8e0dc;">
        <tr>
          <td style="padding:22px 24px;background-color:#17352e;font-family:Arial,'Malgun Gothic',sans-serif;color:#ffffff;">
            <div style="font-size:12px;line-height:1.4;font-weight:bold;color:#b9d8cf;">Sales Proposal</div>
            <div style="padding-top:8px;font-size:22px;line-height:1.35;font-weight:bold;color:#ffffff;">${escapeHtml(title)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
              <tr>
                <td style="padding:0 0 14px 0;font-family:Arial,'Malgun Gothic',sans-serif;font-size:15px;line-height:1.7;color:#22312c;">${escapeHtml(greeting)}</td>
              </tr>
              <tr>
                <td style="padding:0 0 14px 0;font-family:Arial,'Malgun Gothic',sans-serif;font-size:15px;line-height:1.7;color:#22312c;">${escapeHtml(pitch)}</td>
              </tr>
              <tr>
                <td style="padding:0 0 0 0;font-family:Arial,'Malgun Gothic',sans-serif;font-size:15px;line-height:1.7;color:#0f7b68;font-weight:bold;">${escapeHtml(ctaLine)}</td>
              </tr>
              ${buildSignatureHtml(data)}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
}

function buildShortPlainText(data, template) {
  const greeting = `안녕하세요, ${data.recipient}님. ${data.senderName}입니다.`;
  const pitch = `${data.company}에 ${data.offer}${objectParticle(data.offer)} 적용해 ${data.persona}가 바로 확인할 수 있는 개선 포인트가 있어 짧게 공유드립니다.`;
  const ctaLine = `${data.cta} 가능하신지 짧게 회신 부탁드립니다.`;
  const title = template.subject(data.company, data.offer);
  return [
    `[제목] ${title}`,
    "",
    greeting,
    "",
    pitch,
    "",
    ctaLine,
    "",
    "감사합니다.",
    "",
    `${data.senderName} ${data.senderCompany}`,
    `t ${data.senderPhone}`,
    `e ${data.senderEmail}`,
    data.senderExtra,
  ].join("\n");
}

function buildEmailHtml(proposal, data) {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:#f4f7f5;margin:0;padding:0;">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;max-width:660px;background-color:#ffffff;border:1px solid #d8e0dc;">
        <tr>
          <td style="padding:22px 24px;background-color:#17352e;font-family:Arial,'Malgun Gothic',sans-serif;color:#ffffff;">
            <div style="font-size:12px;line-height:1.4;font-weight:bold;color:#b9d8cf;">Sales Proposal</div>
            <div style="padding-top:8px;font-size:22px;line-height:1.35;font-weight:bold;color:#ffffff;">${escapeHtml(proposal.title)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;background-color:#ffffff;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
              ${buildIntroHtml(proposal.intro)}
              <tr>
                <td style="padding:14px 16px;background-color:#eef7f4;border-left:4px solid #0f7b68;">
                  <div style="font-family:Arial,'Malgun Gothic',sans-serif;font-size:13px;line-height:1.5;font-weight:bold;color:#0f5f51;">목차</div>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-top:6px;">
                    ${buildContentsHtml(proposal.contents)}
                  </table>
                </td>
              </tr>
              ${buildSectionsHtml(proposal.sections)}
              ${buildSignatureHtml(data)}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
}

function buildPlainText(proposal, data) {
  return [
    `[제목] ${proposal.title}`,
    "",
    ...proposal.intro,
    "",
    "목차",
    ...proposal.contents,
    "",
    ...proposal.sections.flatMap((section) => [
      `${section.no} ${section.title}`,
      ...section.body.map((line) => `- ${line}`),
      "",
    ]),
    "감사합니다.",
    "",
    `${data.senderName} ${data.senderCompany}`,
    `t ${data.senderPhone}`,
    `e ${data.senderEmail}`,
    data.senderExtra,
  ].join("\n");
}

function currentEmailHtml() {
  return $("#html-result").innerHTML.trim() || state.emailHtml;
}

function htmlToPlainText(html) {
  const scratch = document.createElement("div");
  scratch.innerHTML = html;
  return scratch.innerText.replace(/\n{3,}/g, "\n\n").trim();
}

function renderProposal(proposal, data, template, toastMessage) {
  state.emailHtml = buildEmailHtml(proposal, data);
  state.plain = buildPlainText(proposal, data);
  state.followup =
    proposal.followup ||
    [
      `[후속메일 제목] ${data.company} 관련 제안, 짧게 다시 공유드립니다`,
      "",
      `${data.recipient}님, 안녕하세요.`,
      "며칠 전 공유드린 제안이 바쁘신 일정 중 묻혔을 것 같아 한 번만 더 연락드립니다.",
      `${data.company}에는 ${data.offer}를 바로 크게 도입하기보다, 작은 범위에서 먼저 검증하는 방식이 적합하다고 봤습니다.`,
      `가능하시다면 ${data.cta} 가능 여부만 짧게 회신 부탁드립니다.`,
      "",
      `${data.senderName} ${data.senderCompany}`,
      `t ${data.senderPhone}`,
      `e ${data.senderEmail}`,
    ].join("\n");

  $("#html-result").innerHTML = state.emailHtml;
  $("#plain-result").textContent = state.plain;
  $("#followup-result").textContent = state.followup;
  renderInsights(data, template);
  renderSafetyPanel();
  renderDraftList();
  if (toastMessage) showToast(toastMessage);
}

function renderShortMail(data, template, toastMessage) {
  state.emailHtml = buildShortEmailHtml(data, template);
  state.plain = buildShortPlainText(data, template);
  state.followup = [
    `[후속메일 제목] ${data.company} 관련 제안, 짧게 다시 공유드립니다`,
    "",
    `${data.recipient}님, 안녕하세요.`,
    "며칠 전 공유드린 제안이 바쁘신 일정 중 묻혔을 것 같아 한 번만 더 연락드립니다.",
    `${data.company}에는 ${data.offer}를 바로 크게 도입하기보다, 작은 범위에서 먼저 검증하는 방식이 적합하다고 봤습니다.`,
    `가능하시다면 ${data.cta} 가능 여부만 짧게 회신 부탁드립니다.`,
    "",
    `${data.senderName} ${data.senderCompany}`,
    `t ${data.senderPhone}`,
    `e ${data.senderEmail}`,
  ].join("\n");
  $("#html-result").innerHTML = state.emailHtml;
  $("#plain-result").textContent = state.plain;
  $("#followup-result").textContent = state.followup;
  renderInsights(data, template);
  renderSafetyPanel();
  renderDraftList();
  if (toastMessage) showToast(toastMessage);
}

async function buildMail(options = {}) {
  const data = getFormData();
  const template = templates[data.templateId] || templates.problem;
  if (!options.localOnly && IS_LOCAL) {
    try {
      const proposal = await postJson("/api/generate-mail", {
        ...data,
        templateName: template.name,
        structure: template.points,
        agentRoles: ["URL Analyst", "Sales Copywriter", "Email HTML Formatter"],
      });
      renderProposal(proposal, data, template, "OpenAI로 제안 메일을 생성했습니다.");
      return;
    } catch (error) {
      console.warn(error);
    }
  }
  if (data.templateId === "short") {
    renderShortMail(data, template, options.silent ? "" : "로컬 규칙 기반으로 요약 메일을 생성했습니다.");
    return;
  }
  renderProposal(buildProposal(data, template), data, template, options.silent ? "" : "로컬 규칙 기반으로 제안 메일을 생성했습니다.");
}

function setEditMode(enabled) {
  const preview = $("#html-result");
  preview.contentEditable = enabled ? "true" : "false";
  preview.classList.toggle("editing", enabled);
  $("#toggle-edit").textContent = enabled ? "직접 수정 끄기" : "직접 수정 켜기";
  if (enabled) {
    preview.focus();
    showToast("우측 초안을 직접 수정할 수 있습니다.");
  } else {
    showToast("직접 수정 모드를 껐습니다.");
  }
}

function replaceTextInPreview(replacements) {
  let html = currentEmailHtml();
  replacements.forEach(([from, to]) => {
    html = html.replaceAll(from, to);
  });
  $("#html-result").innerHTML = html;
  state.emailHtml = html;
  state.plain = htmlToPlainText(html);
  $("#plain-result").textContent = state.plain;
  renderSafetyPanel();
}

async function applyLocalAiEdit() {
  const request = valueOf("#ai-edit-prompt").toLowerCase();
  if (!request) {
    showToast("수정 요청을 입력해 주세요.");
    return;
  }

  const data = getFormData();
  const template = templates[data.templateId] || templates.problem;
  try {
    if (!IS_LOCAL) throw new Error("API not available");
    const proposal = await postJson("/api/edit-mail", {
      request,
      currentPlainText: htmlToPlainText(currentEmailHtml()),
      currentHtml: currentEmailHtml(),
      ...data,
    });
    renderProposal(proposal, data, template, "OpenAI로 수정 요청을 반영했습니다.");
    return;
  } catch (error) {
    console.warn(error);
  }

  const replacements = [];
  if (request.includes("정중") || request.includes("부드럽")) {
    replacements.push(
      ["공유드릴 만한 개선 방향이 있어 연락드립니다.", "검토에 도움이 되실 만한 개선 방향이 있어 조심스럽게 연락드립니다."],
      ["조금 더 정리되면 좋겠습니다.", "조금 더 정리해보시면 좋을 것으로 보였습니다."],
      ["짧게 이야기 나누고", "부담 없는 범위에서 짧게 이야기 나누고"]
    );
  }
  if (request.includes("짧") || request.includes("간결")) {
    replacements.push(
      ["최근 B2B 영업에서는 단순한 소개 메일보다, 상대 업체의 현재 상황을 반영한 맞춤형 제안이 더 중요해지고 있습니다.", "최근 B2B 영업에서는 맞춤형 제안의 중요성이 커지고 있습니다."],
      ["처음부터 큰 도입보다, 특정 고객군이나 캠페인 한 가지를 기준으로 작은 테스트를 진행하면 부담 없이 효과를 확인할 수 있습니다.", "작은 테스트부터 진행하면 부담 없이 효과를 확인할 수 있습니다."],
      ["편하신 일정 회신 주시면 맞춰서 간단히 설명드리겠습니다.", "편하신 일정 회신 주시면 맞춰 설명드리겠습니다."]
    );
  }
  if (request.includes("강하게") || request.includes("cta") || request.includes("미팅")) {
    replacements.push(
      ["편하신 일정 회신 주시면 맞춰서 간단히 설명드리겠습니다.", "이번 주 또는 다음 주 중 15분 정도 가능하신 시간만 회신 주시면, 적용 가능한 방향을 바로 공유드리겠습니다."],
      ["짧게 이야기 나누고", "15분 미팅으로 빠르게 확인하고"]
    );
  }
  if (request.includes("진단")) {
    replacements.push([
      "다음 행동 유도 포인트가 더 정리되면 좋을 것으로 보입니다.",
      "다음 행동 유도 포인트를 더 선명하게 정리하면 문의 전환율을 높일 수 있습니다.",
    ]);
  }
  if (request.includes("대표")) {
    replacements.push([
      "영업 담당자는 자료 작성보다 실제 대화와 전환 관리에 더 많은 시간을 쓸 수 있습니다.",
      "대표자 관점에서는 반복 운영 리소스를 줄이고, 성과 관리에 더 집중할 수 있는 구조를 만들 수 있습니다.",
    ]);
  }
  if (request.includes("실무")) {
    replacements.push([
      "대표자 관점에서는 반복 운영 리소스를 줄이고, 성과 관리에 더 집중할 수 있는 구조를 만들 수 있습니다.",
      "실무자 관점에서는 반복 자료 작성과 후속 연락 준비 시간을 줄이는 데 도움이 됩니다.",
    ]);
  }
  if (replacements.length === 0) {
    showToast("현재 MVP는 정중하게, 짧게, CTA 강화, 진단 보완, 대표자용, 실무자용 요청을 우선 지원합니다.");
    return;
  }
  replaceTextInPreview(replacements);
  showToast("수정 요청을 초안에 반영했습니다.");
}

function renderInsights(data, template) {
  const insights = [
    ["제안 서비스 분류", `${data.industry}`],
    ["영업 단계", `${data.salesStage} · ${data.persona}`],
    ["메일 구조", "타이틀 → 목차 → 섹션 본문 → 명함"],
  ];
  $("#insights").innerHTML = insights
    .map(([label, value]) => `<article class="insight"><span>${label}</span><p>${escapeHtml(value)}</p></article>`)
    .join("");
}

function renderSafetyPanel() {
  const text = htmlToPlainText(currentEmailHtml());
  const avoid = valueOf("#avoid")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const warnings = [...new Set([...bannedPhrases, ...avoid])].filter((phrase) => phrase && text.includes(phrase));
  if (warnings.length === 0) {
    $("#safety-panel").innerHTML = `<div class="safety-item safe">금지 표현 감지 없음 · 현재 초안은 안전 표현 기준을 통과했습니다.</div>`;
    return;
  }
  $("#safety-panel").innerHTML = warnings
    .map((warning) => `<div class="safety-item">주의 표현 감지: <strong>${escapeHtml(warning)}</strong> · 더 완화된 표현으로 수정하는 것이 좋습니다.</div>`)
    .join("");
}

function renderDraftList() {
  const drafts = JSON.parse(localStorage.getItem("saleskit-drafts") || "[]");
  if (drafts.length === 0) {
    $("#draft-list").innerHTML = `<div class="draft-item"><span>저장된 초안이 없습니다.</span></div>`;
    return;
  }
  $("#draft-list").innerHTML = drafts
    .slice(0, 5)
    .map((draft, index) => {
      const title = (draft.plain || "").split("\n")[0] || "제목 없음";
      const date = new Date(draft.createdAt).toLocaleString("ko-KR");
      return `
        <div class="draft-item">
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(date)}</span>
          <button class="secondary-button" type="button" data-draft-index="${index}">불러오기</button>
        </div>`;
    })
    .join("");
}

function renderTemplateCards() {
  $("#template-cards").innerHTML = Object.values(templates)
    .map(
      (template) => `
        <article class="template-card">
          <div>
            <p class="eyebrow">메일 구조</p>
            <h3>${template.name}</h3>
          </div>
          <p>${template.description}</p>
          <ul>${template.points.map((point) => `<li>${point}</li>`).join("")}</ul>
        </article>`
    )
    .join("");
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1800);
}

async function copyValue(value, message) {
  await navigator.clipboard.writeText(value);
  showToast(message);
}

function copyRichHtmlBySelection() {
  const host = document.createElement("div");
  host.setAttribute("contenteditable", "true");
  host.style.position = "fixed";
  host.style.left = "-9999px";
  host.style.top = "0";
  host.style.width = "660px";
  host.innerHTML = currentEmailHtml();
  document.body.appendChild(host);
  const range = document.createRange();
  range.selectNodeContents(host);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  const copied = document.execCommand("copy");
  selection.removeAllRanges();
  host.remove();
  return copied;
}

async function copyEmailHtml() {
  try {
    if (window.ClipboardItem && navigator.clipboard.write) {
      const editedHtml = currentEmailHtml();
      const editedPlain = htmlToPlainText(editedHtml);
      const htmlBlob = new Blob([editedHtml], { type: "text/html" });
      const textBlob = new Blob([editedPlain], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": htmlBlob,
          "text/plain": textBlob,
        }),
      ]);
      showToast("메일 작성창에 붙는 본문 형식으로 복사했습니다.");
      return;
    }
  } catch {
    // Fall through to selection copy.
  }
  if (copyRichHtmlBySelection()) {
    showToast("메일 작성창에 붙는 본문 형식으로 복사했습니다.");
    return;
  }
  await copyValue(htmlToPlainText(currentEmailHtml()), "브라우저 제한으로 텍스트 본문을 복사했습니다.");
}

function wireEvents() {
  $("#mail-form").addEventListener("submit", (event) => {
    event.preventDefault();
    buildMail();
  });

  $("#reset-button").addEventListener("click", () => {
    $("#target-url").value = "https://example.co.kr";
    $("#offer").value = "B2B 영업팀을 위한 CRM 자동화 솔루션";
    $("#recipient").value = "대표";
    $("#custom-recipient").value = "";
    toggleCustomRecipient();
    $("#tone").value = "정중한";
    $("#sales-stage").value = "첫 접촉";
    $("#persona").value = "의사결정권자";
    $("#template").value = "problem";
    $("#cta").value = "15분 미팅 제안";
    $("#avoid").value = "성과 보장, 최저가, 무조건";
    $("#sender-name").value = "박경섭 대리";
    $("#sender-company").value = "프로그레스미디어 | AE";
    $("#sender-phone").value = "02-851-8922 | 010-2974-6203";
    $("#sender-email").value = "pks1130@progress-media.co.kr";
    $("#sender-extra").value = "서울 구로구 디지털로26길 43";
    saveSenderInfo();
    buildMail({ localOnly: true });
  });

  $$(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".nav-item").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      $$(".view").forEach((view) => view.classList.remove("active"));
      $(`#${button.dataset.view}-view`).classList.add("active");
    });
  });

  $$(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".tab").forEach((tab) => tab.classList.remove("active"));
      button.classList.add("active");
      $("#html-result").classList.toggle("hidden", button.dataset.result !== "html");
      $("#plain-result").classList.toggle("hidden", button.dataset.result !== "plain");
      $("#followup-result").classList.toggle("hidden", button.dataset.result !== "followup");
    });
  });

  $("#copy-text").addEventListener("click", () => copyValue(htmlToPlainText(currentEmailHtml()), "텍스트 메일을 복사했습니다."));
  $("#copy-html").addEventListener("click", copyEmailHtml);
  $("#toggle-edit").addEventListener("click", () => {
    const isEditing = $("#html-result").contentEditable === "true";
    setEditMode(!isEditing);
  });
  $("#apply-ai-edit").addEventListener("click", applyLocalAiEdit);
  $("#html-result").addEventListener("input", () => {
    state.emailHtml = currentEmailHtml();
    state.plain = htmlToPlainText(state.emailHtml);
    $("#plain-result").textContent = state.plain;
    renderSafetyPanel();
  });
  $("#save-draft").addEventListener("click", () => {
    const drafts = JSON.parse(localStorage.getItem("saleskit-drafts") || "[]");
    const html = currentEmailHtml();
    drafts.unshift({ createdAt: new Date().toISOString(), plain: htmlToPlainText(html), html });
    localStorage.setItem("saleskit-drafts", JSON.stringify(drafts.slice(0, 20)));
    renderDraftList();
    showToast("초안을 브라우저에 저장했습니다.");
  });
  $("#draft-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-draft-index]");
    if (!button) return;
    const drafts = JSON.parse(localStorage.getItem("saleskit-drafts") || "[]");
    const draft = drafts[Number(button.dataset.draftIndex)];
    if (!draft) return;
    state.emailHtml = draft.html;
    state.plain = draft.plain;
    $("#html-result").innerHTML = draft.html;
    $("#plain-result").textContent = draft.plain;
    renderSafetyPanel();
    showToast("저장된 초안을 불러왔습니다.");
  });

  $("#recipient").addEventListener("change", toggleCustomRecipient);

  SENDER_FIELDS.forEach((id) => {
    $(`#${id}`)?.addEventListener("input", saveSenderInfo);
  });
}

function toggleCustomRecipient() {
  const isCustom = valueOf("#recipient") === "직접 입력";
  $("#custom-recipient-field").classList.toggle("visible", isCustom);
  if (isCustom) $("#custom-recipient").focus();
}

loadSenderInfo();
renderTemplateCards();
wireEvents();
buildMail({ localOnly: true, silent: true });
