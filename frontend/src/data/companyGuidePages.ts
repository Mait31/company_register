export type CompanyGuideReference = {
  label: string
  url: string
}

export type CompanyGuidePageContent = {
  slug: string
  path: string
  keyword: string
  title: string
  description: string
  h1: string
  intro: string
  directAnswer: string
  keyPoints: string[]
  checklist: string[]
  processNotes: string[]
  riskNotes: string[]
  faqs: Array<{
    question: string
    answer: string
  }>
  references: CompanyGuideReference[]
}

const ministryGuide = {
  label: '吉尔吉斯经济和商业部：如何在吉尔吉斯斯坦注册 business',
  url: 'https://mineconom.gov.kg/ru/direct/385/398',
}

const investmentClimateGuide = {
  label: 'U.S. trade.gov：Kyrgyz Republic Investment Climate Statement',
  url: 'https://www.trade.gov/country-commercial-guides/kyrgyz-republic-investment-climate-statement',
}

const investmentLawGuide = {
  label: 'UNCTAD：Kyrgyz Republic Law on Investments 2025',
  url: 'https://investmentpolicy.unctad.org/investment-laws/laws/636/kyrgyzstan-on-investments-in-the-kyrgyz-republic',
}

const taxGuide = {
  label: 'U.S. trade.gov：Kyrgyz Republic Selling Factors & Techniques',
  url: 'https://www.trade.gov/country-commercial-guides/kyrgyz-republic-selling-factors-techniques',
}

const legalEntityGuide = {
  label: 'Kalikova & Associates：Registration of Legal Entities in the Kyrgyz Republic',
  url: 'https://www.k-a.kg/eng/faq/registration-legal-entities-kyrgyz-republic-8-frequently-asked-questions',
}

const commonReferences = [ministryGuide, legalEntityGuide, investmentClimateGuide]

const commonChecklist = [
  '护照首页及清晰联系方式；外文材料通常需要俄文或吉文公证翻译。',
  '公司名称备选、经营范围、股权比例、董事或总经理信息。',
  '注册地址或本地地址安排；后续银行开户也会核对地址和业务真实性。',
  '如委托代理办理，需要准备授权委托书及对应公证、认证或翻译文件。',
]

const commonProcess = [
  '确认公司形态、股东结构和实际经营计划',
  '核对公司名称、注册地址和负责人信息',
  '准备申请书、设立决定、护照或注册摘录等材料',
  '提交至司法部或对应登记机关并等待登记结果',
  '取得登记文件后衔接税务、印章、银行开户和会计记账',
]

const commonRiskNotes = [
  '页面内容用于办理前咨询，不替代当地律师、会计或政府窗口的最终意见。',
  '外资法人股东、特殊行业、许可经营、银行开户和税务制度选择要单独核对。',
  '不要只按政府规费判断总成本，翻译、公证、认证、注册地址、开户和会计交接都会影响报价。',
]

