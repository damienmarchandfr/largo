import { LegatoEntity } from '..'


describe('function getCollectionName', () => {
	class User extends LegatoEntity {}
	const user = new User()
	expect(user.getCollectionName()).toEqual('users')
})

describe('static function getCollectionName', () => {
	class UserStatic extends LegatoEntity {}
	expect(UserStatic.getCollectionName()).toEqual('userstatics')
})

describe('getCopy adnd toPlainObj methods', () => {
	it('should init copy as plain object without events', () => {
		class LegatoEntityTestCopy extends LegatoEntity {
			constructor() {
				super()
			}
		}

		const l = new LegatoEntityTestCopy()

		expect(l.getCopy()).toStrictEqual({})
	})

	it('should init copy has a plain object without any methods', () => {
		class LegatoEntityTestCopyPlain extends LegatoEntity {
			constructor() {
				super()
			}

			sayHello() {
				return 'Hello'
			}
		}

		const l = new LegatoEntityTestCopyPlain()
		expect(l.getCopy()).toStrictEqual({})
	})

	it('should be the same result has toPlainObj if constructor is empty', () => {
		class LegatoEntityTestCopyPlain extends LegatoEntity {
			constructor() {
				super()
			}

			sayHello() {
				return 'Hello'
			}
		}

		const l = new LegatoEntityTestCopyPlain()
		expect(l.getCopy()).toStrictEqual(l.toPlainObj())
	})

	it('should not be the same result has toPlainObject if constructor not empty', () => {
		class LegatoEntityTestCopyCstr extends LegatoEntity {
			firstname: string

			constructor() {
				super()
				this.firstname = 'Damien'
			}

			sayHello() {
				return 'Hello'
			}
		}

		const l = new LegatoEntityTestCopyCstr()
		expect(l.getCopy()).toStrictEqual({})
		expect(l.toPlainObj()).toStrictEqual({
			firstname: 'Damien',
		})
	})
})
