export * from '~/builder'

type Message<T> = { content: T }

export function foo(bar: Message<string>) {
	return bar.content
}
