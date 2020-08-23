import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'

export class InsertTestWithoutDecorator extends LegatoEntity {
	name = 'Legato'
}

export class InsertTest extends LegatoEntity {
	@LegatoField()
	name = 'Legato'
}
