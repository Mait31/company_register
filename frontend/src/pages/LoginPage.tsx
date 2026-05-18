import { Button, Card, Typography } from 'antd'

export function LoginPage() {
  const login = async () => {
    const response = await fetch('/api/wecom/oauth/login')
    const data = await response.json()
    window.location.href = data.login_url
  }

  return (
    <main className="center-page">
      <Card className="login-card">
        <Typography.Title level={3}>企业微信登录</Typography.Title>
        <Typography.Paragraph>第一阶段只允许企业微信自建应用登录。</Typography.Paragraph>
        <Button type="primary" block onClick={login}>
          使用企业微信登录
        </Button>
      </Card>
    </main>
  )
}
