export type VisaSeoPageContent = {
  slug: string
  path: string
  keyword: string
  monthlySearchVolume: number
  title: string
  description: string
  h1: string
  intro: string
  directAnswer: string
  costFactors: string[]
  checklist: string[]
  processNotes: string[]
  faqs: Array<{
    question: string
    answer: string
  }>
}

const commonCostFactors = [
  '出行目的：商务访问、短期停留、资料补充或其他办理目的会影响材料要求。',
  '申请人身份与材料基础：护照有效期、过往出入境记录、邀请文件和在职/营业资料需要先核对。',
  '是否需要商务邀请或本地协助：涉及当地资源对接时，费用结构会不同。',
  '办理时间要求：越临近出行时间，越需要先确认是否具备可操作窗口。',
]

const commonChecklist = [
  '护照首页清晰照片或扫描件',
  '预计出行时间、停留时间和入境目的',
  '是否已有邀请方、酒店、行程或商务接待安排',
  '申请人联系方式和当前所在城市',
]

export const visaSeoPages: VisaSeoPageContent[] = [
  {
    slug: 'jierjisisitan-qianzheng',
    path: '/visa/jierjisisitan-qianzheng',
    keyword: '吉尔吉斯斯坦签证',
    monthlySearchVolume: 8941,
    title: '吉尔吉斯斯坦签证办理｜材料清单与中文咨询｜吉速通出入境服务',
    description:
      '吉速通出入境服务提供吉尔吉斯斯坦签证材料清单、资料预审、商务访问和办理路径咨询，面向中国客户提供中文沟通。',
    h1: '吉尔吉斯斯坦签证办理',
    intro:
      '准备前往吉尔吉斯斯坦前，建议先确认出行目的、停留时间、材料基础和是否需要商务邀请。我们先做资料核对，再给出办理建议。',
    directAnswer:
      '吉尔吉斯斯坦签证办理通常要先确认申请人身份、出行目的和材料完整度。不同目的对应的材料和费用不同，不建议只按一个固定价格判断。',
    costFactors: commonCostFactors,
    checklist: commonChecklist,
    processNotes: ['说明出行目的和预计时间', '顾问核对基础材料', '确认办理路径和费用', '递交办理并反馈节点'],
    faqs: [
      {
        question: '吉尔吉斯斯坦签证可以先咨询再准备材料吗？',
        answer: '可以。建议先把目的、时间和现有材料发给顾问，避免按错误清单准备。',
      },
      {
        question: '没有商务邀请还能不能办理？',
        answer: '需要先看出行目的和申请条件。若涉及商务访问，我们会先确认是否需要邀请文件或本地协助。',
      },
    ],
  },
  {
    slug: 'jierjisisitan-shangwu-qianzheng-duoshaoqian',
    path: '/visa/jierjisisitan-shangwu-qianzheng-duoshaoqian',
    keyword: '吉尔吉斯斯坦商务签证多少钱',
    monthlySearchVolume: 428,
    title: '吉尔吉斯斯坦商务签证多少钱｜费用影响因素与材料说明｜吉速通',
    description:
      '吉尔吉斯斯坦商务签证费用需结合商务目的、邀请材料、本地协助和办理时间判断。吉速通提供中文材料预审与微信咨询。',
    h1: '吉尔吉斯斯坦商务签证多少钱',
    intro:
      '商务签证费用不能只看签证本身，还要看是否需要商务邀请、当地接待、资料翻译或其他协助。先核对材料，报价才更准确。',
    directAnswer:
      '吉尔吉斯斯坦商务签证多少钱，主要取决于商务访问目的、邀请文件准备情况、办理周期和是否需要本地资源协助。',
    costFactors: [
      '商务邀请文件是否已经准备完整。',
      '邀请方信息、访问目的和停留时间是否清晰。',
      '是否需要中文沟通、本地协调或后续公司办理服务。',
      '申请时间是否充足，是否需要加急判断。',
    ],
    checklist: ['护照首页', '访问目的说明', '邀请方或接待方信息', '预计入境日期和停留时间'],
    processNotes: ['确认商务目的', '核对邀请材料', '说明费用组成', '进入递交流程'],
    faqs: [
      {
        question: '商务签证费用包含邀请函吗？',
        answer: '不一定。需要看客户是否已有邀请方，以及是否需要我们协助对接本地资源。',
      },
      {
        question: '商务签证和普通访问签证费用一样吗？',
        answer: '通常不能直接等同。商务目的可能涉及额外材料和本地协助，建议单独核对。',
      },
    ],
  },
  {
    slug: 'qu-jierjisisitan-qianzheng-duoshaoqian',
    path: '/visa/qu-jierjisisitan-qianzheng-duoshaoqian',
    keyword: '去吉尔吉斯斯坦签证多少钱',
    monthlySearchVolume: 289,
    title: '去吉尔吉斯斯坦签证多少钱｜出行前费用咨询｜吉速通',
    description:
      '去吉尔吉斯斯坦签证多少钱要看出行目的、停留时间、材料情况和是否需要商务邀请。吉速通提供中文微信咨询。',
    h1: '去吉尔吉斯斯坦签证多少钱',
    intro:
      '去吉尔吉斯斯坦前，先不要只问一个价格。更稳妥的做法是先确认目的、时间、材料基础和是否有邀请方。',
    directAnswer:
      '去吉尔吉斯斯坦签证费用会随出行目的和材料情况变化。我们会先核对信息，再说明费用结构和可办理路径。',
    costFactors: commonCostFactors,
    checklist: commonChecklist,
    processNotes: ['说明去吉尔吉斯斯坦的目的', '提交基础材料给顾问预审', '确认费用和办理周期', '按清单补齐材料'],
    faqs: [
      {
        question: '只是短期去吉尔吉斯斯坦，也需要先核价吗？',
        answer: '需要。短期停留也要看入境目的、材料基础和当前办理要求。',
      },
      {
        question: '费用可以直接线上报价吗？',
        answer: '可以先给出范围判断，但正式报价需要看材料和办理目的。',
      },
    ],
  },
  {
    slug: 'banli-jierjisisitan-qianzheng-xuyao-duoshaoqian',
    path: '/visa/banli-jierjisisitan-qianzheng-xuyao-duoshaoqian',
    keyword: '办理吉尔吉斯斯坦签证需要多少钱',
    monthlySearchVolume: 429,
    title: '办理吉尔吉斯斯坦签证需要多少钱｜材料预审与办理流程｜吉速通',
    description:
      '办理吉尔吉斯斯坦签证需要多少钱，取决于签证类型、材料完整度、邀请文件和办理时间。先微信咨询材料清单。',
    h1: '办理吉尔吉斯斯坦签证需要多少钱',
    intro:
      '办理费用通常由材料预审、签证申请、可能需要的邀请或本地协助组成。先把材料情况说明清楚，可以减少反复沟通。',
    directAnswer:
      '办理吉尔吉斯斯坦签证需要多少钱，要先看签证类型、申请人材料和办理节点。确认材料后，我们会把费用和流程一次说明清楚。',
    costFactors: commonCostFactors,
    checklist: commonChecklist,
    processNotes: ['微信发送需求', '顾问整理材料清单', '确认费用与周期', '资料递交和进度反馈'],
    faqs: [
      {
        question: '办理前需要先付费吗？',
        answer: '具体支付安排以顾问确认后的服务方案为准。咨询阶段会先确认材料和办理可行性。',
      },
      {
        question: '材料不齐会不会影响费用？',
        answer: '会。材料不齐可能带来补件、翻译、邀请或其他协助成本。',
      },
    ],
  },
  {
    slug: 'qu-jierjisisitan-de-qianzheng-duoshaoqian',
    path: '/visa/qu-jierjisisitan-de-qianzheng-duoshaoqian',
    keyword: '去吉尔吉斯斯坦的签证多少钱',
    monthlySearchVolume: 352,
    title: '去吉尔吉斯斯坦的签证多少钱｜费用组成和资料清单｜吉速通',
    description:
      '去吉尔吉斯斯坦的签证多少钱，需要看出行目的、停留时间、邀请材料和办理周期。吉速通提供中文资料预审。',
    h1: '去吉尔吉斯斯坦的签证多少钱',
    intro:
      '这类问题通常发生在出行计划刚确定时。我们会先帮你把目的、材料和时间线梳理清楚，再判断费用。',
    directAnswer:
      '去吉尔吉斯斯坦的签证费用不是单一数字，通常由申请类型、资料准备、本地协助和办理周期共同决定。',
    costFactors: commonCostFactors,
    checklist: commonChecklist,
    processNotes: ['提供出行计划', '确认签证类型', '核对材料清单', '给出费用和办理建议'],
    faqs: [
      {
        question: '去吉尔吉斯斯坦旅游和商务费用一样吗？',
        answer: '不一定。不同出行目的对应的材料、邀请和办理路径可能不同。',
      },
      {
        question: '还没买机票能不能咨询？',
        answer: '可以。建议先咨询签证路径，再安排后续行程，避免时间不匹配。',
      },
    ],
  },
  {
    slug: 'dao-jierjisisitan-qianzheng-duoshaoqian',
    path: '/visa/dao-jierjisisitan-qianzheng-duoshaoqian',
    keyword: '到吉尔吉斯斯坦签证多少钱',
    monthlySearchVolume: 612,
    title: '到吉尔吉斯斯坦签证多少钱｜入境目的与费用咨询｜吉速通',
    description:
      '到吉尔吉斯斯坦签证多少钱，要结合入境目的、停留安排、材料基础和本地协助判断。吉速通提供中文办理咨询。',
    h1: '到吉尔吉斯斯坦签证多少钱',
    intro:
      '“到吉尔吉斯斯坦”通常意味着已经有明确入境计划。费用判断要同时看入境目的、停留时间和材料准备情况。',
    directAnswer:
      '到吉尔吉斯斯坦签证费用需要按具体入境目的核对。若涉及商务、邀请或本地接待，费用结构会和普通咨询不同。',
    costFactors: commonCostFactors,
    checklist: commonChecklist,
    processNotes: ['确认入境目的', '检查护照和基础信息', '判断是否需要邀请材料', '确认费用后办理'],
    faqs: [
      {
        question: '到吉尔吉斯斯坦前多久咨询比较合适？',
        answer: '建议确定出行计划后尽早咨询，给材料补充和办理预留时间。',
      },
      {
        question: '已经有邀请方，还需要代办吗？',
        answer: '可以先让顾问核对邀请材料是否符合办理要求，再决定是否需要代办。',
      },
    ],
  },
  {
    slug: 'jierjisisitan-qianzheng-duoshaoqian',
    path: '/visa/jierjisisitan-qianzheng-duoshaoqian',
    keyword: '吉尔吉斯斯坦签证多少钱',
    monthlySearchVolume: 221,
    title: '吉尔吉斯斯坦签证多少钱｜费用构成与微信咨询｜吉速通',
    description:
      '吉尔吉斯斯坦签证多少钱取决于签证目的、材料完整度、邀请文件和办理周期。添加吉速通顾问先核对材料。',
    h1: '吉尔吉斯斯坦签证多少钱',
    intro:
      '如果你只想快速知道费用，建议先把出行目的、预计时间和现有材料发给顾问。核对后才能判断费用和办理可行性。',
    directAnswer:
      '吉尔吉斯斯坦签证多少钱没有统一固定答案。商务访问、短期停留、材料补充和本地协助都会影响最终费用。',
    costFactors: commonCostFactors,
    checklist: commonChecklist,
    processNotes: ['发送关键词问题', '顾问追问必要信息', '确认材料差异', '给出费用和时间建议'],
    faqs: [
      {
        question: '为什么网上看到的价格不一样？',
        answer: '不同服务包含范围不同，有的只包含基础申请，有的包含邀请、翻译、材料预审或本地协助。',
      },
      {
        question: '能不能只咨询费用，不马上办理？',
        answer: '可以。我们会先帮助判断材料和路径，是否办理由客户决定。',
      },
    ],
  },
]

export const visaSeoPagesBySlug = Object.fromEntries(visaSeoPages.map((page) => [page.slug, page]))
