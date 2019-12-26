import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'

export class UpdateManyEntityTestNoDecorator extends LegatoEntity {
	name: string

	constructor(name = 'john') {
		super()
		this.name = name
	}
}

export class UpdateManyEntityTest extends LegatoEntity {
	@LegatoField()
	name: string

	noDecorator: string = 'notSaved'

	constructor(name = 'john') {
		super()
		this.name = name
	}
}
