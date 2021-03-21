import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'

export class DeleteEntityTest extends LegatoEntity {
	@LegatoField()
	name: string = 'john'
}

export class DeleteEntityTestWithoutDecorator extends LegatoEntity {
	name: string = 'john'
}
