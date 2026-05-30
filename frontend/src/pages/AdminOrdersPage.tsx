import { Alert, Button, Card, Form, Input, Modal, QRCode, Select, Space, Tag, Typography, message } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

type InvitationListItem = {
  id: number
  token: string
  status: string
  remark?: string | null
  company_name?: string | null
  contact_name?: string | null
  contact_mobile?: string | null
  latest_submitted_at?: string | null
  created_at: string
  updated_at: string
}

type InvitationParticipant = {
  id: number
  role: string
  name?: string | null
  mobile?: string | null
  submitted_fields_json?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

type InvitationDetail = InvitationListItem & {
  allow_forward: boolean
  expires_at?: string | null
  participants: InvitationParticipant[]
}

type MaterialFile = {
  id: number
  file_name: string
  file_ext?: string | null
  mime_type?: string | null
  file_size: number
  uploaded_at: string
}

type InvitationMaterial = {
  id: number
  material_type: string
  material_name: string
  description: string
  required: boolean
  status: string
  review_comment?: string | null
  reviewed_at?: string | null
  file?: MaterialFile | null
}

type MaterialSummary = {
  invitation_id: number
  token: string
  status: string
  total: number
  uploaded: number
  approved: number
  rejected: number
  missing: number
  materials: InvitationMaterial[]
}

type FollowFormValues = {
  status: string
  remark?: string
  full_company_name?: string
  legal_address?: string
  shareholder_note?: string
  registered_capital?: string
  director_name?: string
  director_phone?: string
  director_address?: string
  business_scope?: string
  tax_regime?: string
  need_bank_account?: string
  need_accounting?: string
  visa_type?: string
  name?: string
  mobile?: string
}

const statusText: Record<string, string> = {
  waiting_customer: '待填写',
  pending_internal_confirm: '待整理',
  processing: '待整理',
  completed: '已归档',
  draft: '待填写',
}

const statusColor: Record<string, string> = {
  waiting_customer: 'default',
  pending_internal_confirm: 'orange',
  processing: 'orange',
  completed: 'green',
  draft: 'default',
}

const statusOrder = ['pending_internal_confirm', 'processing', 'waiting_customer', 'completed']

const statusFilters = [
  { value: 'all', label: '全部' },
  { value: 'pending_internal_confirm', label: '待整理' },
  { value: 'completed', label: '已归档' },
]

const materialStatusText: Record<string, string> = {
  missing: '待上传',
  uploaded: '待核对',
  reviewing: '待核对',
  approved: '已通过',
  rejected: '需重传',
}

const fieldGroups = [
  {
    title: '公司信息',
    fields: [
      ['full_company_name', '公司名称'],
      ['legal_address', '法律地址'],
      ['registered_capital', '注册资金'],
      ['business_scope', '主要经营范围'],
    ],
  },
  {
    title: '人员与股东',
    fields: [
      ['shareholder_note', '股东信息'],
      ['director_name', '总经理/法人代表姓名'],
      ['director_phone', '联系电话'],
      ['director_address', '法人/总经理地址'],
    ],
  },
  {
    title: '附加服务',
    fields: [
      ['tax_regime', '税务制度'],
      ['need_bank_account', '是否需要银行开户'],
      ['need_accounting', '是否需要代理记账'],
      ['visa_type', '签证'],
    ],
  },
  {
    title: '填写人',
    fields: [
      ['name', '填写人姓名'],
      ['mobile', '填写人联系电话'],
    ],
  },
]

function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-WeCom-Userid': localStorage.getItem('admin_wecom_userid') || 'demo',
  }
}

