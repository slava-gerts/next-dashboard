import { createYoga } from 'graphql-yoga'

import { createGraphQLContext } from '@/server/graphql/context'
import { schema } from '@/server/graphql/schema'

const yoga = createYoga({
	schema,
	graphqlEndpoint: '/api/graphql',
	fetchAPI: { Response },
	graphiql: process.env.NODE_ENV === 'development',
	context: createGraphQLContext,
})

async function handleGraphQL(request: Request) {
	return yoga.handleRequest(request, {})
}

export {
	handleGraphQL as GET,
	handleGraphQL as POST,
	handleGraphQL as OPTIONS,
}
