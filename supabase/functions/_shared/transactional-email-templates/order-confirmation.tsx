/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'ForgeDesk'

interface OrderItem {
  product_name: string
  variant_label?: string
  bundle_name?: string | null
  quantity: number
  unit_price_cents: number
}

interface ShippingAddress {
  firstName?: string
  lastName?: string
  line1?: string
  line2?: string | null
  city?: string
  region?: string | null
  postalCode?: string
  country?: string
}

interface OrderConfirmationProps {
  orderNumber?: string
  orderUrl?: string
  status?: string
  placedAt?: string
  items?: OrderItem[]
  subtotalCents?: number
  discountCents?: number
  discountCode?: string | null
  shippingCents?: number
  totalCents?: number
  shippingAddress?: ShippingAddress
  email?: string
}

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format((cents ?? 0) / 100)

const OrderConfirmationEmail = ({
  orderNumber = 'XXXXXXXX',
  orderUrl,
  status = 'paid',
  placedAt,
  items = [],
  subtotalCents = 0,
  discountCents = 0,
  discountCode,
  shippingCents = 0,
  totalCents = 0,
  shippingAddress,
  email,
}: OrderConfirmationProps) => {
  const addr = shippingAddress ?? {}
  const placedLabel = placedAt
    ? new Date(placedAt).toLocaleString('en-US', {
        dateStyle: 'long',
        timeStyle: 'short',
      })
    : ''

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Order #{orderNumber} confirmed — {formatPrice(totalCents)}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brandMark}>{SITE_NAME.toUpperCase()}</Text>

          <Heading style={h1}>Thank you for your order.</Heading>
          <Text style={lede}>
            We've received your payment and your order is being prepared. A
            shipping confirmation will follow once it leaves our workshop.
          </Text>

          <Section style={metaBlock}>
            <Text style={metaRow}>
              <span style={metaLabel}>Order</span>
              <span style={metaValue}>#{orderNumber}</span>
            </Text>
            {placedLabel && (
              <Text style={metaRow}>
                <span style={metaLabel}>Placed</span>
                <span style={metaValue}>{placedLabel}</span>
              </Text>
            )}
            <Text style={metaRow}>
              <span style={metaLabel}>Status</span>
              <span style={statusValue}>{status.toUpperCase()}</span>
            </Text>
          </Section>

          {orderUrl && (
            <Section style={ctaSection}>
              <Button href={orderUrl} style={button}>
                View order
              </Button>
            </Section>
          )}

          <Hr style={hr} />

          <Heading as="h2" style={h2}>
            Items
          </Heading>
          <Section>
            {items.map((it, idx) => (
              <Section key={idx} style={itemRow}>
                <Text style={itemName}>
                  {it.quantity} × {it.product_name}
                </Text>
                {it.bundle_name && (
                  <Text style={itemBundle}>{it.bundle_name}</Text>
                )}
                {it.variant_label && (
                  <Text style={itemVariant}>{it.variant_label}</Text>
                )}
                <Text style={itemPrice}>
                  {formatPrice(it.unit_price_cents * it.quantity)}
                </Text>
              </Section>
            ))}
          </Section>

          <Hr style={hr} />

          <Heading as="h2" style={h2}>
            Totals
          </Heading>
          <Section style={totalsBlock}>
            <Text style={totalsRow}>
              <span style={totalsLabel}>Subtotal</span>
              <span style={totalsValue}>{formatPrice(subtotalCents)}</span>
            </Text>
            {discountCents > 0 && (
              <Text style={totalsRow}>
                <span style={totalsLabel}>
                  Discount{discountCode ? ` (${discountCode})` : ''}
                </span>
                <span style={totalsValue}>− {formatPrice(discountCents)}</span>
              </Text>
            )}
            <Text style={totalsRow}>
              <span style={totalsLabel}>Shipping</span>
              <span style={totalsValue}>
                {shippingCents === 0 ? 'Free' : formatPrice(shippingCents)}
              </span>
            </Text>
            <Text style={grandTotalRow}>
              <span style={grandTotalLabel}>Total</span>
              <span style={grandTotalValue}>{formatPrice(totalCents)}</span>
            </Text>
          </Section>

          {(addr.line1 || addr.city) && (
            <>
              <Hr style={hr} />
              <Heading as="h2" style={h2}>
                Shipping to
              </Heading>
              <Section style={addressBlock}>
                <Text style={addressLine}>
                  {addr.firstName} {addr.lastName}
                </Text>
                {addr.line1 && <Text style={addressLine}>{addr.line1}</Text>}
                {addr.line2 && <Text style={addressLine}>{addr.line2}</Text>}
                <Text style={addressLine}>
                  {[addr.city, addr.region, addr.postalCode]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
                {addr.country && (
                  <Text style={addressLine}>{addr.country}</Text>
                )}
                {email && <Text style={addressEmail}>{email}</Text>}
              </Section>
            </>
          )}

          <Hr style={hr} />

          <Text style={footer}>
            Questions? Just reply to this email — a real person will get back
            to you. Built to last, in your space.
          </Text>
          <Text style={footerSign}>— The {SITE_NAME} team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: OrderConfirmationEmail,
  subject: (data: Record<string, any>) =>
    `Order #${data?.orderNumber ?? ''} confirmed — ${SITE_NAME}`,
  displayName: 'Order confirmation',
  previewData: {
    orderNumber: 'A1B2C3D4',
    orderUrl: 'https://forgedesk.example.com/account/orders/preview',
    status: 'paid',
    placedAt: new Date().toISOString(),
    items: [
      {
        product_name: 'Linear Desk',
        variant_label: 'Large · 110 × 50 cm · Graphite',
        quantity: 1,
        unit_price_cents: 89000,
      },
      {
        product_name: 'Pivot Lamp',
        variant_label: 'Brass',
        bundle_name: 'Studio Bundle',
        quantity: 2,
        unit_price_cents: 14500,
      },
    ],
    subtotalCents: 118000,
    discountCents: 11800,
    discountCode: 'FORGE10',
    shippingCents: 0,
    totalCents: 106200,
    shippingAddress: {
      firstName: 'Alex',
      lastName: 'Reeve',
      line1: '241 Gallery Row',
      line2: 'Studio 4',
      city: 'Brooklyn',
      region: 'NY',
      postalCode: '11201',
      country: 'United States',
    },
    email: 'alex@example.com',
  },
} satisfies TemplateEntry

// ----- Styles (Paper & Ink: warm paper, deep ink, ember accent) -----

const PAPER = '#ffffff'
const INK = '#141414'
const MUTED = '#5b554d'
const SURFACE = '#f5f3ee'
const BORDER = '#d8d3c9'
const ACCENT = '#c45a1f'

const main: React.CSSProperties = {
  backgroundColor: PAPER,
  fontFamily:
    '"Helvetica Neue", Helvetica, Arial, "Liberation Sans", sans-serif',
  margin: 0,
  padding: '24px 0',
  color: INK,
}

const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 28px',
  backgroundColor: PAPER,
}

