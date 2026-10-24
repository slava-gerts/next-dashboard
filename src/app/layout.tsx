import GraphQLProvider from './graphql-provider'

import './globals.css'

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <GraphQLProvider>{children}</GraphQLProvider>
      </body>
    </html>
  )
}
