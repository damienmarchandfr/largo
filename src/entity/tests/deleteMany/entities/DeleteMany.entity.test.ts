import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'

export class DeleteManyEntityTestNoDecorator extends LegatoEntity {
	name: string

	constructor(name = 'john') {
		super()
		this.name = name
	}
}

export class DeleteManyEntityTest extends LegatoEntity {
	@LegatoField()
	email: string

	constructor(email: string) {
		super()
		this.email = email
	}
}