const brandMark: React.CSSProperties = {
  fontSize: '11px',
  letterSpacing: '0.28em',
  color: INK,
  margin: '0 0 32px',
  fontWeight: 700,
}

const h1: React.CSSProperties = {
  fontSize: '28px',
  lineHeight: '1.15',
  color: INK,
  margin: '0 0 12px',
  fontWeight: 600,
  letterSpacing: '-0.01em',
}

const h2: React.CSSProperties = {
  fontSize: '11px',
  letterSpacing: '0.18em',
  color: MUTED,
  margin: '24px 0 12px',
  fontWeight: 600,
  textTransform: 'uppercase',
}

const lede: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: MUTED,
  margin: '0 0 28px',
}

const metaBlock: React.CSSProperties = {
  border: `1px solid ${BORDER}`,
  backgroundColor: SURFACE,
  padding: '16px 18px',
  margin: '0 0 24px',
}

const metaRow: React.CSSProperties = {
  display: 'block',
  margin: '4px 0',
  fontSize: '13px',
}

const metaLabel: React.CSSProperties = {
  display: 'inline-block',
  width: '80px',
  color: MUTED,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  fontSize: '11px',
}

const metaValue: React.CSSProperties = {
  color: INK,
  fontWeight: 600,
}

const statusValue: React.CSSProperties = {
  color: ACCENT,
  fontWeight: 700,
  letterSpacing: '0.12em',
  fontSize: '12px',
}

const ctaSection: React.CSSProperties = {
  margin: '0 0 24px',
}

const button: React.CSSProperties = {
  backgroundColor: INK,
  color: PAPER,
  fontSize: '13px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  padding: '14px 22px',
  textDecoration: 'none',
  display: 'inline-block',
  borderRadius: '2px',
  fontWeight: 600,
}

const hr: React.CSSProperties = {
  border: 'none',
  borderTop: `1px solid ${BORDER}`,
  margin: '20px 0',
}

const itemRow: React.CSSProperties = {
  padding: '12px 0',
  borderBottom: `1px solid ${BORDER}`,
}

const itemName: React.CSSProperties = {
  fontSize: '14px',
  color: INK,
  margin: '0 0 2px',
  fontWeight: 600,
}

const itemBundle: React.CSSProperties = {
  fontSize: '11px',
  color: ACCENT,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  margin: '0 0 2px',
}

const itemVariant: React.CSSProperties = {
  fontSize: '12px',
  color: MUTED,
  margin: '0 0 4px',
}

const itemPrice: React.CSSProperties = {
  fontSize: '14px',
  color: INK,
  margin: '4px 0 0',
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 600,
}

const totalsBlock: React.CSSProperties = {
  margin: '0 0 8px',
}

const totalsRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  margin: '6px 0',
  fontSize: '13px',
}

const totalsLabel: React.CSSProperties = {
  color: MUTED,
}

const totalsValue: React.CSSProperties = {
  color: INK,
  fontVariantNumeric: 'tabular-nums',
}

const grandTotalRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  margin: '14px 0 0',
  paddingTop: '12px',
  borderTop: `1px solid ${BORDER}`,
  fontSize: '16px',
}

const grandTotalLabel: React.CSSProperties = {
  color: INK,
  fontWeight: 700,
}

const grandTotalValue: React.CSSProperties = {
  color: INK,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
}

const addressBlock: React.CSSProperties = {
  margin: '0 0 8px',
}

const addressLine: React.CSSProperties = {
  fontSize: '13px',
  color: INK,
  margin: '2px 0',
  lineHeight: '1.5',
}

const addressEmail: React.CSSProperties = {
  fontSize: '12px',
  color: MUTED,
  margin: '8px 0 0',
}

const footer: React.CSSProperties = {
  fontSize: '13px',
  color: MUTED,
  lineHeight: '1.6',
  margin: '20px 0 4px',
}

const footerSign: React.CSSProperties = {
  fontSize: '13px',
  color: INK,
  margin: '0',
  fontWeight: 600,
}
