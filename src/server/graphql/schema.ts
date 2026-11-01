import { createSchema } from 'graphql-yoga'
import { GraphQLError } from 'graphql'

import {
	createSuggestion,
	getSuggestionById,
	getSuggestionsPage,
	setSuggestionVote,
	SuggestionError,
} from '@/server/suggestions/service'

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

		type PageInfo {
			hasNextPage: Boolean!
			endCursor: String
		}

		type SuggestionConnection {
			nodes: [Suggestion!]!
			pageInfo: PageInfo!
		}

		type Query {
			suggestion(id: ID!): Suggestion
			suggestions(first: Int! = 10, after: String): SuggestionConnection!
			viewer: User
		}

		input CreateSuggestionInput {
			title: String!
		}

		type Mutation {
			setVote(suggestionId: ID!, voted: Boolean!): Suggestion!
			createSuggestion(input: CreateSuggestionInput!): Suggestion!
		}
	`,
	resolvers: {
		Query: {
			suggestion(_parent, args, context) {
				return getSuggestionById(args.id, context.viewer?.id ?? null)
			},

			suggestions(_parent, args, context) {
				if (args.first < 1 || args.first > 50) {
					throw new GraphQLError('first must be between 1 and 50', {
						extensions: { code: 'BAD_USER_INPUT' },
					})
				}

				return getSuggestionsPage(args.first, args.after ?? null, context.viewer?.id ?? null)
			},

			viewer(_parent, _args, context) {
				return context.viewer
			}
		},
		Mutation: {
			async createSuggestion(_parent, args, context) {
				try {
					return await createSuggestion(args.input.title, context.viewer)
				} catch (error) {
					if (error instanceof SuggestionError) {
						throw new GraphQLError(error.message, {
							extensions: {
								code: error.code
							},
						})
					}

					throw error
				}
			},
			async setVote(_parent, args, context) {
				let suggestion = null

				try {
					suggestion = await setSuggestionVote(
						args.suggestionId,
						context.viewer,
						args.voted,
					)
				} catch (error) {
					if (error instanceof SuggestionError) {
						throw new GraphQLError(error.message, {
							extensions: {
								code: error.code
							},
						})
					}

					throw error
				}

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