export const companyGuidePages: CompanyGuidePageContent[] = [
  {
    slug: 'jierjisisitan-gongsi-zhuce',
    path: '/company/jierjisisitan-gongsi-zhuce',
    keyword: '吉尔吉斯斯坦公司注册',
    title: '吉尔吉斯斯坦公司注册指南｜材料、流程与中文咨询｜吉速通出入境服务',
    description:
      '吉速通整理吉尔吉斯斯坦公司注册材料、流程、外资股东、注册地址、税务和银行开户注意事项，为中国客户提供中文咨询。',
    h1: '吉尔吉斯斯坦公司注册指南',
    intro:
      '公司注册不是单纯递交一个表格。真正需要先判断的是公司形态、股东身份、经营范围、注册地址、税务制度和后续银行开户条件。',
    directAnswer:
      '吉尔吉斯斯坦公司注册通常先确认是否设立 ОсОО / LLC、股东是自然人还是法人、是否有外资参与、材料是否需要公证翻译，再进入登记、税务和银行开户衔接。',
    keyPoints: [
      '常见形态是有限责任公司 ОсОО / LLC，适合中小型贸易、服务和本地经营主体。',
      '外资参与通常需要更严格的身份、注册摘录、受益所有人和文件认证核对。',
      '登记后还要处理税务制度、印章、银行 KYC、会计记账和许可证问题。',
    ],
    checklist: commonChecklist,
    processNotes: commonProcess,
    riskNotes: commonRiskNotes,
    faqs: [
      {
        question: '吉尔吉斯斯坦公司注册是不是只要 3 天？',
        answer:
          '登记机关的法定或窗口口径可能较短，但实际办理还要看材料翻译、公证认证、注册地址、税务衔接和银行开户。对中国客户来说，前期材料准备往往比登记动作本身更耗时。',
      },
      {
        question: '注册完成后就能正常经营吗？',
        answer:
          '不一定。注册只是取得主体资格，具体经营还要看行业许可、税务制度、合同、银行账户和会计申报是否完成。',
      },
    ],
    references: commonReferences,
  },
  {
    slug: 'jierjisisitan-zhuce-gongsi-duoshaoqian',
    path: '/company/jierjisisitan-zhuce-gongsi-duoshaoqian',
    keyword: '吉尔吉斯斯坦注册公司多少钱',
    title: '吉尔吉斯斯坦注册公司多少钱｜费用构成与报价前材料｜吉速通',
    description:
      '吉尔吉斯斯坦注册公司多少钱要看股东身份、文件翻译认证、注册地址、银行开户和后续会计税务。先提交材料做中文预审。',
    h1: '吉尔吉斯斯坦注册公司多少钱',
    intro:
      '公司注册费用不适合只问一个固定数字。不同股东结构、材料语言、注册地址、银行开户和税务接续方式，会让报价差异很大。',
    directAnswer:
      '吉尔吉斯斯坦注册公司费用通常由政府规费、文件翻译、公证认证、注册地址、代理服务、银行开户协助和后续记账税务衔接组成。',
    keyPoints: [
      '自然人股东通常比境外法人股东材料简单，成本也更容易判断。',
      '中文、英文或其他外文材料需要翻译成俄文或吉文，并按要求做公证或认证。',
      '如果需要银行开户、税务制度选择、会计交接或许可咨询，应与注册费用分开核算。',
    ],
    checklist: [
      '股东是个人还是公司；如为公司，需要准备注册摘录和授权文件。',
      '是否已有当地注册地址、负责人和实际经营计划。',
      '是否需要我们协助银行开户、税务登记、会计记账或长期维护。',
      '希望办理的时间节点，是否已有商务合同、客户或本地合作方。',
    ],
    processNotes: ['收集股东和经营信息', '判断材料翻译认证量', '确认注册地址和办理范围', '拆分一次性注册费和后续维护费'],
    riskNotes: commonRiskNotes,
    faqs: [
      {
        question: '为什么网上公司注册报价差别很大？',
        answer:
          '有的报价只包含登记递交，有的包含翻译、公证、注册地址、银行开户和会计交接。比较报价时必须先确认服务范围。',
      },
      {
        question: '能不能先给一个大概范围？',
        answer:
          '可以先判断费用结构，但正式报价需要看股东身份、文件语言、是否外资法人股东、是否需要银行开户和后续财税服务。',
      },
    ],
    references: [ministryGuide, legalEntityGuide],
  },
  {
    slug: 'jierjisisitan-zhuce-gongsi-cailiao',
    path: '/company/jierjisisitan-zhuce-gongsi-cailiao',
    keyword: '吉尔吉斯斯坦注册公司需要什么材料',
    title: '吉尔吉斯斯坦注册公司需要什么材料｜外资股东材料清单｜吉速通',
    description:
      '吉尔吉斯斯坦注册公司材料包括申请书、设立决定、护照或境外公司注册摘录、负责人护照、翻译认证和注册地址信息。',
    h1: '吉尔吉斯斯坦注册公司需要什么材料',
    intro:
      '材料清单要先按股东身份拆分：个人股东、境外法人股东、本地法人股东和是否委托代理办理，对应文件不一样。',
    directAnswer:
      '常见材料包括登记申请、设立决定、股东护照或法人注册文件、负责人护照、注册地址信息、授权委托文件，以及必要的俄文或吉文公证翻译。',
    keyPoints: [
      '外籍自然人通常需要护照复印件及公证翻译。',
      '境外法人股东通常需要注册摘录、存续证明、授权文件，并注意文件有效期、认证和翻译。',
      '负责人、注册地址、公司名称和经营范围必须在提交前核对一致。',
    ],
    checklist: [
      '公司名称备选和经营范围说明',
      '股东护照或境外公司注册文件',
      '负责人或总经理护照信息',
      '注册地址证明或本地地址安排',
      '授权委托书、翻译件、公证认证文件',
    ],
    processNotes: ['区分股东身份', '核对文件语言和有效期', '准备翻译公证认证', '提交登记并留存电子和纸质版本'],
    riskNotes: [
      '境外公司作为股东时，注册摘录或存续证明的出具时间、认证方式和翻译要求要先确认。',
      '文件上的姓名、护照号、公司名称、地址和授权范围必须一致，避免提交后被要求补正。',
      '银行开户阶段会继续做 KYC，不等于注册通过后银行一定无条件开户。',
    ],
    faqs: [
      {
        question: '中文材料可以直接提交吗？',
        answer:
          '通常不能直接提交。官方指南和实务资料都要求外文材料配套俄文或吉文公证翻译，具体翻译和认证方式要按材料来源确认。',
      },
      {
        question: '股东本人必须到场吗？',
        answer:
          '需要看办理方式和后续银行开户要求。公司登记可通过授权文件办理，但开户、KYC 或特定事项可能要求本人配合。',
      },
    ],
    references: [ministryGuide, legalEntityGuide],
  },
  {
    slug: 'zhongguoren-zai-jierjisisitan-zhuce-gongsi',
    path: '/company/zhongguoren-zai-jierjisisitan-zhuce-gongsi',
    keyword: '中国人可以在吉尔吉斯斯坦注册公司吗',
    title: '中国人可以在吉尔吉斯斯坦注册公司吗｜外资股东与限制说明｜吉速通',
    description:
      '中国人可以在吉尔吉斯斯坦注册公司吗？需要区分普通行业、外资参与、特殊许可、土地和银行开户 KYC。吉速通提供中文咨询。',
    h1: '中国人可以在吉尔吉斯斯坦注册公司吗',
    intro:
      '很多客户先问能不能注册。更准确的问题是：个人还是中国公司作为股东，做什么行业，是否需要许可证，是否需要银行账户和本地运营。',
    directAnswer:
      '中国自然人或中国公司通常可以作为外资参与方申请设立吉尔吉斯斯坦公司，但特殊行业、许可证、土地、不动产和银行开户要求要单独核对。',
    keyPoints: [
      '投资法框架强调投资保护和信息公开，但不代表所有行业都没有准入或许可要求。',
      '中国个人作为股东和中国公司作为股东，材料复杂度不同。',
      '银行开户、税务制度选择和后续合规维护，是外资客户最容易低估的部分。',
    ],
    checklist: [
      '确认股东是中国个人还是中国公司',
      '说明拟经营行业、客户来源和资金来源',
      '确认是否涉及许可证、进口、贸易、物流、教育、金融、矿业等特殊事项',
      '准备护照、公司文件、授权文件和受益所有人信息',
    ],
    processNotes: ['判断是否适合外资独资', '核对行业限制或许可', '准备股东身份证明', '登记后衔接税务和银行 KYC'],
    riskNotes: [
      '外资可以参与注册，不等于所有经营活动都无需审批。',
      '境外法人股东文件通常需要认证和翻译，材料时间要提前预留。',
      '如果业务涉及高风险地区、跨境资金或敏感商品，银行和合规审查会更严格。',
    ],
    faqs: [
      {
        question: '中国公司能作为吉尔吉斯斯坦公司的股东吗？',
        answer:
          '通常可以，但要准备中国公司的注册文件、授权文件、受益所有人信息，并按要求做认证和翻译。',
      },
      {
        question: '中国人注册后可以自己当董事吗？',
        answer:
          '董事或负责人安排要结合公司形态、签证/居留、银行开户和当地实务要求确认。注册前建议把负责人方案一起核对。',
      },
    ],
    references: [investmentLawGuide, investmentClimateGuide, legalEntityGuide],
  },
  {
    slug: 'jierjisisitan-gongsi-zhuce-liucheng',
    path: '/company/jierjisisitan-gongsi-zhuce-liucheng',
    keyword: '吉尔吉斯斯坦公司注册流程',
    title: '吉尔吉斯斯坦公司注册流程｜从核名到税务银行开户｜吉速通',
    description:
      '吉尔吉斯斯坦公司注册流程包括确认公司形态、准备材料、提交司法部登记、税务衔接、印章、银行开户和会计维护。',
    h1: '吉尔吉斯斯坦公司注册流程',
    intro:
      '专业公司注册服务要把“登记动作”和“经营准备”分开看。登记只是第一步，后面还有税务、印章、银行账户和合规维护。',
    directAnswer:
      '完整流程通常包括需求确认、公司形态选择、名称和地址核对、材料翻译公证、提交登记、取得文件、税务制度确认、印章和银行开户。',
    keyPoints: [
      '先确认公司形态和股权结构，避免后续改股或重做文件。',
      '提交登记前要核对名称、股东、负责人、注册地址和经营范围。',
      '登记后尽快衔接税务和会计，避免默认税制或申报遗漏。',
    ],
    checklist: commonChecklist,
    processNotes: commonProcess,
    riskNotes: commonRiskNotes,
    faqs: [
      {
        question: '流程里最容易卡在哪里？',
        answer:
          '外资材料认证翻译、注册地址、负责人信息、银行 KYC 和税务制度选择最容易影响时间。',
      },
      {
        question: '是否可以先注册，后面再考虑税务和开户？',
        answer:
          '不建议完全分开。税务制度、银行开户和会计维护会影响公司能否正常运营，应在注册前一起规划。',
      },
    ],
    references: [ministryGuide, investmentClimateGuide],
  },
  {
    slug: 'jierjisisitan-gongsi-zhuce-xuyao-duojiu',
    path: '/company/jierjisisitan-gongsi-zhuce-xuyao-duojiu',
    keyword: '吉尔吉斯斯坦公司注册需要多久',
    title: '吉尔吉斯斯坦公司注册需要多久｜官方时限与实际周期｜吉速通',
    description:
      '吉尔吉斯斯坦公司注册需要多久，要区分登记机关处理时间和材料准备、翻译认证、印章、税务银行开户等实际周期。',
    h1: '吉尔吉斯斯坦公司注册需要多久',
    intro:
      '客户看到“3 天”时，往往忽略了前期材料和后续开户。对跨境客户来说，实际周期要按完整办理包来判断。',
    directAnswer:
      '登记环节在材料齐备后可能较快，但从中国客户开始准备到可运营，通常还要考虑材料翻译认证、地址、税务、印章、银行 KYC 和会计交接。',
    keyPoints: [
      '官方指南提到登记时限和整体准备时间并不是同一个概念。',
      '外资法人股东、授权文件和境外文件认证会显著拉长准备周期。',
      '银行开户和税务会计接续需要单独预留时间。',
    ],
    checklist: [
      '材料是否已经齐全，是否需要公证翻译或认证',
      '股东是否为境外法人，注册摘录是否在有效期内',
      '是否已有注册地址和负责人安排',
      '是否同步办理印章、税务、银行开户和记账',
    ],
    processNotes: ['判断材料齐备程度', '预留翻译认证时间', '提交登记', '完成税务和银行开户衔接'],
    riskNotes: [
      '只承诺登记天数容易误导客户，应该把材料准备和后续经营准备一起说明。',
      '银行开户时间受银行 KYC、行业、资金来源和股东背景影响。',
      '如涉及许可证或特殊行业，周期应单独评估。',
    ],
    faqs: [
      {
        question: '资料齐全后最快多久能拿到注册文件？',
        answer:
          '资料齐全时登记阶段可能较快，但具体以登记机关受理和当前窗口要求为准；我们会先核对是否真的齐全。',
      },
      {
        question: '为什么你们不直接写固定办理周期？',
        answer:
          '因为跨境材料、公证认证、银行开户和税务选择会改变实际周期。固定承诺容易让客户低估准备时间。',
      },
    ],
    references: [ministryGuide, legalEntityGuide],
  },
  {
    slug: 'jierjisisitan-llc-zhuce',
    path: '/company/jierjisisitan-llc-zhuce',
    keyword: '吉尔吉斯斯坦 LLC 注册',
    title: '吉尔吉斯斯坦 LLC 注册｜ОсОО 有限责任公司说明｜吉速通',
    description:
      '吉尔吉斯斯坦 LLC 注册通常对应 ОсОО 有限责任公司。了解股东人数、注册地址、负责人、材料和后续税务银行开户。',
    h1: '吉尔吉斯斯坦 LLC 注册',
    intro:
      '中文客户常说 LLC，当地常见对应是 ОсОО。它适合多数中小型经营主体，但仍要确认股东人数、章程资本、负责人和注册地址。',
    directAnswer:
      '吉尔吉斯斯坦 LLC / ОсОО 是常见公司形态，通常适合贸易、服务和本地经营。注册前要核对股东结构、负责人、注册地址、名称和经营范围。',
    keyPoints: [
      '官方指南提到 ОсОО 参与人数量、名称唯一性、注册地址和文件语言要求。',
      'LLC 注册完成后仍要处理税务、印章、银行账户和会计申报。',
      '如果股东是境外公司，材料复杂度明显高于自然人股东。',
    ],
    checklist: [
      '公司名称备选，避免与已有主体冲突',
      '股东人数、股权比例和负责人安排',
      '注册地址和实际经营地点说明',
      '护照、注册摘录、授权文件和翻译认证资料',
    ],
    processNotes: ['确认是否选择 ОсОО', '核名和地址', '准备设立决定和股东材料', '登记后接续税务银行事项'],
    riskNotes: [
      'LLC 是常见形态，但不是所有行业的唯一选择。',
      '章程资本、股东人数和负责人安排应结合业务计划确认。',
      '若未来需要融资、合资或许可证，建议先把股权结构设计清楚。',
    ],
    faqs: [
      {
        question: 'LLC 和 ОсОО 是一回事吗？',
        answer:
          '中文语境中的 LLC 通常对应当地有限责任公司 ОсОО，但正式文件应使用当地法律名称和俄文/吉文表述。',
      },
      {
        question: '一个人可以注册 LLC 吗？',
        answer:
          '官方指南对 ОсОО 参与人数量有说明，单一自然人股东通常可以讨论办理；如唯一股东是另一家单一成员公司，要单独核对限制。',
      },
    ],
    references: [ministryGuide, legalEntityGuide],
  },
  {
    slug: 'jierjisisitan-gongsi-shuiwu-jizhang',
    path: '/company/jierjisisitan-gongsi-shuiwu-jizhang',
    keyword: '吉尔吉斯斯坦公司税务和记账',
    title: '吉尔吉斯斯坦公司税务和记账｜注册后合规维护说明｜吉速通',
    description:
      '吉尔吉斯斯坦公司注册后要处理税务制度、VAT、销售税、会计记账、申报和社保事项。吉速通提供中文财税咨询入口。',
    h1: '吉尔吉斯斯坦公司税务和记账',
    intro:
      '公司注册后最容易被忽略的是税务和记账。实际经营前应先确认适用税制、申报周期、会计资料、银行流水和合同发票管理。',
    directAnswer:
      '吉尔吉斯斯坦公司注册后应尽快确认税务制度、VAT 或销售税适用情况、会计记账责任、银行账户流水和申报安排，避免注册后长期空置或漏报。',
    keyPoints: [
      '官方指南提示，注册后若未及时选择税务制度，税务机关可能按一般制度处理。',
      'trade.gov 资料提到 VAT 和销售税是经营定价中需要考虑的重要税项。',
      '记账和申报要与银行开户、合同、发票和资金流一起规划。',
    ],
    checklist: [
      '主营业务、客户类型和预计收款方式',
      '是否涉及进口、贸易、服务、线上业务或特殊行业',
      '是否需要 VAT、销售税、所得税和社保事项咨询',
      '是否已有本地会计、银行账户和合同模板',
    ],
    processNotes: ['注册前说明经营模式', '注册后选择税务制度', '建立银行和会计资料流', '按月或按期维护申报'],
    riskNotes: [
      '税务不是注册完成后再随便处理的后置事项。',
      'VAT、销售税、所得税、社保和行业特殊税制要结合实际业务判断。',
      '网站内容不构成税务意见，具体申报以当地会计和税务机关要求为准。',
    ],
    faqs: [
      {
        question: '注册后没有经营，也需要记账吗？',
        answer:
          '通常仍需关注申报和维护责任。是否零申报、如何留存资料，要按当地会计口径确认。',
      },
      {
        question: '注册公司时要不要同时找会计？',
        answer:
          '建议同步安排。税务制度选择、银行流水和合同发票会影响后续合规，不适合等到产生交易后再补。',
      },
    ],
    references: [ministryGuide, taxGuide],
  },
]

export const companyGuidePagesBySlug = Object.fromEntries(companyGuidePages.map((page) => [page.slug, page]))
