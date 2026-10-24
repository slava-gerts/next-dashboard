import { createSchema } from 'graphql-yoga'
import { GraphQLError } from 'graphql'

import { getSuggestionById, setSuggestionVote } from '@/server/suggestions/service' 

import type { GraphQLContext} from './context'
import type { Resolvers } from './generated'

export const schema = createSchema<GraphQLContext>({
	typeDefs: /* GraphQL */ `
		type Suggestion {
			id: ID!
			title: String!
			voteCount: Int!
			viewerHasVoted: Boolean!
		}

		type User {
			id: ID!
			name: String!
		}

		type Query {
			suggestion(id: ID!): Suggestion
			viewer: User
		}

		type Mutation {
			setVote(suggestionId: ID!, voted: Boolean!): Suggestion!
		}
	`,
	resolvers: {
		Query: {
			suggestion(_parent, args, context) {
				return getSuggestionById(args.id, context.viewer?.id ?? null)
			},

			viewer(_parent, _args, context) {
				return context.viewer
			}
		},
		Mutation: {
			async setVote(_parent, args, context) {
				if (!context.viewer) {
					throw new GraphQLError('Sign in to vote', {
						extensions: {
							code: 'UNAUTHENTICATED',
						},
					})
				}

				const suggestion = await setSuggestionVote(
					args.suggestionId,
					context.viewer.id,
					args.voted,
				)

				if (!suggestion) {
					throw new GraphQLError('Suggestion not found', {
						extensions: {
							code: 'NOT_FOUND',
						},
					})
				}

				return suggestion
			}
		}
	} satisfies Resolvers,
})
