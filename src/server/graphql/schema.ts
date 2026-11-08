import { createSchema } from 'graphql-yoga'
import { GraphQLError } from 'graphql'

import { CommentError, createComment, getCommentsPage } from '@/server/comments/service'
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
			comments(first: Int! = 10, after: String): CommentConnection!
		}

		type User {
			id: ID!
			name: String!
		}

		type Comment {
			id: ID!
			body: String!
			createdAt: String!
			suggestionId: ID!
			author: User!
		}

		type PageInfo {
			hasNextPage: Boolean!
			endCursor: String
		}

		type SuggestionConnection {
			nodes: [Suggestion!]!
			pageInfo: PageInfo!
		}

		type CommentConnection {
			nodes: [Comment!]!
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

		input CreateCommentInput {
			suggestionId: ID!
			body: String!
		}

		type Mutation {
			setVote(suggestionId: ID!, voted: Boolean!): Suggestion!
			createSuggestion(input: CreateSuggestionInput!): Suggestion!
			createComment(input: CreateCommentInput!): Comment!
		}
	`,
	resolvers: {
		Suggestion: {
			async comments(parent, args) {
				try {
					return await getCommentsPage(parent.id, args.first, args.after ?? null)
				} catch (error) {
					if (error instanceof CommentError) {
						throw new GraphQLError(error.message, {
							extensions: {
								code: error.code,
							},
						})
					}

					throw error
				}
			},
		},
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
			},
			async createComment(_parent, args, context) {
				try {
					return await createComment(args.input.suggestionId, args.input.body, context.viewer)
				} catch (error) {
					if (error instanceof CommentError) {
						throw new GraphQLError(error.message, {
							extensions: {
								code: error.code,
							},
						})
					}

					throw error
				}
			},
		}
	} satisfies Resolvers,
})
