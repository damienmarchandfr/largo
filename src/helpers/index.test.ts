import { LegatoEntity } from '../entity'
import { LegatoField } from '../decorators/field.decorator'
import { LegatoIndex } from '../decorators/index.decorator'
import { getLegatoPartial } from '.'
import { LegatoRelation } from '../decorators/relation.decorator'
import { ObjectID } from 'mongodb'

describe('getLegatoPartial function', () => {
	it('should not return field without decorator', () => {
		class UserFull extends LegatoEntity {
			@LegatoIndex({
				unique: false,
			})
			firstname: string

			@LegatoField()
			lastname: string

			@LegatoRelation({
				populatedKey: 'relation',
				targetType: UserFull,
			})
			relationId: ObjectID

			age: number

			constructor() {
				super()
				this.firstname = 'Damien'
				this.lastname = 'Marchand'
				this.age = 18
				this.relationId = new ObjectID()
			}
		}

		const user = new UserFull()

		const partial = getLegatoPartial(user, 'UserFull')

		expect(partial).toStrictEqual({
			lastname: 'Marchand',
			firstname: 'Damien',
			relationId: user.relationId,
		})
	})

	it('should not return empty field', () => {
		class UserFullEmptyField extends LegatoEntity {
			@LegatoField()
			firstname: string

			@LegatoField()
			age?: number

			constructor() {
				super()
				this.firstname = 'Damien'
			}
		}

		const partial = getLegatoPartial(
			new UserFullEmptyField(),
			'UserFullEmptyField'
		)

		expect(partial).toStrictEqual({
			firstname: 'Damien',
		})
	})

	it('should return empty object if no legato decorators', () => {
		class UserFullNoDecorator extends LegatoEntity {
			constructor() {
				super()
			}
		}

		const partial = getLegatoPartial(
			new UserFullNoDecorator(),
			'UserFullNoDecorator'
		)

		expect(partial).toStrictEqual({})
	})
})
