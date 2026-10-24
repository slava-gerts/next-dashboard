import 'server-only'

import type { YogaInitialContext } from 'graphql-yoga'

import { auth } from '@/server/auth'

export async function createGraphQLContext({request}: YogaInitialContext) {
	const session = await auth.api.getSession({
		headers: request.headers,
	})

	return {
		viewer: session?.user ?? null,
	}
}

export type GraphQLContext = Awaited<ReturnType<typeof createGraphQLContext>> & YogaInitialContext
