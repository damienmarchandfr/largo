import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'

export class UpdateTestWithoutDecorator extends LegatoEntity {
	name: string

	constructor(name = 'john') {
		super()
		this.name = name
	}
}

export class UpdateTest extends LegatoEntity {
	noDecorator?: string

	@LegatoField()
	name: string

	constructor(name = 'john') {
		super()
		this.name = name
	}
}
