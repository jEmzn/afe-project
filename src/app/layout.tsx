export const metadata = {
  title: 'DemoAssist',
  description: 'Eldercare Companion สำหรับการดูแลผู้สูงอายุที่เชื่อมต่อกับสมาร์ทวอทของเรา',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}


// dsads