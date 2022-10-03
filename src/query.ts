import qs from 'qs'

export type QueryParser = (params: Record<string, unknown>) => string

export const defaultQueryParser = (params: Record<string, unknown>) =>
	qs.stringify(params, { encode: false, arrayFormat: 'comma' })
