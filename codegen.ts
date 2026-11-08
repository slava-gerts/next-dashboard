import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
	schema: [
		{
			'src/server/graphql/schema.ts': {
				noRequire: true,
			},
		},
	],
	generates: {
		'src/server/graphql/generated.ts': {
			plugins: ['typescript', 'typescript-resolvers'],
			config: {
				contextType: './context#GraphQLContext',
				useTypeImports: true,
				mappers: {
					Suggestion: '../suggestions/service#SuggestionData'
				}
			},
		},
		'src/graphql/generated.ts': {
			documents: ['src/graphql/**/*.graphql'],
			plugins: ['typescript-operations', 'typed-document-node'],
			config: {
				useTypeImports: true,
			}
		},
	},
}

export default config
