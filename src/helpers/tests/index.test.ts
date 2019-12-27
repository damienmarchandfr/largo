import { getLegatoPartial } from '..'
import { AllDecoratorsTest, NoDecoratorTest } from './helper.entity.test'

describe('getLegatoPartial function', () => {
	it('should not return field without decorator', () => {
		const obj = new AllDecoratorsTest()
		const partial = getLegatoPartial(obj, 'AllDecoratorsTest')

		expect(partial).toStrictEqual({
			index: 'john',
			field: 'john',
			relation: 'john',
		})
	})

	it('should return empty object if no legato decorators', () => {
		const partial = getLegatoPartial(new NoDecoratorTest(), 'NoDecoratorTest')
		expect(partial).toStrictEqual({})
	})
})
