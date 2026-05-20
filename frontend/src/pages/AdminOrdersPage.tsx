import { Button, Card, Form, Input, Modal, QRCode, Select, Space, Tag, Typography, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
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

function StatusTag({ status }: { status: string }) {
  return <Tag color={statusColor[status] || 'default'}>{statusText[status] || status}</Tag>
}

export function AdminOrdersPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<InvitationListItem[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const publicIntakeLink = `${window.location.origin}/i/company-registration`

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

  const copyPublicLink = async () => {
    await navigator.clipboard.writeText(publicIntakeLink)
    message.success('客户登记链接已复制，可直接发给客户')
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
        <Space>
          <Button onClick={() => window.open(publicIntakeLink, '_blank', 'noopener,noreferrer')}>预览登记表</Button>
          <Button type="primary" onClick={() => setShareOpen(true)}>
            分享登记链接
          </Button>
        </Space>
      </section>

      <Modal
        className="share-modal"
        footer={null}
        onCancel={() => setShareOpen(false)}
        open={shareOpen}
        title="分享客户登记链接"
        width={720}
      >
        <div className="share-modal-grid">
          <div className="share-preview">
            <Typography.Text className="share-label">微信卡片预览</Typography.Text>
            <div className="wechat-card-preview">
              <div>
                <strong>公司注册信息登记</strong>
                <span>请按要求补充公司登记所需信息</span>
              </div>
              <img src="/wechat-share.png" alt="公司注册信息登记分享图" />
            </div>
            <Typography.Paragraph type="secondary">
              直接从电脑后台无法强制打开微信好友列表。用手机微信扫码打开后，再点右上角转发，会使用当前卡片样式。
            </Typography.Paragraph>
          </div>

          <div className="share-tools">
            <Typography.Text className="share-label">发送给客户</Typography.Text>
            <div className="share-qr-box">
              <QRCode value={publicIntakeLink} size={152} bordered={false} />
            </div>
            <div className="share-link-box">{publicIntakeLink}</div>
            <div className="share-actions">
              <Button type="primary" onClick={copyPublicLink}>
                复制链接
              </Button>
              <Button onClick={() => window.open(publicIntakeLink, '_blank', 'noopener,noreferrer')}>预览</Button>
            </div>
          </div>
        </div>
      </Modal>

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
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchDetail(id)
      .then(setDetail)
      .catch((error) => message.error(error instanceof Error ? error.message : '加载资料详情失败'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading || !detail) {
    return <Card className="detail-page-card">资料加载中...</Card>
  }

  const fields = submittedFields(detail)

  return (
    <Space direction="vertical" size={20} className="page-stack admin-workspace">
      <section className="detail-hero">
        <Button onClick={() => navigate('/admin/orders')}>返回列表</Button>
        <div>
          <Typography.Text className="eyebrow">提交信息</Typography.Text>
          <Typography.Title level={2}>{detail.company_name || '未填写公司名称'}</Typography.Title>
          <Typography.Text type="secondary">先核对客户提交的信息，再进入编辑页修正和归档。</Typography.Text>
        </div>
        <Button type="primary" onClick={() => navigate(`/admin/orders/${detail.id}/edit`)}>
          编辑资料
        </Button>
      </section>

      <Card className="detail-page-card">
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

      {fieldGroups.map((group) => (
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
      ))}

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