function displayTime(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

function boolToText(value: unknown) {
  if (value === true) return '是'
  if (value === false) return '否'
  return undefined
}

function textToBool(value?: string) {
  if (value === '是') return true
  if (value === '否') return false
  return undefined
}

function submittedFields(detail: InvitationDetail) {
  return detail.participants[0]?.submitted_fields_json || {}
}

function fieldValue(fields: Record<string, unknown>, key: string) {
  const value = fields[key]
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (value === undefined || value === null || value === '') return '未填写'
  return String(value)
}

function toFormValues(detail: InvitationDetail): FollowFormValues {
  const fields = submittedFields(detail)
  return {
    status: detail.status === 'completed' ? 'completed' : 'pending_internal_confirm',
    remark: detail.remark || undefined,
    full_company_name: String(fields.full_company_name || ''),
    legal_address: String(fields.legal_address || ''),
    shareholder_note: String(fields.shareholder_note || ''),
    registered_capital: String(fields.registered_capital || ''),
    director_name: String(fields.director_name || ''),
    director_phone: String(fields.director_phone || ''),
    director_address: String(fields.director_address || ''),
    business_scope: String(fields.business_scope || ''),
    tax_regime: String(fields.tax_regime || ''),
    need_bank_account: boolToText(fields.need_bank_account),
    need_accounting: boolToText(fields.need_accounting),
    visa_type: String(fields.visa_type || ''),
    name: String(fields.name || detail.contact_name || ''),
    mobile: String(fields.mobile || detail.contact_mobile || ''),
  }
}

function toSubmittedFields(values: FollowFormValues) {
  return {
    name: values.name || undefined,
    mobile: values.mobile || undefined,
    full_company_name: values.full_company_name || undefined,
    legal_address: values.legal_address || undefined,
    shareholder_note: values.shareholder_note || undefined,
    registered_capital: values.registered_capital || undefined,
    director_name: values.director_name || undefined,
    director_phone: values.director_phone || undefined,
    director_address: values.director_address || undefined,
    business_scope: values.business_scope || undefined,
    tax_regime: values.tax_regime || undefined,
    need_bank_account: textToBool(values.need_bank_account),
    need_accounting: textToBool(values.need_accounting),
    visa_type: values.visa_type || undefined,
  }
}

async function fetchDetail(id: string) {
  const response = await fetch(`/api/admin/invitations/${id}`, { headers: adminHeaders() })
  if (!response.ok) throw new Error('加载资料详情失败')
  return (await response.json()) as InvitationDetail
}

async function fetchMaterials(id: string) {
  const response = await fetch(`/api/admin/invitations/${id}/materials`, { headers: adminHeaders() })
  if (!response.ok) throw new Error('加载委托书材料失败')
  return (await response.json()) as MaterialSummary
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(size / 1024))} KB`
}

function StatusTag({ status }: { status: string }) {
  return <Tag color={statusColor[status] || 'default'}>{statusText[status] || status}</Tag>
}

function drawRoundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.arcTo(x + width, y, x + width, y + height, radius)
  context.arcTo(x + width, y + height, x, y + height, radius)
  context.arcTo(x, y + height, x, y, radius)
  context.arcTo(x, y, x + width, y, radius)
  context.closePath()
}

async function copyMaterialShareImage(qrRoot: HTMLDivElement | null) {
  const qrCanvas = qrRoot?.querySelector('canvas')
  if (!qrCanvas) {
    message.error('分享二维码还在生成，请稍后再试')
    return
  }

  const canvas = document.createElement('canvas')
  canvas.width = 900
  canvas.height = 1180
  const context = canvas.getContext('2d')
  if (!context) {
    message.error('当前浏览器无法生成分享图片')
    return
  }

  const gradient = context.createLinearGradient(0, 0, 900, 1180)
  gradient.addColorStop(0, '#eef6ff')
  gradient.addColorStop(1, '#f8fafc')
  context.fillStyle = gradient
  context.fillRect(0, 0, 900, 1180)

  context.fillStyle = '#ffffff'
  drawRoundRect(context, 70, 70, 760, 1040, 44)
  context.fill()

  context.fillStyle = '#eff6ff'
  drawRoundRect(context, 110, 118, 112, 112, 30)
  context.fill()
  context.fillStyle = '#2563eb'
  context.fillRect(140, 150, 52, 8)
  context.fillStyle = '#93a8c8'
  context.fillRect(140, 178, 52, 8)
  context.fillRect(140, 206, 40, 8)
  context.strokeStyle = '#22c55e'
  context.lineWidth = 10
  context.lineCap = 'round'
  context.beginPath()
  context.moveTo(178, 244)
  context.lineTo(202, 268)
  context.lineTo(244, 218)
  context.stroke()

  context.fillStyle = '#0f172a'
  context.font = '700 58px "Segoe UI", sans-serif'
  context.fillText('委托书材料上传', 110, 340)
  context.fillStyle = '#64748b'
  context.font = '400 32px "Segoe UI", sans-serif'
  context.fillText('请上传护照翻译件、PIN 码和落地签', 110, 402)

  context.fillStyle = '#f8fafc'
  drawRoundRect(context, 150, 500, 600, 600, 36)
  context.fill()
  context.fillStyle = '#ffffff'
  drawRoundRect(context, 190, 540, 520, 520, 28)
  context.fill()
  context.drawImage(qrCanvas, 225, 575, 450, 450)

  context.fillStyle = '#0f172a'
  context.font = '700 34px "Segoe UI", sans-serif'
  context.textAlign = 'center'
  context.fillText('微信扫码上传委托书材料', 450, 1080)
  context.textAlign = 'left'

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 1))
  if (!blob) {
    message.error('分享图片生成失败')
    return
  }

  try {
    if (navigator.clipboard && 'ClipboardItem' in window) {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      message.success('分享图片已复制，可直接粘贴发送给微信好友')
      return
    }
  } catch {
    // 复制图片能力依赖浏览器权限，失败时走下载兜底。
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'material-collection-share.png'
  link.click()
  URL.revokeObjectURL(url)
  message.info('当前浏览器不支持复制图片，已下载分享图片')
}

export function AdminOrdersPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<InvitationListItem[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  const loadRows = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/invitations', { headers: adminHeaders() })
      if (!response.ok) throw new Error('加载资料列表失败')
      setRows(await response.json())
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载资料列表失败')
    } finally {
      setLoading(false)
    }
  }

  const summary = {
    total: rows.length,
    pending: rows.filter((row) => row.status !== 'completed').length,
    completed: rows.filter((row) => row.status === 'completed').length,
  }

  const visibleRows = useMemo(
    () =>
      rows
        .filter((row) => {
          if (statusFilter === 'all') return true
          if (statusFilter === 'pending_internal_confirm') return row.status !== 'completed'
          return row.status === statusFilter
        })
        .sort((a, b) => {
          const aRank = statusOrder.includes(a.status) ? statusOrder.indexOf(a.status) : statusOrder.length
          const bRank = statusOrder.includes(b.status) ? statusOrder.indexOf(b.status) : statusOrder.length
          const statusDiff = aRank - bRank
          if (statusDiff !== 0) return statusDiff
          return new Date(b.latest_submitted_at || b.updated_at).getTime() - new Date(a.latest_submitted_at || a.updated_at).getTime()
        }),
    [rows, statusFilter],
  )

  useEffect(() => {
    void loadRows()
  }, [])

  return (
    <Space direction="vertical" size={22} className="page-stack admin-workspace">
      <section className="admin-hero">
        <div>
          <Typography.Text className="eyebrow">公司注册</Typography.Text>
          <Typography.Title level={2}>资料台账</Typography.Title>
          <Typography.Text type="secondary">客户提交后进入台账。点击记录查看提交信息，再进入编辑页完善资料。</Typography.Text>
        </div>
      </section>

      <section className="ledger-shell">
        <div className="ledger-summary">
          <button type="button" onClick={() => setStatusFilter('all')}>
            <span>全部资料</span>
            <strong>{summary.total}</strong>
          </button>
          <button type="button" onClick={() => setStatusFilter('pending_internal_confirm')}>
            <span>待整理</span>
            <strong>{summary.pending}</strong>
          </button>
          <button type="button" onClick={() => setStatusFilter('completed')}>
            <span>已归档</span>
            <strong>{summary.completed}</strong>
          </button>
        </div>

        <Card className="ledger-card">
          <div className="ledger-toolbar">
            <div className="status-segment">
              {statusFilters.map((item) => (
                <button
                  className={statusFilter === item.value ? 'active' : ''}
                  key={item.value}
                  type="button"
                  onClick={() => setStatusFilter(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <Typography.Text type="secondary">共 {visibleRows.length} 条</Typography.Text>
          </div>

          <div className="ledger-list">
            <div className="ledger-head">
              <span>状态</span>
              <span>联系人</span>
              <span>公司名称</span>
              <span>最近提交</span>
              <span />
            </div>
            {visibleRows.map((row) => (
              <button className="ledger-row" key={row.id} type="button" onClick={() => navigate(`/admin/orders/${row.id}`)}>
                <span>
                  <StatusTag status={row.status} />
                </span>
                <div>
                  <strong>{row.contact_name || row.contact_mobile || '未填写联系人'}</strong>
                  {row.remark ? <em>{row.remark}</em> : null}
                </div>
                <span>{row.company_name || '未填写公司名称'}</span>
                <span>{displayTime(row.latest_submitted_at)}</span>
                <span className="ledger-arrow">›</span>
              </button>
            ))}
            {!loading && visibleRows.length === 0 ? <div className="empty-follow-list">暂无客户资料</div> : null}
            {loading ? <div className="empty-follow-list">资料加载中...</div> : null}
          </div>
        </Card>
      </section>
    </Space>
  )
}

export function AdminOrderDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [detail, setDetail] = useState<InvitationDetail | null>(null)
  const [materials, setMaterials] = useState<MaterialSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [startingMaterials, setStartingMaterials] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const shareQrRef = useRef<HTMLDivElement>(null)
  const customerInfoConfirmed = detail?.status === 'completed'

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([fetchDetail(id), fetchMaterials(id)])
      .then(([detailData, materialData]) => {
        setDetail(detailData)
        setMaterials(materialData)
      })
      .catch((error) => message.error(error instanceof Error ? error.message : '加载资料详情失败'))
      .finally(() => setLoading(false))
  }, [id])

  const reviewMaterial = async (materialType: string, status: 'approved' | 'rejected') => {
    if (!id) return
    try {
      const response = await fetch(`/api/admin/invitations/${id}/materials/${materialType}/review`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({
          status,
          review_comment: status === 'rejected' ? '材料不清晰或不符合要求，请重新上传。' : null,
        }),
      })
      if (!response.ok) throw new Error('材料核对失败')
      setMaterials((await response.json()) as MaterialSummary)
      setDetail(await fetchDetail(id))
      message.success(status === 'approved' ? '材料已通过' : '已要求客户重传')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '材料核对失败')
    }
  }

  const materialLink = detail ? `${window.location.origin}/i/${detail.token}/materials` : ''

  const confirmCustomerInfo = async () => {
    if (!detail) return
    try {
      const response = await fetch(`/api/admin/invitations/${detail.id}`, {
        method: 'PATCH',
        headers: adminHeaders(),
        body: JSON.stringify({ status: 'completed', remark: detail.remark || null }),
      })
      if (!response.ok) throw new Error('确认客户资料失败')
      setDetail((await response.json()) as InvitationDetail)
      message.success('客户资料已确认')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '确认客户资料失败')
    }
  }

  const startMaterials = async () => {
    if (!id || !customerInfoConfirmed) return
    setStartingMaterials(true)
    try {
      const response = await fetch(`/api/admin/invitations/${id}/materials/start`, {
        method: 'POST',
        headers: adminHeaders(),
      })
      if (!response.ok) throw new Error('发起委托书材料收集失败')
      setMaterials((await response.json()) as MaterialSummary)
      setShareOpen(true)
      message.success('委托书材料收集已发起')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '发起委托书材料收集失败')
    } finally {
      setStartingMaterials(false)
    }
  }

  if (loading || !detail) {
    return <Card className="detail-page-card">资料加载中...</Card>
  }

  const fields = submittedFields(detail)

  return (
    <Space direction="vertical" size={20} className="page-stack admin-workspace">
      <section className="detail-hero">
        <div className="detail-topline">
          <Button onClick={() => navigate('/admin/orders')}>返回列表</Button>
        </div>
        <div className="detail-title-row">
          <div>
            <Typography.Text className="eyebrow">提交信息</Typography.Text>
            <Typography.Title level={2}>{detail.company_name || '未填写公司名称'}</Typography.Title>
            <Typography.Text type="secondary">按步骤核对客户资料，确认无误后再发起委托书材料收集。</Typography.Text>
          </div>
          <Button onClick={() => navigate(`/admin/orders/${detail.id}/edit`)}>
            编辑资料
          </Button>
        </div>
      </section>

      <Card className="detail-page-card">
        <div className="workflow-steps">
          <section className={`workflow-step-card ${customerInfoConfirmed ? 'done' : 'active'}`}>
            <div className="workflow-step-index">1</div>
            <div>
              <strong>客户资料核对</strong>
              <span>检查公司、股东、法人和联系方式。无误后确认，进入委托书材料收集。</span>
            </div>
            <Space>
              <StatusTag status={detail.status} />
              {customerInfoConfirmed ? (
                <Tag color="green">已确认</Tag>
              ) : (
                <Button type="primary" onClick={() => void confirmCustomerInfo()}>
                  确认资料无误
                </Button>
              )}
            </Space>
          </section>

          <section className={`workflow-step-card ${customerInfoConfirmed ? 'active' : 'locked'}`}>
            <div className="workflow-step-index">2</div>
            <div>
              <strong>委托书材料收集</strong>
              <span>客户资料确认后，手动发起护照翻译件、PIN 码、落地签三项材料上传。</span>
            </div>
            {materials?.total ? (
              <Button onClick={() => setShareOpen(true)}>分享上传链接</Button>
            ) : (
              <Button
                type="primary"
                disabled={!customerInfoConfirmed}
                loading={startingMaterials}
                onClick={() => void startMaterials()}
              >
                发起委托书材料收集
              </Button>
            )}
          </section>
        </div>
      </Card>

      <Card className="detail-page-card">
        <div className="detail-card-heading">
          <div>
            <Typography.Title level={4}>客户资料摘要</Typography.Title>
            <Typography.Text type="secondary">用于快速确认当前记录是否已经可以进入下一步。</Typography.Text>
          </div>
        </div>
        <div className="detail-summary-grid">
          <div>
            <span>状态</span>
            <StatusTag status={detail.status} />
          </div>
          <div>
            <span>联系人</span>
            <strong>{detail.contact_name || fieldValue(fields, 'name')}</strong>
          </div>
          <div>
            <span>联系电话</span>
            <strong>{detail.contact_mobile || fieldValue(fields, 'mobile')}</strong>
          </div>
          <div>
            <span>最近提交</span>
            <strong>{displayTime(detail.latest_submitted_at)}</strong>
          </div>
        </div>
      </Card>

      <Card className="detail-page-card">
        <div className="material-review-head">
          <div>
            <Typography.Title level={4}>委托书材料</Typography.Title>
            <Typography.Text type="secondary">
              第一步确认后，这里会显示委托书三项材料的上传和核对状态。
            </Typography.Text>
          </div>
          <Space>
            {materials?.total ? (
              <>
                <Tag color={materials.missing ? 'orange' : materials.approved === materials.total ? 'green' : 'blue'}>
                  {materials.approved}/{materials.total} 已通过
                </Tag>
                <Button onClick={() => setShareOpen(true)}>分享上传链接</Button>
              </>
            ) : (
              <Button
                type="primary"
                disabled={!customerInfoConfirmed}
                loading={startingMaterials}
                onClick={() => void startMaterials()}
              >
                发起委托书材料收集
              </Button>
            )}
          </Space>
        </div>

        {materials?.total ? <div className="material-review-grid">
          {materials?.materials.map((material) => (
            <article className={`material-review-card status-${material.status}`} key={material.material_type}>
              <div className="material-review-card-main">
                <strong>{material.material_name}</strong>
                <Tag>{materialStatusText[material.status] || material.status}</Tag>
              </div>
              <p>{material.description}</p>
              <div className="material-review-file">
                {material.file ? (
                  <>
                    <strong>{material.file.file_name}</strong>
                    <span>{formatFileSize(material.file.file_size)}</span>
                  </>
                ) : (
                  <span>客户尚未上传</span>
                )}
              </div>
              {material.review_comment ? <Alert type="warning" message={material.review_comment} /> : null}
              <Space>
                <Button
                  disabled={!material.file || material.status === 'approved'}
                  onClick={() => void reviewMaterial(material.material_type, 'approved')}
                >
                  通过
                </Button>
                <Button
                  danger
                  disabled={!material.file}
                  onClick={() => void reviewMaterial(material.material_type, 'rejected')}
                >
                  要求重传
                </Button>
              </Space>
            </article>
          ))}
        </div> : (
          <div className="material-not-started">
            <strong>尚未发起</strong>
            <span>
              {customerInfoConfirmed
                ? '点击上方按钮生成同一客户的委托书材料上传入口。'
                : '请先完成客户资料核对并确认无误。'}
            </span>
          </div>
        )}
      </Card>

      <Modal
        className="share-modal"
        footer={null}
        onCancel={() => setShareOpen(false)}
        open={shareOpen}
        title="分享委托书材料上传链接"
        width={720}
      >
        <div className="share-modal-grid">
          <div className="share-preview">
            <Typography.Text className="share-label">分享图片预览</Typography.Text>
            <div className="share-poster-preview">
              <div className="share-poster-icon">
                <img src="/wechat-share.png" alt="委托书材料上传" />
              </div>
              <div>
                <strong>委托书材料上传</strong>
                <span>请上传护照翻译件、PIN 码和落地签</span>
              </div>
              <div className="share-poster-qr" ref={shareQrRef}>
                <QRCode value={materialLink} size={168} bordered={false} type="canvas" />
              </div>
              <em>微信扫码上传委托书材料</em>
            </div>
            <Typography.Paragraph type="secondary">
              这个链接挂在当前客户资料下，不会在资料台账里生成新的并列记录。
            </Typography.Paragraph>
          </div>

          <div className="share-tools">
            <Typography.Text className="share-label">发送方式</Typography.Text>
            <div className="share-method-card">
              <strong>推荐：复制分享图片</strong>
              <span>发送到微信后，客户扫码即可打开委托书材料上传页。</span>
            </div>
            <div className="share-actions">
              <Button type="primary" onClick={() => void copyMaterialShareImage(shareQrRef.current)}>
                复制图片
              </Button>
              <Button onClick={() => window.open(materialLink, '_blank', 'noopener,noreferrer')}>预览</Button>
            </div>
          </div>
        </div>
      </Modal>

      {detail.participants.length ? fieldGroups.map((group) => (
        <Card className="detail-page-card" key={group.title}>
          <Typography.Title level={4}>{group.title}</Typography.Title>
          <div className="submitted-field-grid">
            {group.fields.map(([key, label]) => (
              <div className="submitted-field" key={key}>
                <span>{label}</span>
                <p>{fieldValue(fields, key)}</p>
              </div>
            ))}
          </div>
        </Card>
      )) : null}

      {detail.remark ? (
        <Card className="detail-page-card">
          <Typography.Title level={4}>内部备注</Typography.Title>
          <Typography.Paragraph>{detail.remark}</Typography.Paragraph>
        </Card>
      ) : null}
    </Space>
  )
}

export function AdminOrderEditPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [detail, setDetail] = useState<InvitationDetail | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<FollowFormValues>()

  useEffect(() => {
    if (!id) return
    fetchDetail(id)
      .then((data) => {
        setDetail(data)
        form.setFieldsValue(toFormValues(data))
      })
      .catch((error) => message.error(error instanceof Error ? error.message : '加载资料详情失败'))
  }, [form, id])

  const saveDetail = async (values: FollowFormValues) => {
    if (!detail) return
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/invitations/${detail.id}`, {
        method: 'PATCH',
        headers: adminHeaders(),
        body: JSON.stringify({
          status: values.status,
          remark: values.remark || null,
          submitted_fields_json: toSubmittedFields(values),
        }),
      })
      if (!response.ok) throw new Error('保存资料失败')
      message.success(values.status === 'completed' ? '资料已归档' : '资料已保存')
      navigate(`/admin/orders/${detail.id}`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存资料失败')
    } finally {
      setSaving(false)
    }
  }

  if (!detail) {
    return <Card className="detail-page-card">资料加载中...</Card>
  }

  return (
    <Space direction="vertical" size={20} className="page-stack admin-workspace">
      <section className="detail-hero">
        <Button onClick={() => navigate(`/admin/orders/${detail.id}`)}>返回详情</Button>
        <div>
          <Typography.Text className="eyebrow">内部编辑</Typography.Text>
          <Typography.Title level={2}>编辑登记信息</Typography.Title>
          <Typography.Text type="secondary">这里用于修正客户提交内容，确认无误后归档。</Typography.Text>
        </div>
        <Button
          onClick={() => {
            const values = form.getFieldsValue()
            void saveDetail({ ...values, status: 'completed' })
          }}
          loading={saving}
        >
          保存并归档
        </Button>
      </section>

      <Card className="edit-page-card">
        <Form form={form} layout="vertical" onFinish={saveDetail}>
          <div className="edit-form-grid">
            <Form.Item label="整理状态" name="status" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'pending_internal_confirm', label: '待整理' },
                  { value: 'completed', label: '已归档' },
                ]}
              />
            </Form.Item>
            <Form.Item label="填写人姓名" name="name">
              <Input />
            </Form.Item>
            <Form.Item label="填写人联系电话" name="mobile">
              <Input />
            </Form.Item>
            <Form.Item label="公司名称" name="full_company_name">
              <Input />
            </Form.Item>
            <Form.Item label="法律地址" name="legal_address">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item label="注册资金" name="registered_capital">
              <Input />
            </Form.Item>
            <Form.Item label="总经理/法人代表姓名" name="director_name">
              <Input />
            </Form.Item>
            <Form.Item label="联系电话" name="director_phone">
              <Input />
            </Form.Item>
            <Form.Item label="法人/总经理地址" name="director_address">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item label="股东信息" name="shareholder_note" className="wide-form-item">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item label="主要经营范围" name="business_scope" className="wide-form-item">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item label="税务制度" name="tax_regime">
              <Input />
            </Form.Item>
            <Form.Item label="是否需要银行开户" name="need_bank_account">
              <Select allowClear options={[{ value: '是' }, { value: '否' }]} />
            </Form.Item>
            <Form.Item label="是否需要代理记账" name="need_accounting">
              <Select allowClear options={[{ value: '是' }, { value: '否' }]} />
            </Form.Item>
            <Form.Item label="签证" name="visa_type">
              <Input />
            </Form.Item>
            <Form.Item label="内部备注" name="remark" className="wide-form-item">
              <Input.TextArea rows={3} placeholder="记录资料修正点、缺失项或归档说明" />
            </Form.Item>
          </div>
          <div className="edit-action-row">
            <Button onClick={() => navigate(`/admin/orders/${detail.id}`)}>取消</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              保存资料
            </Button>
          </div>
        </Form>
      </Card>
    </Space>
  )
}
