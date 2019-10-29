import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'

export class DeleteEntityTest extends LegatoEntity {
	@LegatoField()
	name: string

	constructor(name: string) {
		super()
		this.name = name
	}
}

export class DeleteEntityTestWithoutDecorator extends LegatoEntity {
	name: string

	constructor() {
		super()
		this.name = 'John'
	}
}
