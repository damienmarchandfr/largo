import { ParentEntityTest } from './enities/Parent.entity.test'
import { ChildEntityTest } from './enities/Child.entity.test'
import { NoChildEntityTest } from './enities/NoChild.entity.test'
import { GetCollectionNameTest } from './enities/GetCollectionName.entity.test'
import { GetCopyTest, GetCopyEmptyTest } from './enities/GetCopy.entity.test'

describe('function getCollectionName', () => {
	const value = new GetCollectionNameTest()
	expect(value.getCollectionName()).toEqual('GetCollectionNameTest')
})

describe('static function getCollectionName', () => {
	expect(GetCollectionNameTest.getCollectionName()).toEqual(
		'GetCollectionNameTest'
	)
})

describe('static function getMetasToCheck', () => {
	const parentMetas = ParentEntityTest.getMetasToCheck()
	expect(parentMetas.parents.length).toEqual(0)
	expect(parentMetas.children.length).toEqual(2)

	const childMetas = ChildEntityTest.getMetasToCheck()
	expect(childMetas.parents.length).toEqual(4)
	expect(childMetas.children.length).toEqual(4)

	const noChildMetas = NoChildEntityTest.getMetasToCheck()
	expect(noChildMetas.parents.length).toEqual(2)
	expect(noChildMetas.children.length).toEqual(0)
})

describe('getCopy method', () => {
	it('should init copy has a plain object without any methods', () => {
		expect(new GetCopyEmptyTest().getCopy()).toStrictEqual({})
		expect(new GetCopyTest().getCopy()).toStrictEqual({
			name: 'John',
		})
	})

	it('should not return updates', () => {
		const obj = new GetCopyTest()
		expect(obj.getCopy()).toStrictEqual({
			name: 'John',
		})
		obj.name = 'Damien'
		expect(obj.getCopy()).toStrictEqual({
			name: 'John',
		})
	})
})

describe('toPlainObj methods', () => {
	it('should return plain object', () => {
		expect(new GetCopyTest().toPlainObj()).toStrictEqual({
			name: 'John',
		})
	})

	it('should return updates', () => {
		const obj = new GetCopyTest()
		expect(obj.toPlainObj()).toStrictEqual({
			name: 'John',
		})
		obj.name = 'Damien'
		expect(obj.toPlainObj()).toStrictEqual({
			name: 'Damien',
		})
	})
})
