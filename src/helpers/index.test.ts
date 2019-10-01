import { LegatoEntity } from '../entity'
import { LegatoField } from '../decorators/field.decorator'
import { LegatoIndex } from '../decorators/index.decorator'
import { getLegatoPartial } from '.'

describe('getLegatoPartial function', () => {
	it('should not return field without decorator', () => {
		class UserFull extends LegatoEntity {
			@LegatoIndex({
				unique: false,
			})
			firstname: string

			@LegatoField()
			lastname: string

			age: number

			constructor() {
				super()
				this.firstname = 'Damien'
				this.lastname = 'Marchand'
				this.age = 18
			}
		}

		const partial = getLegatoPartial(new UserFull(), 'userfull')

		expect(partial).toStrictEqual({
			lastname: 'Marchand',
			firstname: 'Damien',
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
			'userfullemptyfield'
		)

		expect(partial).toStrictEqual({
			firstname: 'Damien',
		})
	})
})
