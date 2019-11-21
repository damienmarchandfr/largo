import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'

export class FindOneEntityTest extends LegatoEntity {
	@LegatoField()
	name: string

	constructor(name = 'john') {
		super()
		this.name = name
	}
}

export class FindOneEntityTestWithoutDecorator extends LegatoEntity {
	name: string

	constructor(name = 'john') {
		super()
		this.name = name
	}
}
