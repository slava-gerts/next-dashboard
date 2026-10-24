import 'server-only'

import { betterAuth } from 'better-auth'
import { prismaAdapter } from '@better-auth/prisma-adapter'

import { prisma } from '@/server/db'

function requiredEnv(name: string): string {
	const value = process.env[name]

	if (!value) {
		throw new Error(`Environment variable ${name} is not set`)
	}

	return value
}

export const auth = betterAuth({
	baseURL: requiredEnv('BETTER_AUTH_URL'),
	secret: requiredEnv('BETTER_AUTH_SECRET'),
	
	database: prismaAdapter(prisma, {
		provider: 'postgresql',
	}),

	socialProviders: {
		google: {
			clientId: requiredEnv('GOOGLE_CLIENT_ID'),
			clientSecret: requiredEnv('GOOGLE_CLIENT_SECRET'),
		},
	},
})
