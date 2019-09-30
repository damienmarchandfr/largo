import { MongODMEntity } from '../entity/entity'
import { MongODMField } from '../decorators/field.decorator'
import { MongODMIndex } from '../decorators/index.decorator'
import { getMongODMPartial } from './helpers'

describe('getMongODMPartial function', () => {
	it('should not return field without decorator', () => {
		class UserFull extends MongODMEntity {
			@MongODMIndex({
				unique: false,
			})
			firstname: string

			@MongODMField()
			lastname: string

			age: number

			constructor() {
				super()
				this.firstname = 'Damien'
				this.lastname = 'Marchand'
				this.age = 18
			}
		}

		const partial = getMongODMPartial(new UserFull(), 'userfull')

		expect(partial).toStrictEqual({
			lastname: 'Marchand',
			firstname: 'Damien',
		})
	})

	it('should not return empty field', () => {
		class UserFullEmptyField extends MongODMEntity {
			@MongODMField()
			firstname: string

			@MongODMField()
			age?: number

			constructor() {
				super()
				this.firstname = 'Damien'
			}
		}

		const partial = getMongODMPartial(
			new UserFullEmptyField(),
			'userfullemptyfield'
		)

		expect(partial).toStrictEqual({
			firstname: 'Damien',
		})
	})
})
