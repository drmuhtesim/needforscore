import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Score'

interface VerifyEmailProps {
  username?: string
  verifyUrl?: string
}

const VerifyEmail = ({ username, verifyUrl }: VerifyEmailProps) => (
  <Html lang="tr" dir="ltr">
    <Head />
    <Preview>{SITE_NAME} hesabını doğrula</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{SITE_NAME}</Heading>
        <Text style={text}>
          {username ? `Merhaba @${username},` : 'Merhaba,'}
        </Text>
        <Text style={text}>
          {SITE_NAME} hesabını oluşturduğun için teşekkürler. Aşağıdaki düğmeye
          tıklayarak e-posta adresini doğrula.
        </Text>
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button href={verifyUrl} style={button}>
            E-postamı doğrula
          </Button>
        </Section>
        <Text style={small}>
          Düğme çalışmazsa şu bağlantıyı tarayıcına yapıştır:
        </Text>
        <Text style={link}>{verifyUrl}</Text>
        <Text style={footer}>
          Bu e-postayı sen istemediysen yok sayabilirsin.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: VerifyEmail,
  subject: `${SITE_NAME} — E-posta doğrulama`,
  displayName: 'E-posta doğrulama',
  previewData: {
    username: 'kijujan',
    verifyUrl: 'https://needforscore.com/verify-email?token=sample',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '28px', fontWeight: 'bold', color: '#0a0a0a', margin: '0 0 24px', letterSpacing: '-0.02em' }
const text = { fontSize: '15px', color: '#1f2937', lineHeight: '1.6', margin: '0 0 16px' }
const small = { fontSize: '13px', color: '#6b7280', margin: '24px 0 8px' }
const link = { fontSize: '12px', color: '#16a34a', wordBreak: 'break-all' as const, margin: '0 0 24px' }
const button = {
  backgroundColor: '#16a34a',
  color: '#ffffff',
  padding: '14px 28px',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: 'bold',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#9ca3af', margin: '32px 0 0', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }
